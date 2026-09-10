import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getReadyDb } from "@/db/index";
import { liveClasses } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { userCanAccessLiveClass } from "@/lib/live-classes";
import {
  createSnapshot,
  getWhiteboardDoc,
  listSnapshots,
  saveWhiteboardDoc,
} from "@/lib/live-whiteboard";

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const db = await getReadyDb();
    const params = await props.params;
    const [liveClass] = await db.select().from(liveClasses).where(eq(liveClasses.id, params.id));
    if (!liveClass) return NextResponse.json({ error: "Clase no encontrada" }, { status: 404 });

    const allowed = await userCanAccessLiveClass(user, liveClass);
    if (!allowed) return NextResponse.json({ error: "Sin acceso" }, { status: 403 });

    const url = new URL(request.url);
    const breakoutRoomId = url.searchParams.get("breakoutRoomId");
    const wantSnapshots = url.searchParams.get("snapshots") === "1";

    if (wantSnapshots) {
      const snapshots = await listSnapshots(liveClass.id);
      return NextResponse.json({
        snapshots: snapshots.map((s) => ({
          id: s.id,
          label: s.label,
          createdAt: s.createdAt,
          createdBy: s.createdBy,
          breakoutRoomId: s.breakoutRoomId,
          hasImage: Boolean(s.imageData),
          imageData: s.imageData?.startsWith("data:") ? s.imageData : undefined,
        })),
      });
    }

    const doc = await getWhiteboardDoc(liveClass.id, breakoutRoomId);
    return NextResponse.json({ document: doc });
  } catch (error) {
    console.error("whiteboard GET:", error);
    return NextResponse.json({ error: "Error al cargar pizarra" }, { status: 500 });
  }
}

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const db = await getReadyDb();
    const params = await props.params;
    const [liveClass] = await db.select().from(liveClasses).where(eq(liveClasses.id, params.id));
    if (!liveClass) return NextResponse.json({ error: "Clase no encontrada" }, { status: 404 });

    const allowed = await userCanAccessLiveClass(user, liveClass);
    if (!allowed) return NextResponse.json({ error: "Sin acceso" }, { status: 403 });

    const body = await request.json();
    const action = body.action || "save";

    if (action === "snapshot") {
      if (!body.imageData || typeof body.imageData !== "string") {
        return NextResponse.json({ error: "Falta imageData" }, { status: 400 });
      }
      if (body.imageData.length > 2_500_000) {
        return NextResponse.json({ error: "Imagen demasiado grande" }, { status: 413 });
      }
      const snapshot = await createSnapshot({
        liveClassId: liveClass.id,
        breakoutRoomId: body.breakoutRoomId || null,
        label: body.label,
        imageData: body.imageData,
        userId: user.id,
      });
      return NextResponse.json({
        snapshot: {
          id: snapshot.id,
          label: snapshot.label,
          createdAt: snapshot.createdAt,
        },
      }, { status: 201 });
    }

    if (!body.documentJson || typeof body.documentJson !== "object") {
      return NextResponse.json({ error: "Falta documentJson" }, { status: 400 });
    }

    const document = await saveWhiteboardDoc(
      liveClass.id,
      body.documentJson,
      user.id,
      body.breakoutRoomId || null,
    );
    return NextResponse.json({ document });
  } catch (error) {
    console.error("whiteboard POST:", error);
    return NextResponse.json({ error: "Error al guardar pizarra" }, { status: 500 });
  }
}
