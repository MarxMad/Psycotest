import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import type { AppDb } from "./index";
import * as schema from "./schema";

/**
 * Admin inicial. Sin valores por defecto a propósito: una credencial escrita
 * en el código es una puerta abierta en producción. Si no se configuran,
 * no se crea ninguna cuenta y los admins entran por Privy con ADMIN_EMAILS.
 */
export const DEFAULT_ADMIN_EMAIL = (process.env.DEFAULT_ADMIN_EMAIL ?? "").toLowerCase().trim();
export const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD ?? "";

export type DbErrorCode =
  | "DB_UNAVAILABLE"
  | "SUPABASE_MISCONFIGURED"
  | "SCHEMA_BOOTSTRAP_FAILED";

export class DbBootstrapError extends Error {
  readonly code: DbErrorCode;
  readonly status: number;

  constructor(code: DbErrorCode, message: string, status = 503) {
    super(message);
    this.name = "DbBootstrapError";
    this.code = code;
    this.status = status;
  }
}

export type DbBackend = "supabase" | "postgres";

export interface DbReadyState {
  backend: DbBackend;
  schemaReady: boolean;
  persistenceWarning?: string;
}

const globalBootstrap = globalThis as unknown as {
  __sistemapsicDbReady?: Promise<DbReadyState>;
};

function dbBackend(): DbBackend {
  const url = process.env.DATABASE_URL ?? "";
  return url.includes("supabase") ? "supabase" : "postgres";
}

export function getPersistenceWarning(): string | undefined {
  if (!process.env.VERCEL) return undefined;
  if (process.env.DATABASE_URL) return undefined;
  return (
    "Sin DATABASE_URL en Vercel no hay persistencia. Configure la connection string " +
    "de Supabase (Project Settings → Database → URI)."
  );
}

/** @deprecated use getPersistenceWarning */
export function getTursoSetupWarning(): string | undefined {
  return getPersistenceWarning();
}

function validateDatabaseConfig() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new DbBootstrapError(
      "SUPABASE_MISCONFIGURED",
      "Falta DATABASE_URL. En producción use la URI de Supabase; en local docker compose o .env.local.",
    );
  }
  if (url.includes("user:password") || url.includes("[YOUR-PASSWORD]")) {
    throw new DbBootstrapError(
      "SUPABASE_MISCONFIGURED",
      "DATABASE_URL parece un placeholder. Reemplace usuario/contraseña por los de su proyecto Supabase.",
    );
  }
}

async function usersSchemaCompatible(db: AppDb): Promise<boolean> {
  try {
    await db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        nombre: schema.users.nombre,
        passwordHash: schema.users.passwordHash,
        rol: schema.users.rol,
        emailVerified: schema.users.emailVerified,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .limit(1);
    return true;
  } catch {
    return false;
  }
}

export async function ensureSchema(db: AppDb): Promise<void> {
  if (await usersSchemaCompatible(db)) return;

  // Intento automático con drizzle-kit (local / primera vez). En Vercel preferir SQL ya aplicado.
  try {
    const api = (await import("drizzle-kit/api")) as unknown as {
      pushSchema?: (
        imports: Record<string, unknown>,
        drizzleInstance: unknown,
      ) => Promise<{ warnings: string[]; apply: () => Promise<void> }>;
      pushPostgresSchema?: (
        imports: Record<string, unknown>,
        drizzleInstance: unknown,
      ) => Promise<{ warnings: string[]; apply: () => Promise<void> }>;
    };
    const push = api.pushSchema ?? api.pushPostgresSchema;
    if (push) {
      const result = await push(schema as unknown as Record<string, unknown>, db);
      if (result.warnings?.length) {
        console.info("[sistemapsic] push schema:", result.warnings.join("; "));
      }
      await result.apply();
    }
  } catch (error) {
    console.error("[sistemapsic] pushSchema automático falló:", error);
  }

  if (!(await usersSchemaCompatible(db))) {
    throw new DbBootstrapError(
      "SCHEMA_BOOTSTRAP_FAILED",
      "El esquema no está aplicado. Ejecute docs/supabase_init.sql en el SQL Editor de Supabase " +
        "o `npm run db:push` con DATABASE_URL.",
    );
  }
}

