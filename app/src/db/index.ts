import { mkdirSync } from "fs";
import path from "path";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { ensureDbReadyOnce } from "./bootstrap";

/** Tipo unificado Drizzle (Postgres / Supabase). */
export type AppDb = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  __sistemapsicDb?: AppDb;
  __sistemapsicPg?: ReturnType<typeof import("postgres")>;
};

function isNextBuildPhase(): boolean {
  return (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.NEXT_PHASE === "phase-export" ||
    process.env.npm_lifecycle_event === "build"
  );
}

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (url) return url;
  throw new Error(
    "Falta DATABASE_URL. Use la connection string de Supabase (Project Settings → Database) " +
      "o el Postgres local de docker compose (postgresql://postgres:postgres@localhost:5432/sistemapsic).",
  );
}

/** Placeholder solo para evaluar módulos durante `next build` sin DATABASE_URL. */
function createBuildPlaceholderDb(): AppDb {
  const err = () => {
    throw new Error(
      "Falta DATABASE_URL en runtime. Configure la URI de Supabase en Vercel Environment Variables.",
    );
  };
  return new Proxy({} as AppDb, {
    get(_target, prop) {
      if (prop === "then") return undefined;
      return err;
    },
  });
}

function createDb(): AppDb {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const postgres = require("postgres") as typeof import("postgres");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { drizzle } = require("drizzle-orm/postgres-js") as typeof import("drizzle-orm/postgres-js");

  const connectionString = requireDatabaseUrl();
  // Prepare opcional: en pooler de Supabase (6543 / transaction mode) prepare=false es más estable.
  const isPooler = connectionString.includes(":6543") || connectionString.includes("pooler");
  const client = postgres(connectionString, {
    max: process.env.VERCEL ? 1 : 5,
    prepare: !isPooler,
    idle_timeout: 20,
    connect_timeout: 30,
    ssl: connectionString.includes("localhost") ? false : "require",
  });
  globalForDb.__sistemapsicPg = client;
  return drizzle(client, { schema });
}

export function getDb(): AppDb {
  if (!globalForDb.__sistemapsicDb) {
    if (!process.env.DATABASE_URL?.trim() && isNextBuildPhase()) {
      return createBuildPlaceholderDb();
    }
    globalForDb.__sistemapsicDb = createDb();
    void ensureDbReadyOnce(globalForDb.__sistemapsicDb).catch((error) => {
      console.error("[sistemapsic] ensureDbReady falló:", error);
    });
  }
  return globalForDb.__sistemapsicDb;
}

/** Espera a que el schema esté listo antes de consultar. */
export async function getReadyDb(): Promise<AppDb> {
  const db = getDb();
  await ensureDbReadyOnce(db);
  return db;
}

/** Ruta SQLite legacy (solo referencia; la persistencia activa es Postgres/Supabase). */
export function legacySqlitePath(): string {
  if (process.env.DATABASE_PATH) return process.env.DATABASE_PATH;
  if (process.env.VERCEL) return path.join("/tmp", "psycotest.db");
  mkdirSync(path.join(process.cwd(), "data"), { recursive: true });
  return path.join(process.cwd(), "data", "psycotest.db");
}

export { schema };
