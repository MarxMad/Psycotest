import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import type { AppDb } from "./index";
import * as schema from "./schema";

export const DEFAULT_ADMIN_EMAIL = (
  process.env.DEFAULT_ADMIN_EMAIL ?? "admin@psycotest.local"
).toLowerCase();
export const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD ?? "psycotest2026";

export type DbErrorCode = "DB_UNAVAILABLE" | "TURSO_MISCONFIGURED" | "SCHEMA_BOOTSTRAP_FAILED";

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

export type DbBackend = "turso" | "sqlite";

export interface DbReadyState {
  backend: DbBackend;
  schemaReady: boolean;
  tursoWarning?: string;
}

const globalBootstrap = globalThis as unknown as {
  __psycotestDbReady?: Promise<DbReadyState>;
};

function dbBackend(): DbBackend {
  return process.env.TURSO_DATABASE_URL ? "turso" : "sqlite";
}

/** Aviso cuando en Vercel no hay Turso (SQLite en /tmp es efímero). */
export function getTursoSetupWarning(): string | undefined {
  if (!process.env.VERCEL || process.env.TURSO_DATABASE_URL) return undefined;
  return (
    "Base de datos temporal en este despliegue. Configure TURSO_DATABASE_URL y " +
    "TURSO_AUTH_TOKEN en Vercel para persistencia entre reinicios."
  );
}

function validateTursoConfig() {
  if (!process.env.TURSO_DATABASE_URL) return;
  if (!process.env.TURSO_AUTH_TOKEN) {
    throw new DbBootstrapError(
      "TURSO_MISCONFIGURED",
      "TURSO_DATABASE_URL está definida pero falta TURSO_AUTH_TOKEN.",
    );
  }
}

async function pushSchemaFresh(db: AppDb) {
  const { generateSQLiteDrizzleJson, generateSQLiteMigration } = await import("drizzle-kit/api");
  const empty = await generateSQLiteDrizzleJson({});
  const target = await generateSQLiteDrizzleJson(schema);
  const statements = await generateSQLiteMigration(empty, target);

  for (const statement of statements) {
    try {
      await Promise.resolve(db.run(sql.raw(statement)));
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes("already exists")) continue;
      throw error;
    }
  }
}

async function pushSchemaTurso(db: AppDb) {
  const { pushSQLiteSchema } = await import("drizzle-kit/api");
  const result = await pushSQLiteSchema(schema, db as never);
  if (result.warnings.length > 0) {
    console.info("[psycotest] push schema:", result.warnings.join("; "));
  }
  await result.apply();
}

async function pushSchema(db: AppDb) {
  if (process.env.TURSO_DATABASE_URL) {
    await pushSchemaTurso(db);
    return;
  }
  await pushSchemaFresh(db);
}

