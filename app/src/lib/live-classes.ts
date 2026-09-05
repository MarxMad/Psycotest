import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import {
  courseEnrollments,
  liveClassAttendances,
  liveClasses,
  users,
  type LiveClass,
} from "@/db/schema";
import type { AuthUser } from "@/lib/auth";

const JOIN_EARLY_MS = 15 * 60 * 1000;

export function resolveRoomUrl(
  liveClass: Pick<LiveClass, "roomUrl" | "dailyRoomUrl">,
): string | null {
  return liveClass.roomUrl || liveClass.dailyRoomUrl || null;
}

/** meetingID BBB (o null si aún no hay sala / es URL legacy). */
export function resolveMeetingId(
  liveClass: Pick<LiveClass, "roomUrl" | "dailyRoomUrl" | "provider">,
): string | null {
  const stored = resolveRoomUrl(liveClass);
  if (!stored) return null;
  if (liveClass.provider === "bbb") return stored;
  // Migración: si no es URL http, lo tratamos como meetingID
  if (!/^https?:\/\//i.test(stored)) return stored;
  return null;
}

export function isWithinJoinWindow(liveClass: LiveClass, now = Date.now()): boolean {
  if (liveClass.status === "cancelled" || liveClass.status === "completed") return false;
  if (liveClass.status === "live") return true;
  const start = new Date(liveClass.scheduledAt).getTime();
  if (Number.isNaN(start)) return false;
  const end = start + (liveClass.durationMinutes || 60) * 60 * 1000;
  return now >= start - JOIN_EARLY_MS && now <= end;
}

export function canTransitionStatus(
  from: LiveClass["status"],
  to: LiveClass["status"],
): boolean {
  if (from === to) return true;
  if (from === "scheduled" && (to === "live" || to === "cancelled")) return true;
  if (from === "live" && (to === "completed" || to === "cancelled")) return true;
  return false;
}

export async function userCanAccessLiveClass(
  user: AuthUser,
  liveClass: LiveClass,
): Promise<boolean> {
  if (user.rol === "admin") return true;
  if (!liveClass.courseId) return false;

  const db = getDb();
  const [enrollment] = await db
    .select({ id: courseEnrollments.id })
    .from(courseEnrollments)
    .where(
      and(
        eq(courseEnrollments.userId, user.id),
        eq(courseEnrollments.courseId, liveClass.courseId),
        inArray(courseEnrollments.status, ["active", "completed"]),
      ),
    )
    .limit(1);

  return Boolean(enrollment);
}

export async function listLiveClassesForUser(userId: string): Promise<LiveClass[]> {
  const db = getDb();
  const enrollments = await db
    .select({ courseId: courseEnrollments.courseId })
    .from(courseEnrollments)
    .where(
      and(
        eq(courseEnrollments.userId, userId),
        inArray(courseEnrollments.status, ["active", "completed"]),
      ),
    );

  const courseIds = [...new Set(enrollments.map((e) => e.courseId))];
  if (courseIds.length === 0) return [];

  const classes = await db.select().from(liveClasses);
  return classes
    .filter((c) => c.courseId && courseIds.includes(c.courseId) && c.status !== "cancelled")
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
}

export async function recordJoin(liveClassId: string, userId: string) {
  const db = getDb();
  const now = new Date().toISOString();

  const rows = await db
    .select()
    .from(liveClassAttendances)
    .where(
      and(
        eq(liveClassAttendances.liveClassId, liveClassId),
        eq(liveClassAttendances.userId, userId),
      ),
    );

  const active = rows.find((row) => !row.leftAt);
  if (active) return active;

  const id = `attendance_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  await db.insert(liveClassAttendances).values({
    id,
    liveClassId,
    userId,
    joinedAt: now,
    leftAt: null,
    durationSeconds: null,
  });

  const [row] = await db
    .select()
    .from(liveClassAttendances)
    .where(eq(liveClassAttendances.id, id));
  return row;
}

export async function recordLeave(liveClassId: string, userId: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(liveClassAttendances)
    .where(
      and(
        eq(liveClassAttendances.liveClassId, liveClassId),
        eq(liveClassAttendances.userId, userId),
      ),
    );

  const active = rows.find((row) => !row.leftAt);
  if (!active) return null;

  const leftAt = new Date();
  const joinedAt = new Date(active.joinedAt);
  const durationSeconds = Math.max(
    0,
    Math.round((leftAt.getTime() - joinedAt.getTime()) / 1000),
  );

  await db
    .update(liveClassAttendances)
    .set({ leftAt: leftAt.toISOString(), durationSeconds })
    .where(eq(liveClassAttendances.id, active.id));

  const [updated] = await db
    .select()
    .from(liveClassAttendances)
    .where(eq(liveClassAttendances.id, active.id));
  return updated;
}

export async function listAttendances(liveClassId: string) {
  const db = getDb();
  return db
    .select({
      id: liveClassAttendances.id,
      liveClassId: liveClassAttendances.liveClassId,
      userId: liveClassAttendances.userId,
      joinedAt: liveClassAttendances.joinedAt,
      leftAt: liveClassAttendances.leftAt,
      durationSeconds: liveClassAttendances.durationSeconds,
      nombre: users.nombre,
      email: users.email,
    })
    .from(liveClassAttendances)
    .leftJoin(users, eq(users.id, liveClassAttendances.userId))
    .where(eq(liveClassAttendances.liveClassId, liveClassId));
}

export function authErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message === "FORBIDDEN") {
    return { error: "Sin permiso", status: 403 as const };
  }
  return { error: "No autorizado", status: 401 as const };
}
