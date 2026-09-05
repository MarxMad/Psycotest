import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getReadyDb } from "@/db/index";
import { courses, liveClasses } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export async function GET() {
  try {
    await requireUser(["admin"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const db = await getReadyDb();
  const report: Record<string, unknown> = {};

  try {
    const tables = await db.all<{ name: string }>(
      sql`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`,
    );
    report.tables = tables.map((t) => t.name);
  } catch (error) {
    report.tablesError = error instanceof Error ? error.message : String(error);
  }

  for (const table of ["courses", "live_classes", "course_enrollments", "users"]) {
    try {
      const cols = await db.all<{ name: string; type: string }>(
        sql.raw(`PRAGMA table_info(${table})`),
      );
      report[`${table}Columns`] = cols.map((c) => `${c.name}:${c.type}`);
    } catch (error) {
      report[`${table}ColumnsError`] = error instanceof Error ? error.message : String(error);
    }
  }

  try {
    await db.select().from(courses).limit(1);
    report.coursesSelect = "ok";
  } catch (error) {
    report.coursesSelect = error instanceof Error ? error.message : String(error);
  }

  try {
    await db.select().from(liveClasses).limit(1);
    report.liveClassesSelect = "ok";
  } catch (error) {
    report.liveClassesSelect = error instanceof Error ? error.message : String(error);
  }

  return NextResponse.json(report);
}
