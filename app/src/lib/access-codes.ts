import { createHash, randomBytes } from "crypto";
import type { Instrumento } from "@/lib/storage";

const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function pepper(): string {
  return process.env.CODE_PEPPER ?? process.env.AUTH_SECRET ?? "dev-code-pepper-min16chars";
}

export function normalizeAccessCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function hashAccessCodeLookup(normalized: string): string {
  return createHash("sha256").update(`${pepper()}:${normalized}`).digest("hex");
}

/** Formato legible: XXXX-XXXX-XXXX (12 caracteres, sin 0/O/1/I). */
export function generateAccessCodePlain(): string {
  const bytes = randomBytes(12);
  const chars = Array.from(bytes, (b) => CHARSET[b % CHARSET.length]);
  return `${chars.slice(0, 4).join("")}-${chars.slice(4, 8).join("")}-${chars.slice(8, 12).join("")}`;
}

export function formatAccessCodeDisplay(normalized: string): string {
  const clean = normalized.replace(/-/g, "");
  if (clean.length !== 12) return normalized;
  return `${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8, 12)}`;
}

export function hashIp(ip: string): string {
  return createHash("sha256").update(`${pepper()}:ip:${ip}`).digest("hex").slice(0, 32);
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

export const ALL_INSTRUMENTOS: Instrumento[] = ["papi", "hartman", "mabe"];

export function parseAllowedInstruments(raw: unknown): Instrumento[] {
  if (!Array.isArray(raw) || raw.length === 0) return [...ALL_INSTRUMENTOS];
  const set = new Set(raw);
  return ALL_INSTRUMENTOS.filter((i) => set.has(i));
}
