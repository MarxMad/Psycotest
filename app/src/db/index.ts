import { mkdirSync } from "fs";
import path from "path";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { ensureDbReadyOnce } from "./bootstrap";

/** Tipo unificado para Drizzle; en runtime puede ser SQLite local o Turso. */
export type AppDb = BetterSQLite3Database<typeof schema>;

const globalForDb = globalThis as unknown as { __psycotestDb?: AppDb };

function sqlitePath(): string {
  if (process.env.DATABASE_PATH) return process.env.DATABASE_PATH;
  // En Vercel el filesystem de la app es de solo lectura; usar /tmp.
  if (process.env.VERCEL) {
    return path.join("/tmp", "psycotest.db");
  }
  return path.join(process.cwd(), "data", "psycotest.db");
}

function createDb(): AppDb {
  const tursoUrl = process.env.TURSO_DATABASE_URL;

  if (tursoUrl) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } = require("@libsql/client") as typeof import("@libsql/client");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { drizzle } = require("drizzle-orm/libsql") as typeof import("drizzle-orm/libsql");

    const client = createClient({
      url: tursoUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    return drizzle(client, { schema }) as unknown as AppDb;
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require("better-sqlite3") as typeof import("better-sqlite3");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { drizzle } = require("drizzle-orm/better-sqlite3") as typeof import("drizzle-orm/better-sqlite3");

  const file = sqlitePath();
  mkdirSync(path.dirname(file), { recursive: true });
  const sqlite = new Database(file);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return drizzle(sqlite, { schema });
}

export function getDb(): AppDb {
  if (!globalForDb.__psycotestDb) {
    globalForDb.__psycotestDb = createDb();
    void ensureDbReadyOnce(globalForDb.__psycotestDb).catch((error) => {
      console.error("[psycotest] ensureDbReady falló:", error);
    });
  }
  return globalForDb.__psycotestDb;
}

/** Espera a que el schema (users + LMS) esté listo antes de consultar. */
export async function getReadyDb(): Promise<AppDb> {
  const db = getDb();
  await ensureDbReadyOnce(db);
  return db;
}

export { schema };
