import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getReadyDb } from "@/db/index";
import { liveClasses } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import {
  isWithinJoinWindow,
  recordJoin,
  resolveMeetingId,
  userCanAccessLiveClass,
} from "@/lib/live-classes";
import {
  BbbApiError,
  BbbConfigError,
  buildBbbJoinUrl,
  ensureBbbMeeting,
} from "@/lib/bbb";

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

    let meetingId = resolveMeetingId(liveClass);
    try {
      if (!meetingId) {
        ({ meetingId } = await ensureBbbMeeting({
          classId: liveClass.id,
          title: liveClass.title,
          durationMinutes: liveClass.durationMinutes,
        }));
        await db
          .update(liveClasses)
          .set({ provider: "bbb", roomUrl: meetingId, dailyRoomUrl: meetingId })
          .where(eq(liveClasses.id, liveClass.id));
      } else {
        // Asegura que la reunión exista en el servidor BBB (idempotente)
        await ensureBbbMeeting({
          classId: liveClass.id,
          title: liveClass.title,
          durationMinutes: liveClass.durationMinutes,
        });
        if (liveClass.provider !== "bbb") {
          await db
            .update(liveClasses)
            .set({ provider: "bbb", roomUrl: meetingId, dailyRoomUrl: meetingId })
            .where(eq(liveClasses.id, liveClass.id));
        }
      }
    } catch (error) {
      if (error instanceof BbbConfigError || error instanceof BbbApiError) {
        return NextResponse.json(
          { error: error.message, detail: error instanceof BbbApiError ? error.details : undefined },
          { status: 503 },
        );
      }
      throw error;
    }

    const role = user.rol === "admin" ? "moderator" : "viewer";
    const joinUrl = buildBbbJoinUrl({
      meetingId,
      fullName: user.nombre || user.email,
      role,
      userId: user.id,
    });

    const attendance = await recordJoin(liveClass.id, user.id);

    return NextResponse.json({
      provider: "bbb",
      meetingId,
      joinUrl,
      /** @deprecated usar joinUrl — se mantiene por compatibilidad temporal */
      roomUrl: joinUrl,
      title: liveClass.title,
      status: liveClass.status,
      attendance,
      displayName: user.nombre,
      role,
    });
  } catch (error) {
    console.error("Error joining live class:", error);
    return NextResponse.json({ error: "Error al unirse a la sala" }, { status: 500 });
  }
}