export async function ensureDefaultAdmin(db: AppDb): Promise<void> {
  // Sin credenciales configuradas no se siembra nada.
  if (!DEFAULT_ADMIN_EMAIL || !DEFAULT_ADMIN_PASSWORD) return;

  const [existing] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, DEFAULT_ADMIN_EMAIL))
    .limit(1);

  if (existing) return;

  const now = new Date().toISOString();
  const hash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);

  await db
    .insert(schema.users)
    .values({
      id: "user-admin",
      email: DEFAULT_ADMIN_EMAIL,
      nombre: "Administrador",
      passwordHash: hash,
      rol: "admin",
      createdAt: now,
    })
    .onConflictDoNothing();

  console.info(`[sistemapsic] Admin inicial creado: ${DEFAULT_ADMIN_EMAIL}`);
}

export async function bootstrapAdminForLogin(
  db: AppDb,
  email: string,
  password: string,
): Promise<void> {
  if (!DEFAULT_ADMIN_EMAIL || !DEFAULT_ADMIN_PASSWORD) return;

  const normalized = email.toLowerCase().trim();
  const isDefault = normalized === DEFAULT_ADMIN_EMAIL && password === DEFAULT_ADMIN_PASSWORD;
  if (!isDefault) return;

  const [user] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, normalized))
    .limit(1);

  if (user) return;

  const now = new Date().toISOString();
  const hash = await bcrypt.hash(password, 10);

  await db
    .insert(schema.users)
    .values({
      id: "user-admin",
      email: normalized,
      nombre: "Administrador",
      passwordHash: hash,
      rol: "admin",
      createdAt: now,
    })
    .onConflictDoNothing();

  console.info(`[sistemapsic] Admin bootstrap en login: ${normalized}`);
}

export async function probeDb(db: AppDb): Promise<void> {
  try {
    await db.execute(sql`SELECT 1`);
  } catch (error) {
    console.error("[sistemapsic] probeDb falló:", error);
    throw new DbBootstrapError(
      "DB_UNAVAILABLE",
      "La base de datos no responde. Configure DATABASE_URL (Supabase) en Vercel / .env.local.",
    );
  }
}

/**
 * En producción el esquema ya está aplicado con las migraciones de docs/.
 * Correr aquí un push de drizzle-kit más la siembra de datos demo ocupaba
 * la única conexión del pool en cada arranque en frío, y la consulta real
 * de la petición moría con «statement timeout». Migrar en caliente además
 * no es algo que deba pasar sirviendo tráfico.
 */
function enProduccion(): boolean {
  return process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
}

export async function ensureDbReady(db: AppDb): Promise<DbReadyState> {
  validateDatabaseConfig();
  await probeDb(db);

  if (!enProduccion()) {
    await ensureSchema(db);
    await ensureDefaultAdmin(db);
    try {
      const { seedDemoCourse } = await import("./seed-lms");
      await seedDemoCourse(db);
    } catch (error) {
      console.error("[sistemapsic] seedDemoCourse falló:", error);
    }
  }

  return {
    backend: dbBackend(),
    schemaReady: true,
    persistenceWarning: getPersistenceWarning(),
  };
}

export function ensureDbReadyOnce(db: AppDb): Promise<DbReadyState> {
  if (!globalBootstrap.__sistemapsicDbReady) {
    globalBootstrap.__sistemapsicDbReady = ensureDbReady(db).catch((error) => {
      globalBootstrap.__sistemapsicDbReady = undefined;
      throw error;
    });
  }
  return globalBootstrap.__sistemapsicDbReady;
}
