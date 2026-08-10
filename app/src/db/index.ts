import { mkdirSync } from "fs";
import path from "path";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { seedIfEmpty } from "./seed";

/** Tipo unificado para Drizzle; en runtime puede ser SQLite local o Turso. */
export type AppDb = BetterSQLite3Database<typeof schema>;

const globalForDb = globalThis as unknown as { __psycotestDb?: AppDb };

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

  const dir = path.join(process.cwd(), "data");
  mkdirSync(dir, { recursive: true });
  const file = process.env.DATABASE_PATH ?? path.join(dir, "psycotest.db");
  const sqlite = new Database(file);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return drizzle(sqlite, { schema });
}

export function getDb(): AppDb {
  if (!globalForDb.__psycotestDb) {
    globalForDb.__psycotestDb = createDb();
    void seedIfEmpty(globalForDb.__psycotestDb);
  }
  return globalForDb.__psycotestDb;
}

export { schema };