async function runAlter(db: AppDb, statement: string): Promise<void> {
  try {
    await Promise.resolve(db.run(sql.raw(statement)));
    console.info(`[psycotest] schema repair: ${statement}`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const lower = msg.toLowerCase();
    if (
      lower.includes("duplicate column") ||
      lower.includes("already exists") ||
      lower.includes("duplicate column name")
    ) {
      return;
    }
    if (lower.includes("no such table")) return;
    console.warn(`[psycotest] schema repair omitido: ${msg}`);
  }
}

async function usersTableReadable(db: AppDb): Promise<boolean> {
  try {
    await db.select({ id: schema.users.id }).from(schema.users).limit(1);
    return true;
  } catch {
    return false;
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

async function coursesSchemaCompatible(db: AppDb): Promise<boolean> {
  try {
    await db
      .select({
        id: schema.courses.id,
        priceMxn: schema.courses.priceMxn,
        instructorName: schema.courses.instructorName,
        soldCount: schema.courses.soldCount,
        inventoryLimit: schema.courses.inventoryLimit,
        sortOrder: schema.courses.sortOrder,
      })
      .from(schema.courses)
      .limit(1);
    return true;
  } catch {
    return false;
  }
}

async function liveClassesSchemaCompatible(db: AppDb): Promise<boolean> {
  try {
    await db
      .select({
        id: schema.liveClasses.id,
        provider: schema.liveClasses.provider,
        roomUrl: schema.liveClasses.roomUrl,
        dailyRoomUrl: schema.liveClasses.dailyRoomUrl,
        status: schema.liveClasses.status,
      })
      .from(schema.liveClasses)
      .limit(1);
    return true;
  } catch {
    return false;
  }
}

async function repairUsersColumns(db: AppDb): Promise<void> {
  await runAlter(
    db,
    `ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0`,
  );
}

async function repairLiveClassesColumns(db: AppDb): Promise<void> {
  await runAlter(
    db,
    `ALTER TABLE live_classes ADD COLUMN provider TEXT NOT NULL DEFAULT 'none'`,
  );
  await runAlter(db, `ALTER TABLE live_classes ADD COLUMN room_url TEXT`);
}

async function repairCoursesColumns(db: AppDb): Promise<void> {
  const alters = [
    `ALTER TABLE courses ADD COLUMN subtitle TEXT`,
    `ALTER TABLE courses ADD COLUMN category_id TEXT`,
    `ALTER TABLE courses ADD COLUMN price_mxn INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE courses ADD COLUMN stripe_price_id TEXT`,
    `ALTER TABLE courses ADD COLUMN thumbnail_url TEXT`,
    `ALTER TABLE courses ADD COLUMN instructor_name TEXT NOT NULL DEFAULT 'Instructor'`,
    `ALTER TABLE courses ADD COLUMN instructor_bio TEXT`,
    `ALTER TABLE courses ADD COLUMN instructor_id TEXT`,
    `ALTER TABLE courses ADD COLUMN level TEXT NOT NULL DEFAULT 'basico'`,
    `ALTER TABLE courses ADD COLUMN duration_minutes INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE courses ADD COLUMN published INTEGER NOT NULL DEFAULT 1`,
    `ALTER TABLE courses ADD COLUMN inventory_limit INTEGER`,
    `ALTER TABLE courses ADD COLUMN sold_count INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE courses ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0`,
  ];
  for (const statement of alters) {
    await runAlter(db, statement);
  }
}

async function ensureUsersTableRaw(db: AppDb): Promise<void> {
  await Promise.resolve(
    db.run(sql.raw(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY NOT NULL,
        email TEXT NOT NULL UNIQUE,
        nombre TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        rol TEXT NOT NULL DEFAULT 'psicologo',
        email_verified INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      )
    `)),
  );
  await repairUsersColumns(db);
}

/** Asegura tablas LMS (cursos / vivo) alineadas; Turso suele quedar atrás del schema. */
async function ensureLmsSchema(db: AppDb): Promise<void> {
  const coursesOk = await coursesSchemaCompatible(db);
  const liveOk = await liveClassesSchemaCompatible(db);
  if (coursesOk && liveOk) return;

  try {
    await pushSchema(db);
  } catch (error) {
    console.error("[psycotest] ensureLmsSchema pushSchema falló:", error);
  }

  if (!(await liveClassesSchemaCompatible(db))) {
    await repairLiveClassesColumns(db);
  }
  if (!(await coursesSchemaCompatible(db))) {
    await repairCoursesColumns(db);
  }

  // Crear tablas si no existían (ALTER no las crea).
  if (!(await coursesSchemaCompatible(db)) || !(await liveClassesSchemaCompatible(db))) {
    try {
      await pushSchemaFresh(db);
    } catch (error) {
      console.error("[psycotest] ensureLmsSchema pushSchemaFresh falló:", error);
    }
  }
}

export async function ensureSchema(db: AppDb): Promise<void> {
  const tableExists = await usersTableReadable(db);

  if (!tableExists) {
    try {
      await pushSchema(db);
    } catch (error) {
      console.error("[psycotest] ensureSchema pushSchema falló, intentando SQL raw:", error);
      try {
        await ensureUsersTableRaw(db);
      } catch (rawError) {
        console.error("[psycotest] ensureUsersTableRaw falló:", rawError);
        throw new DbBootstrapError(
          "SCHEMA_BOOTSTRAP_FAILED",
          "No se pudo preparar la base de datos. Verifique Turso o ejecute npm run db:push.",
        );
      }
    }
  }

  if (!(await usersTableReadable(db))) {
    try {
      await ensureUsersTableRaw(db);
    } catch (error) {
      console.error("[psycotest] ensureUsersTableRaw (tabla ausente) falló:", error);
      throw new DbBootstrapError(
        "SCHEMA_BOOTSTRAP_FAILED",
        "La tabla de usuarios no existe tras la migración automática.",
      );
    }
  }

  if (!(await usersSchemaCompatible(db))) {
    await repairUsersColumns(db);
    if (!(await usersSchemaCompatible(db)) && process.env.TURSO_DATABASE_URL) {
      try {
        await pushSchemaTurso(db);
      } catch (error) {
        console.error("[psycotest] pushSchemaTurso repair falló:", error);
      }
    }
  }

  if (!(await usersSchemaCompatible(db))) {
    try {
      await ensureUsersTableRaw(db);
    } catch (error) {
      console.error("[psycotest] ensureUsersTableRaw repair falló:", error);
    }
  }

  if (!(await usersSchemaCompatible(db))) {
    throw new DbBootstrapError(
      "SCHEMA_BOOTSTRAP_FAILED",
      "El esquema de usuarios está incompleto (falta email_verified u otras columnas). Ejecute db:push o revise Turso.",
    );
  }

  await ensureLmsSchema(db);
}

export async function ensureDefaultAdmin(db: AppDb): Promise<void> {
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

  console.info(`[psycotest] Admin inicial creado: ${DEFAULT_ADMIN_EMAIL}`);
}

/** Crea el admin por defecto si alguien intenta entrar con esas credenciales y no existe. */
export async function bootstrapAdminForLogin(
  db: AppDb,
  email: string,
  password: string,
): Promise<void> {
  const normalized = email.toLowerCase().trim();
  if (normalized !== DEFAULT_ADMIN_EMAIL || password !== DEFAULT_ADMIN_PASSWORD) return;

  const [user] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, normalized))
    .limit(1);

  if (user) return;

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

  console.info(`[psycotest] Admin bootstrap en login: ${DEFAULT_ADMIN_EMAIL}`);
}

export async function probeDb(db: AppDb): Promise<void> {
  try {
    await Promise.resolve(db.get(sql`SELECT 1`));
  } catch (error) {
    console.error("[psycotest] probeDb falló:", error);
    throw new DbBootstrapError(
      "DB_UNAVAILABLE",
      "La base de datos no responde. Configure TURSO_DATABASE_URL y TURSO_AUTH_TOKEN en Vercel.",
    );
  }
}

export async function ensureDbReady(db: AppDb): Promise<DbReadyState> {
  validateTursoConfig();
  await probeDb(db);
  await ensureSchema(db);
  await ensureDefaultAdmin(db);

  return {
    backend: dbBackend(),
    schemaReady: true,
    tursoWarning: getTursoSetupWarning(),
  };
}

/** Una sola inicialización por instancia serverless (evita carreras en push). */
export function ensureDbReadyOnce(db: AppDb): Promise<DbReadyState> {
  if (!globalBootstrap.__psycotestDbReady) {
    globalBootstrap.__psycotestDbReady = ensureDbReady(db).catch((error) => {
      globalBootstrap.__psycotestDbReady = undefined;
      throw error;
    });
  }
  return globalBootstrap.__psycotestDbReady;
}
