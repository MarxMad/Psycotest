import { createHash } from "crypto";

export type BbbRole = "moderator" | "viewer";

export class BbbConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BbbConfigError";
  }
}

export class BbbApiError extends Error {
  readonly details?: string;
  constructor(message: string, details?: string) {
    super(message);
    this.name = "BbbApiError";
    this.details = details;
  }
}

type ChecksumAlgo = "sha1" | "sha256";

type BbbConfig = {
  apiRoot: string;
  secret: string;
  algorithm: ChecksumAlgo;
};

function getConfig(): BbbConfig {
  const rawUrl = process.env.BBB_URL?.trim();
  const secret = process.env.BBB_SECRET?.trim();
  if (!rawUrl || !secret) {
    throw new BbbConfigError(
      "BigBlueButton no está configurado. Define BBB_URL y BBB_SECRET en el entorno.",
    );
  }

  const base = rawUrl.replace(/\/$/, "");
  const apiRoot = base.endsWith("/api")
    ? base
    : base.endsWith("/bigbluebutton")
      ? `${base}/api`
      : `${base}/bigbluebutton/api`;

  const algoRaw = (process.env.BBB_CHECKSUM_ALGORITHM || "sha1").toLowerCase();
  const algorithm: ChecksumAlgo = algoRaw === "sha256" ? "sha256" : "sha1";

  return { apiRoot, secret, algorithm };
}

export function isBbbConfigured(): boolean {
  return Boolean(process.env.BBB_URL?.trim() && process.env.BBB_SECRET?.trim());
}

/** meetingID estable y válido para BBB (sin espacios raros). */
export function meetingIdForClass(classId: string): string {
  const cleaned = classId.replace(/[^a-zA-Z0-9-_]/g, "").slice(-48);
  return `psycotest-${cleaned || Date.now().toString(36)}`;
}

function passwordsForMeeting(meetingId: string, secret: string) {
  const moderatorPW = createHash("sha1")
    .update(`${secret}:mod:${meetingId}`)
    .digest("hex")
    .slice(0, 16);
  const attendeePW = createHash("sha1")
    .update(`${secret}:att:${meetingId}`)
    .digest("hex")
    .slice(0, 16);
  return { moderatorPW, attendeePW };
}

function checksum(callName: string, queryString: string, secret: string, algorithm: ChecksumAlgo) {
  return createHash(algorithm)
    .update(`${callName}${queryString}${secret}`)
    .digest("hex");
}

function buildQuery(params: Record<string, string | number | boolean | undefined | null>) {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    usp.set(key, String(value));
  }
  return usp.toString();
}

function parseXmlTag(xml: string, tag: string): string | undefined {
  const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`, "i"));
  return match?.[1];
}

/**
 * Crea (o reutiliza) la reunión en el servidor BBB.
 * Guarda solo el meetingID en DB; las join URLs se firman al entrar.
 */
export async function ensureBbbMeeting(opts: {
  classId: string;
  title: string;
  durationMinutes?: number;
}): Promise<{ meetingId: string }> {
  const config = getConfig();
  const meetingID = meetingIdForClass(opts.classId);
  const { moderatorPW, attendeePW } = passwordsForMeeting(meetingID, config.secret);

  const query = buildQuery({
    name: opts.title.slice(0, 100),
    meetingID,
    moderatorPW,
    attendeePW,
    record: true,
    allowStartStopRecording: true,
    autoStartRecording: false,
    welcome: `<br>Bienvenido a <b>${opts.title}</b> — Psycotest`,
    maxParticipants: 40,
    duration: Math.max(0, Math.round(opts.durationMinutes || 0)),
    logoutURL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
  });

  const sum = checksum("create", query, config.secret, config.algorithm);
  const url = `${config.apiRoot}/create?${query}&checksum=${sum}`;

  const res = await fetch(url, { method: "GET", cache: "no-store" });
  const xml = await res.text();
  const returncode = parseXmlTag(xml, "returncode");
  const messageKey = parseXmlTag(xml, "messageKey");
  const message = parseXmlTag(xml, "message");

  // duplicateWarning = la sala ya existía; también es OK
  if (returncode !== "SUCCESS" && messageKey !== "duplicateWarning") {
    throw new BbbApiError(
      "No se pudo crear la sala en BigBlueButton",
      message || messageKey || xml.slice(0, 240),
    );
  }

  return { meetingId: parseXmlTag(xml, "meetingID") || meetingID };
}

export function buildBbbJoinUrl(opts: {
  meetingId: string;
  fullName: string;
  role: BbbRole;
  userId?: string;
}): string {
  const config = getConfig();
  const { moderatorPW, attendeePW } = passwordsForMeeting(opts.meetingId, config.secret);
  const password = opts.role === "moderator" ? moderatorPW : attendeePW;

  const query = buildQuery({
    fullName: opts.fullName.slice(0, 64) || "Participante",
    meetingID: opts.meetingId,
    password,
    redirect: true,
    userID: opts.userId,
    role: opts.role === "moderator" ? "MODERATOR" : "VIEWER",
  });

  const sum = checksum("join", query, config.secret, config.algorithm);
  return `${config.apiRoot}/join?${query}&checksum=${sum}`;
}

/** Detecta si roomUrl es un meetingID BBB (no una URL Jitsi antigua). */
export function isBbbMeetingStored(roomUrl: string | null | undefined): boolean {
  if (!roomUrl) return false;
  if (/^https?:\/\//i.test(roomUrl)) return false;
  return roomUrl.startsWith("psycotest-") || !roomUrl.includes("/");
}
