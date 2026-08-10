import bcrypt from "bcryptjs";
import { count } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

export async function seedIfEmpty(db: BetterSQLite3Database<typeof schema>) {
  const [{ value }] = await db.select({ value: count() }).from(schema.users);
  if (value > 0) return;

  const now = new Date().toISOString();
  const email = process.env.DEFAULT_ADMIN_EMAIL ?? "admin@psycotest.local";
  const password = process.env.DEFAULT_ADMIN_PASSWORD ?? "psycotest2026";
  const hash = await bcrypt.hash(password, 10);

  await db.insert(schema.users).values({
    id: "user-admin",
    email,
    nombre: "Administrador",
    passwordHash: hash,
    rol: "admin",
    createdAt: now,
  });

  console.info(`[psycotest] Usuario inicial: ${email} / ${password}`);
}
