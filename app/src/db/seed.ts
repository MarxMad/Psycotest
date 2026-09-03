import type { AppDb } from "./index";
import { ensureDefaultAdmin } from "./bootstrap";

/** @deprecated Usar ensureDbReady / ensureDefaultAdmin desde bootstrap.ts */
export async function seedIfEmpty(db: AppDb) {
  try {
    await ensureDefaultAdmin(db);
  } catch (error) {
    console.error("[psycotest] seedIfEmpty falló (¿faltan tablas?):", error);
  }
}
