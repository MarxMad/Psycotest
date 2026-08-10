import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";

const COOKIE = "psycotest_session";

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET debe tener al menos 16 caracteres");
    }
    return new TextEncoder().encode("dev-secret-psycotest-min16");
  }
  return new TextEncoder().encode(s);
}

export interface AuthUser {
  id: string;
  email: string;
  nombre: string;
  rol: "admin" | "psicologo" | "aplicador";
}

export async function signIn(email: string, password: string): Promise<AuthUser | null> {
  const db = getDb();
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email.toLowerCase().trim()))
    .limit(1);

  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;

  return { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol as AuthUser["rol"] };
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
