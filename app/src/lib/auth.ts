import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import {
  bootstrapAdminForLogin,
  DbBootstrapError,
  ensureDbReadyOnce,
} from "@/db/bootstrap";
import { getDb, schema } from "@/db";

const COOKIE = "psycotest_session";
/** Fallback alineado con middleware — permite login aunque falte AUTH_SECRET en Vercel. */
const FALLBACK_SECRET = "dev-secret-psycotest-min16";

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    if (process.env.NODE_ENV === "production" && !process.env.AUTH_SECRET_WARNED) {
      console.warn(
        "[psycotest] AUTH_SECRET ausente o corto; usando secreto de respaldo. Configure AUTH_SECRET (≥16) en Vercel.",
      );
      process.env.AUTH_SECRET_WARNED = "1";
    }
    return new TextEncoder().encode(FALLBACK_SECRET);
  }
  return new TextEncoder().encode(s);
}

export interface AuthUser {
  id: string;
  email: string;
  nombre: string;
  rol: "admin" | "psicologo" | "aplicador";
}

export type SignInResult =
  | { ok: true; user: AuthUser }
  | { ok: false; reason: "invalid_credentials" }
  | { ok: false; reason: "db_error"; code: string; message: string; status: number };

export async function signIn(email: string, password: string): Promise<SignInResult> {
  const db = getDb();

  try {
    await ensureDbReadyOnce(db);
    await bootstrapAdminForLogin(db, email, password);
  } catch (error) {
    if (error instanceof DbBootstrapError) {
      return {
        ok: false,
        reason: "db_error",
        code: error.code,
        message: error.message,
        status: error.status,
      };
    }
    console.error("[psycotest] signIn bootstrap:", error);
    return {
      ok: false,
      reason: "db_error",
      code: "DB_UNAVAILABLE",
      message: "No se pudo conectar con la base de datos.",
      status: 503,
    };
  }

  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email.toLowerCase().trim()))
    .limit(1);

  if (!user) return { ok: false, reason: "invalid_credentials" };
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return { ok: false, reason: "invalid_credentials" };

  return {
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol as AuthUser["rol"],
    },
  };
}

export async function createSessionToken(user: AuthUser): Promise<string> {
  return new SignJWT({ sub: user.id, email: user.email, nombre: user.nombre, rol: user.rol })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSessionUser(): Promise<AuthUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      id: payload.sub as string,
      email: payload.email as string,
      nombre: payload.nombre as string,
      rol: payload.rol as AuthUser["rol"],
    };
  } catch {
    return null;
  }
}

export async function requireUser(roles?: AuthUser["rol"][]): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");
  if (roles && !roles.includes(user.rol)) throw new Error("FORBIDDEN");
  return user;
}

export async function logAudit(
  userId: string | null,
  action: string,
  entity: string,
  entityId?: string,
  detail?: unknown,
) {
  const db = getDb();
  await db.insert(schema.auditLog).values({
    id: `audit-${Date.now().toString(36)}`,
    userId,
    action,
    entity,
    entityId,
    detail: detail as Record<string, unknown> | undefined,
    createdAt: new Date().toISOString(),
  });
}
