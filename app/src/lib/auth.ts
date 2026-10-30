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
import { PERSONAL, type Rol } from "@/lib/auth-rutas";

import { secretoDeSesion as secret } from "@/lib/auth-secreto";

const COOKIE = "psycotest_session";

export interface AuthUser {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
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

  try {
    const [user] = await db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        nombre: schema.users.nombre,
        passwordHash: schema.users.passwordHash,
        rol: schema.users.rol,
      })
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
  } catch (error) {
    console.error("[psycotest] signIn query:", error);
    return {
      ok: false,
      reason: "db_error",
      code: "SCHEMA_BOOTSTRAP_FAILED",
      message:
        "No se pudo leer la tabla de usuarios. El esquema puede estar desactualizado; revise Turso o reinicie el despliegue.",
      status: 503,
    };
  }
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

/**
 * Usuario de la sesión. La cookie solo dice quién es; el rol se lee de la
 * base en cada llamada, para que quitarle el rol o borrar la cuenta surta
 * efecto de inmediato y no hasta que caduque el token.
 */
export async function getSessionUser(): Promise<AuthUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string") return null;
    const [user] = await getDb()
      .select({
        id: schema.users.id,
        email: schema.users.email,
        nombre: schema.users.nombre,
        rol: schema.users.rol,
      })
      .from(schema.users)
      .where(eq(schema.users.id, payload.sub))
      .limit(1);
    if (!user) return null;
    return { ...user, rol: user.rol as Rol };
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

/** Personal del panel: administrador o psicólogo. */
export function requireStaff(): Promise<AuthUser> {
  return requireUser(PERSONAL);
}

export {
  homePathForUser,
  operaElPanel,
  resolvePostLoginPath,
} from "@/lib/auth-rutas";

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
