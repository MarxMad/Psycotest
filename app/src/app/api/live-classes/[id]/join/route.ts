import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getReadyDb } from "@/db/index";
import { liveClasses } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import {
  buildJitsiRoom,
  isWithinJoinWindow,
  recordJoin,
  resolveRoomUrl,
  userCanAccessLiveClass,
} from "@/lib/live-classes";

export async function POST(_request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const db = await getReadyDb();
    const params = await props.params;
    const [liveClass] = await db.select().from(liveClasses).where(eq(liveClasses.id, params.id));
    if (!liveClass) {
      return NextResponse.json({ error: "Clase no encontrada" }, { status: 404 });
    }

    const allowed = await userCanAccessLiveClass(user, liveClass);
    if (!allowed) {
      return NextResponse.json({ error: "Debes estar inscrito en el curso" }, { status: 403 });
    }

    if (!isWithinJoinWindow(liveClass) && user.rol !== "admin") {
      return NextResponse.json(
        { error: "La sala aún no está disponible. Vuelve cerca de la hora programada." },
        { status: 403 },
      );
    }

    let roomUrl = resolveRoomUrl(liveClass);
    if (!roomUrl) {
      roomUrl = buildJitsiRoom(liveClass.id).roomUrl;
      await db
        .update(liveClasses)
        .set({ provider: "jitsi", roomUrl, dailyRoomUrl: roomUrl })
        .where(eq(liveClasses.id, liveClass.id));
    }

    const attendance = await recordJoin(liveClass.id, user.id);

    return NextResponse.json({
      roomUrl,
      title: liveClass.title,
      status: liveClass.status,
      attendance,
      displayName: user.nombre,
    });
  } catch (error) {
    console.error("Error joining live class:", error);
    return NextResponse.json({ error: "Error al unirse a la sala" }, { status: 500 });
  }
}
