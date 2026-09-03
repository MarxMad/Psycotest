import bcrypt from "bcryptjs";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

type AppDb = BetterSQLite3Database<typeof schema>;

export async function seedIfEmpty(db: AppDb) {
  try {
    const existing = await db.select({ id: schema.users.id }).from(schema.users).limit(1);
    if (existing.length > 0) return;
  } catch (error) {
    console.error(
      "[psycotest] No se pudo leer users (ejecuta db:push / configura Turso):",
      error,
    );
    return;
  }

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
