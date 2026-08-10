import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "fs";
import path from "path";
import * as schema from "./schema";
import { seedIfEmpty } from "./seed";

const globalForDb = globalThis as unknown as { __psycotestDb?: ReturnType<typeof createDb> };

function createDb() {
  const dir = path.join(process.cwd(), "data");
  mkdirSync(dir, { recursive: true });
  const file = process.env.DATABASE_PATH ?? path.join(dir, "psycotest.db");
  const sqlite = new Database(file);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });
  return { db, sqlite, file };
}

export function getDb() {
  if (!globalForDb.__psycotestDb) {
    globalForDb.__psycotestDb = createDb();
    seedIfEmpty(globalForDb.__psycotestDb.db);
  }
  return globalForDb.__psycotestDb.db;
}

export { schema };
