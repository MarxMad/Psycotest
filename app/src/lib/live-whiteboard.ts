import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { liveWhiteboardDocs, liveWhiteboardSnapshots } from "@/db/schema";

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export async function getWhiteboardDoc(liveClassId: string, breakoutRoomId?: string | null) {
  const db = getDb();
  const rows = await db
    .select()
    .from(liveWhiteboardDocs)
    .where(
      breakoutRoomId
        ? and(
            eq(liveWhiteboardDocs.liveClassId, liveClassId),
            eq(liveWhiteboardDocs.breakoutRoomId, breakoutRoomId),
          )
        : and(eq(liveWhiteboardDocs.liveClassId, liveClassId), isNull(liveWhiteboardDocs.breakoutRoomId)),
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function saveWhiteboardDoc(
  liveClassId: string,
  documentJson: Record<string, unknown>,
  userId: string,
  breakoutRoomId?: string | null,
) {
  const db = getDb();
  const now = new Date().toISOString();
  const existing = await getWhiteboardDoc(liveClassId, breakoutRoomId);

  if (existing) {
    await db
      .update(liveWhiteboardDocs)
      .set({ documentJson, updatedBy: userId, updatedAt: now })
      .where(eq(liveWhiteboardDocs.id, existing.id));
    const [row] = await db
      .select()
      .from(liveWhiteboardDocs)
      .where(eq(liveWhiteboardDocs.id, existing.id));
    return row;
  }

  const docId = id("wbdoc");
  await db.insert(liveWhiteboardDocs).values({
    id: docId,
    liveClassId,
    breakoutRoomId: breakoutRoomId || null,
    documentJson,
    updatedBy: userId,
    updatedAt: now,
  });
  const [row] = await db.select().from(liveWhiteboardDocs).where(eq(liveWhiteboardDocs.id, docId));
  return row;
}

export async function createSnapshot(input: {
  liveClassId: string;
  breakoutRoomId?: string | null;
  label?: string;
  imageData: string;
  userId: string;
}) {
  const db = getDb();
  const snapId = id("wbsnap");
  const now = new Date().toISOString();
  await db.insert(liveWhiteboardSnapshots).values({
    id: snapId,
    liveClassId: input.liveClassId,
    breakoutRoomId: input.breakoutRoomId || null,
    label: input.label || `Captura ${new Date().toLocaleString("es-MX")}`,
    imageData: input.imageData,
    createdBy: input.userId,
    createdAt: now,
  });
  const [row] = await db
    .select()
    .from(liveWhiteboardSnapshots)
    .where(eq(liveWhiteboardSnapshots.id, snapId));
  return row;
}

export async function listSnapshots(liveClassId: string) {
  const db = getDb();
  return db
    .select()
    .from(liveWhiteboardSnapshots)
    .where(eq(liveWhiteboardSnapshots.liveClassId, liveClassId));
}
