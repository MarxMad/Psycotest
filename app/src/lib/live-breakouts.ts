import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  liveBreakoutAssignments,
  liveBreakoutRooms,
  liveClassAttendances,
  users,
} from "@/db/schema";
import { buildJitsiRoom } from "@/lib/live-classes";

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export async function listBreakouts(liveClassId: string) {
  const db = getDb();
  const rooms = await db
    .select()
    .from(liveBreakoutRooms)
    .where(eq(liveBreakoutRooms.liveClassId, liveClassId));

  const result = [];
  for (const room of rooms.sort((a, b) => a.sortOrder - b.sortOrder)) {
    const assignments = await db
      .select({
        id: liveBreakoutAssignments.id,
        userId: liveBreakoutAssignments.userId,
        assignedAt: liveBreakoutAssignments.assignedAt,
        nombre: users.nombre,
        email: users.email,
      })
      .from(liveBreakoutAssignments)
      .leftJoin(users, eq(users.id, liveBreakoutAssignments.userId))
      .where(eq(liveBreakoutAssignments.breakoutRoomId, room.id));
    result.push({ ...room, assignments });
  }
  return result;
}

export async function createBreakouts(
  liveClassId: string,
  options: { count?: number; names?: string[]; autoAssign?: boolean } = {},
) {
  const db = getDb();
  const count = Math.max(1, Math.min(12, options.count ?? options.names?.length ?? 2));
  const now = new Date().toISOString();
  const created = [];

  for (let i = 0; i < count; i++) {
    const roomId = id("breakout");
    const { roomSlug, roomUrl } = buildJitsiRoom(`${liveClassId}-b${i}-${roomId}`);
    const name = options.names?.[i] || `Sala ${i + 1}`;
    await db.insert(liveBreakoutRooms).values({
      id: roomId,
      liveClassId,
      name,
      roomSlug,
      roomUrl,
      status: "open",
      sortOrder: i,
      createdAt: now,
    });
    const [row] = await db.select().from(liveBreakoutRooms).where(eq(liveBreakoutRooms.id, roomId));
    created.push(row);
  }

  if (options.autoAssign !== false) {
    await autoAssignParticipants(liveClassId, created.map((r) => r.id));
  }

  return listBreakouts(liveClassId);
}

export async function autoAssignParticipants(liveClassId: string, roomIds: string[]) {
  if (roomIds.length === 0) return;
  const db = getDb();
  const attendances = await db
    .select({ userId: liveClassAttendances.userId })
    .from(liveClassAttendances)
    .where(eq(liveClassAttendances.liveClassId, liveClassId));

  const uniqueUsers = [...new Set(attendances.map((a) => a.userId))];
  const now = new Date().toISOString();

  for (let i = 0; i < uniqueUsers.length; i++) {
    const roomId = roomIds[i % roomIds.length];
    const existing = await db
      .select({ id: liveBreakoutAssignments.id })
      .from(liveBreakoutAssignments)
      .where(
        and(
          eq(liveBreakoutAssignments.breakoutRoomId, roomId),
          eq(liveBreakoutAssignments.userId, uniqueUsers[i]),
        ),
      )
      .limit(1);
    if (existing.length) continue;

    await db.insert(liveBreakoutAssignments).values({
      id: id("bassign"),
      breakoutRoomId: roomId,
      userId: uniqueUsers[i],
      assignedAt: now,
    });
  }
}

export async function assignUser(breakoutRoomId: string, userId: string) {
  const db = getDb();
  const [room] = await db
    .select()
    .from(liveBreakoutRooms)
    .where(eq(liveBreakoutRooms.id, breakoutRoomId));
  if (!room) return null;

  const siblings = await db
    .select()
    .from(liveBreakoutRooms)
    .where(eq(liveBreakoutRooms.liveClassId, room.liveClassId));

  for (const sibling of siblings) {
    await db
      .delete(liveBreakoutAssignments)
      .where(
        and(
          eq(liveBreakoutAssignments.breakoutRoomId, sibling.id),
          eq(liveBreakoutAssignments.userId, userId),
        ),
      );
  }

  const assignmentId = id("bassign");
  await db.insert(liveBreakoutAssignments).values({
    id: assignmentId,
    breakoutRoomId,
    userId,
    assignedAt: new Date().toISOString(),
  });

  return listBreakouts(room.liveClassId);
}

export async function closeAllBreakouts(liveClassId: string) {
  const db = getDb();
  await db
    .update(liveBreakoutRooms)
    .set({ status: "closed" })
    .where(eq(liveBreakoutRooms.liveClassId, liveClassId));
  return listBreakouts(liveClassId);
}

export async function getAssignmentForUser(liveClassId: string, userId: string) {
  const rooms = await listBreakouts(liveClassId);
  for (const room of rooms) {
    if (room.status !== "open") continue;
    if (room.assignments.some((a) => a.userId === userId)) {
      return room;
    }
  }
  return null;
}
