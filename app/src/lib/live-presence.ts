import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { liveClassAttendances, liveClasses } from "@/db/schema";

const HEARTBEAT_INTERVAL_SEC = 30;
const MAX_DELTA_SEC = 90;

/** Registra heartbeat de presencia y actualiza % vs duración programada. */
export async function recordHeartbeat(liveClassId: string, userId: string) {
  const db = getDb();
  const now = new Date();
  const nowIso = now.toISOString();

  const [liveClass] = await db.select().from(liveClasses).where(eq(liveClasses.id, liveClassId));
  if (!liveClass) return null;

  const rows = await db
    .select()
    .from(liveClassAttendances)
    .where(
      and(
        eq(liveClassAttendances.liveClassId, liveClassId),
        eq(liveClassAttendances.userId, userId),
      ),
    );

  let active = rows.find((row) => !row.leftAt);
  if (!active) {
    const id = `attendance_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    await db.insert(liveClassAttendances).values({
      id,
      liveClassId,
      userId,
      joinedAt: nowIso,
      leftAt: null,
      durationSeconds: null,
      connectedSeconds: 0,
      presencePercent: 0,
      lastHeartbeatAt: nowIso,
    });
    const [created] = await db
      .select()
      .from(liveClassAttendances)
      .where(eq(liveClassAttendances.id, id));
    active = created;
  }

  if (!active) return null;

  let delta = HEARTBEAT_INTERVAL_SEC;
  if (active.lastHeartbeatAt) {
    const prev = new Date(active.lastHeartbeatAt).getTime();
    const raw = Math.round((now.getTime() - prev) / 1000);
    if (raw > 0 && raw <= MAX_DELTA_SEC) delta = raw;
    else if (raw > MAX_DELTA_SEC) delta = HEARTBEAT_INTERVAL_SEC;
    else delta = 0;
  }

  const connectedSeconds = (active.connectedSeconds || 0) + delta;
  const planned = Math.max(1, (liveClass.durationMinutes || 60) * 60);
  const presencePercent = Math.min(100, Math.round((connectedSeconds / planned) * 100));

  await db
    .update(liveClassAttendances)
    .set({
      connectedSeconds,
      presencePercent,
      lastHeartbeatAt: nowIso,
    })
    .where(eq(liveClassAttendances.id, active.id));

  const [updated] = await db
    .select()
    .from(liveClassAttendances)
    .where(eq(liveClassAttendances.id, active.id));
  return updated;
}

export { HEARTBEAT_INTERVAL_SEC };
