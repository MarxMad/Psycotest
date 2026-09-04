import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Instrumento } from "./storage";

export const APPLICANT_COOKIE = "psycotest_applicant";

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    return new TextEncoder().encode("dev-secret-psycotest-min16");
  }
  return new TextEncoder().encode(s);
}

export interface ApplicantSession {
  redemptionId: string;
  codeId: string;
  nombre: string;
  empresa?: string;
  puesto?: string;
  allowed: Instrumento[];
  completed: Instrumento[];
}

export async function createApplicantToken(session: ApplicantSession): Promise<string> {
  return new SignJWT({
    rid: session.redemptionId,
    cid: session.codeId,
    nombre: session.nombre,
    empresa: session.empresa,
    puesto: session.puesto,
    allowed: session.allowed,
    completed: session.completed,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret());
}

export async function setApplicantCookie(token: string) {
  const jar = await cookies();
  jar.set(APPLICANT_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearApplicantCookie() {
  const jar = await cookies();
  jar.delete(APPLICANT_COOKIE);
}

export async function getApplicantSession(): Promise<ApplicantSession | null> {
  const jar = await cookies();
  const token = jar.get(APPLICANT_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      redemptionId: payload.rid as string,
      codeId: payload.cid as string,
      nombre: payload.nombre as string,
      empresa: (payload.empresa as string) || undefined,
      puesto: (payload.puesto as string) || undefined,
      allowed: (payload.allowed as Instrumento[]) ?? [],
      completed: (payload.completed as Instrumento[]) ?? [],
    };
  } catch {
    return null;
  }
}

export async function refreshApplicantCookie(session: ApplicantSession) {
  const token = await createApplicantToken(session);
  await setApplicantCookie(token);
}

export function canTakeInstrument(session: ApplicantSession, instrumento: Instrumento): boolean {
  return session.allowed.includes(instrumento) && !session.completed.includes(instrumento);
}

/** Verifica JWT desde Request (middleware / route handlers). */
export async function verifyApplicantToken(token: string): Promise<ApplicantSession | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      redemptionId: payload.rid as string,
      codeId: payload.cid as string,
      nombre: payload.nombre as string,
      empresa: (payload.empresa as string) || undefined,
      puesto: (payload.puesto as string) || undefined,
      allowed: (payload.allowed as Instrumento[]) ?? [],
      completed: (payload.completed as Instrumento[]) ?? [],
    };
  } catch {
    return null;
  }
}
