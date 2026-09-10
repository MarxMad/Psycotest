import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import type { AppDb } from "./index";
import * as schema from "./schema";

export const DEFAULT_ADMIN_EMAIL = (
  process.env.DEFAULT_ADMIN_EMAIL ?? "admin@sistemapsic.local"
).toLowerCase();
export const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD ?? "sistemapsic2026";

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
    // SELECT completo: un check parcial marcaba OK aunque faltara `status`.
    await db.select().from(schema.courses).limit(1);
    return true;
  } catch {
    return false;
  }
}

async function liveClassesSchemaCompatible(db: AppDb): Promise<boolean> {
  try {
    await db.select().from(schema.liveClasses).limit(1);
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

async function ensureLiveClassesTables(db: AppDb): Promise<void> {
  await Promise.resolve(
    db.run(sql.raw(`
      CREATE TABLE IF NOT EXISTS live_classes (
        id TEXT PRIMARY KEY NOT NULL,
        course_id TEXT REFERENCES courses(id),
        title TEXT NOT NULL,
        scheduled_at TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL DEFAULT 60,
        provider TEXT NOT NULL DEFAULT 'none',
        room_url TEXT,
        daily_room_url TEXT,
        recording_url TEXT,
        status TEXT NOT NULL DEFAULT 'scheduled',
        created_at TEXT NOT NULL
      )
    `)),
  );
  await Promise.resolve(
    db.run(sql.raw(`
      CREATE TABLE IF NOT EXISTS live_class_attendances (
        id TEXT PRIMARY KEY NOT NULL,
        live_class_id TEXT NOT NULL REFERENCES live_classes(id),
        user_id TEXT NOT NULL REFERENCES users(id),
        joined_at TEXT NOT NULL,
        left_at TEXT,
        duration_seconds INTEGER,
        connected_seconds INTEGER NOT NULL DEFAULT 0,
        presence_percent INTEGER NOT NULL DEFAULT 0,
        last_heartbeat_at TEXT
      )
    `)),
  );
  await runAlter(
    db,
    `ALTER TABLE live_classes ADD COLUMN provider TEXT NOT NULL DEFAULT 'none'`,
  );
  await runAlter(db, `ALTER TABLE live_classes ADD COLUMN room_url TEXT`);
  await runAlter(db, `ALTER TABLE live_classes ADD COLUMN daily_room_url TEXT`);
  await runAlter(db, `ALTER TABLE live_classes ADD COLUMN recording_url TEXT`);
  await runAlter(
    db,
    `ALTER TABLE live_class_attendances ADD COLUMN connected_seconds INTEGER NOT NULL DEFAULT 0`,
  );
  await runAlter(
    db,
    `ALTER TABLE live_class_attendances ADD COLUMN presence_percent INTEGER NOT NULL DEFAULT 0`,
  );
  await runAlter(db, `ALTER TABLE live_class_attendances ADD COLUMN last_heartbeat_at TEXT`);
}

async function ensureConocerTables(db: AppDb): Promise<void> {
  const statements = [
    `CREATE TABLE IF NOT EXISTS live_breakout_rooms (
      id TEXT PRIMARY KEY NOT NULL,
      live_class_id TEXT NOT NULL REFERENCES live_classes(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      room_slug TEXT NOT NULL,
      room_url TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS live_breakout_assignments (
      id TEXT PRIMARY KEY NOT NULL,
      breakout_room_id TEXT NOT NULL REFERENCES live_breakout_rooms(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id),
      assigned_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS live_whiteboard_docs (
      id TEXT PRIMARY KEY NOT NULL,
      live_class_id TEXT NOT NULL REFERENCES live_classes(id) ON DELETE CASCADE,
      breakout_room_id TEXT REFERENCES live_breakout_rooms(id) ON DELETE CASCADE,
      document_json TEXT,
      updated_by TEXT REFERENCES users(id),
      updated_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS live_whiteboard_snapshots (
      id TEXT PRIMARY KEY NOT NULL,
      live_class_id TEXT NOT NULL REFERENCES live_classes(id) ON DELETE CASCADE,
      breakout_room_id TEXT REFERENCES live_breakout_rooms(id) ON DELETE SET NULL,
      label TEXT NOT NULL DEFAULT 'Captura',
      image_data TEXT NOT NULL,
      created_by TEXT REFERENCES users(id),
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS live_icebreaker_sessions (
      id TEXT PRIMARY KEY NOT NULL,
      live_class_id TEXT NOT NULL REFERENCES live_classes(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      prompt TEXT NOT NULL,
      state_json TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'active',
      created_by TEXT REFERENCES users(id),
      created_at TEXT NOT NULL,
      closed_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS vod_events (
      id TEXT PRIMARY KEY NOT NULL,
      enrollment_id TEXT NOT NULL REFERENCES course_enrollments(id) ON DELETE CASCADE,
      lesson_id TEXT NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      position_seconds INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS course_quizzes (
      id TEXT PRIMARY KEY NOT NULL,
      lesson_id TEXT NOT NULL UNIQUE REFERENCES course_lessons(id) ON DELETE CASCADE,
      pass_score INTEGER NOT NULL DEFAULT 70,
      max_attempts INTEGER NOT NULL DEFAULT 3,
      shuffle_questions INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS quiz_questions (
      id TEXT PRIMARY KEY NOT NULL,
      quiz_id TEXT NOT NULL REFERENCES course_quizzes(id) ON DELETE CASCADE,
      prompt TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'single',
      options TEXT NOT NULL DEFAULT '[]',
      correct_keys TEXT NOT NULL DEFAULT '[]',
      explanation TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS quiz_attempts (
      id TEXT PRIMARY KEY NOT NULL,
      enrollment_id TEXT NOT NULL REFERENCES course_enrollments(id) ON DELETE CASCADE,
      quiz_id TEXT NOT NULL REFERENCES course_quizzes(id) ON DELETE CASCADE,
      answers TEXT NOT NULL DEFAULT '{}',
      score INTEGER NOT NULL DEFAULT 0,
      passed INTEGER NOT NULL DEFAULT 0,
      attempt_number INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS certification_programs (
      id TEXT PRIMARY KEY NOT NULL,
      course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      code TEXT NOT NULL,
      title TEXT NOT NULL,
      version TEXT NOT NULL DEFAULT '1.0',
      description TEXT,
      min_presence_percent INTEGER NOT NULL DEFAULT 80,
      min_aprovechamiento_percent INTEGER NOT NULL DEFAULT 70,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS student_expedientes (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id),
      program_id TEXT NOT NULL REFERENCES certification_programs(id),
      enrollment_id TEXT REFERENCES course_enrollments(id),
      status TEXT NOT NULL DEFAULT 'abierto',
      aprovechamiento_percent INTEGER NOT NULL DEFAULT 0,
      presence_percent_avg INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS expediente_evaluations (
      id TEXT PRIMARY KEY NOT NULL,
      expediente_id TEXT NOT NULL REFERENCES student_expedientes(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      answers_json TEXT NOT NULL DEFAULT '{}',
      score INTEGER,
      submitted_at TEXT NOT NULL,
      reviewed_by TEXT REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS portfolio_evidences (
      id TEXT PRIMARY KEY NOT NULL,
      expediente_id TEXT NOT NULL REFERENCES student_expedientes(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      evidence_type TEXT NOT NULL DEFAULT 'documento',
      file_url TEXT,
      meta_json TEXT,
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS course_certificates (
      id TEXT PRIMARY KEY NOT NULL,
      expediente_id TEXT REFERENCES student_expedientes(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      course_id TEXT NOT NULL REFERENCES courses(id),
      folio TEXT NOT NULL UNIQUE,
      verification_code TEXT NOT NULL UNIQUE,
      dictamen_json TEXT,
      issued_at TEXT NOT NULL,
      revoked_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS legal_documents (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body_markdown TEXT NOT NULL,
      version TEXT NOT NULL DEFAULT '1.0',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS legal_acknowledgements (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id),
      document_id TEXT NOT NULL REFERENCES legal_documents(id),
      acknowledged_at TEXT NOT NULL,
      ip_hash TEXT
    )`,
  ];

  for (const statement of statements) {
    try {
      await Promise.resolve(db.run(sql.raw(statement)));
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (!msg.toLowerCase().includes("already exists")) {
        console.warn(`[psycotest] ensureConocerTables: ${msg}`);
      }
    }
  }

  await runAlter(db, `ALTER TABLE course_lessons ADD COLUMN type TEXT NOT NULL DEFAULT 'video'`);
  await runAlter(db, `ALTER TABLE course_lessons ADD COLUMN content_markdown TEXT`);
  await runAlter(
    db,
    `ALTER TABLE lesson_progress ADD COLUMN watched_seconds INTEGER NOT NULL DEFAULT 0`,
  );
  await runAlter(
    db,
    `ALTER TABLE lesson_progress ADD COLUMN permanence_percent INTEGER NOT NULL DEFAULT 0`,
  );
  await runAlter(
    db,
    `ALTER TABLE coupons ADD COLUMN grant_on_course_complete INTEGER NOT NULL DEFAULT 0`,
  );
  await runAlter(db, `ALTER TABLE coupons ADD COLUMN source_enrollment_id TEXT`);
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
    `ALTER TABLE courses ADD COLUMN status TEXT NOT NULL DEFAULT 'draft'`,
    `ALTER TABLE courses ADD COLUMN inventory_limit INTEGER`,
    `ALTER TABLE courses ADD COLUMN sold_count INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE courses ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE courses ADD COLUMN require_quiz_pass INTEGER NOT NULL DEFAULT 0`,
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
    await ensureLiveClassesTables(db);
  }
  if (!(await coursesSchemaCompatible(db))) {
    await repairCoursesColumns(db);
  }

  // Último intento: migración fresh si aún falla.
  if (!(await coursesSchemaCompatible(db)) || !(await liveClassesSchemaCompatible(db))) {
    try {
      await pushSchemaFresh(db);
    } catch (error) {
      console.error("[psycotest] ensureLmsSchema pushSchemaFresh falló:", error);
    }
    if (!(await liveClassesSchemaCompatible(db))) {
      await ensureLiveClassesTables(db);
    }
    if (!(await coursesSchemaCompatible(db))) {
      await repairCoursesColumns(db);
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
  await ensureConocerTables(db);
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
  const legacyEmail = "admin@psycotest.local";
  const legacyPass = "psycotest2026";
  const isDefault =
    (normalized === DEFAULT_ADMIN_EMAIL && password === DEFAULT_ADMIN_PASSWORD) ||
    (normalized === legacyEmail && password === legacyPass);
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

  try {
    const { seedPlatformCatalog } = await import("./seed-catalog");
    await seedPlatformCatalog(db);
  } catch (error) {
    console.error("[sistemapsic] seedPlatformCatalog falló (no bloquea arranque):", error);
  }

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
