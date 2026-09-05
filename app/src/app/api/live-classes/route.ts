import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getReadyDb } from "@/db/index";
import { liveClasses } from "@/db/schema";
import { getSessionUser, requireUser } from "@/lib/auth";
import {
  authErrorResponse,
  listLiveClassesForUser,
} from "@/lib/live-classes";
import { BbbApiError, BbbConfigError, ensureBbbMeeting } from "@/lib/bbb";

export async function GET(request: Request) {
  try {
    const db = await getReadyDb();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const mine = searchParams.get("mine") === "1";

    if (mine) {
      const user = await getSessionUser();
      if (!user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
      let classes = await listLiveClassesForUser(user.id);
      if (
        status === "scheduled" ||
        status === "live" ||
        status === "completed" ||
        status === "cancelled"
      ) {
        classes = classes.filter((c) => c.status === status);
      }
      return NextResponse.json({ classes });
    }

    try {
      await requireUser(["admin"]);
    } catch (error) {
      const { error: msg, status: code } = authErrorResponse(error);
      return NextResponse.json({ error: msg }, { status: code });
    }

    const allClasses =
      status === "scheduled" ||
      status === "live" ||
      status === "completed" ||
      status === "cancelled"
        ? await db.select().from(liveClasses).where(eq(liveClasses.status, status))
        : await db.select().from(liveClasses);

    return NextResponse.json({ classes: allClasses });
  } catch (error) {
    console.error("Error fetching live classes:", error);
    return NextResponse.json({ error: "Error al cargar clases" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    try {
      await requireUser(["admin"]);
    } catch (error) {
      const { error: msg, status: code } = authErrorResponse(error);
      return NextResponse.json({ error: msg }, { status: code });
    }

    const db = await getReadyDb();
    const body = await request.json();
    const { title, scheduledAt, durationMinutes, courseId } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Título requerido" }, { status: 400 });
    }
    if (!scheduledAt) {
      return NextResponse.json({ error: "Fecha y hora requeridas" }, { status: 400 });
    }
    const scheduled = new Date(scheduledAt);
    if (Number.isNaN(scheduled.getTime())) {
      return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
    }
    const duration = Number(durationMinutes);
    if (!Number.isFinite(duration) || duration < 15) {
      return NextResponse.json(
        { error: "Duración mínima de 15 minutos" },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const classId = `liveclass_${Date.now()}`;

    let meetingId: string;
    try {
      ({ meetingId } = await ensureBbbMeeting({
        classId,
        title: title.trim(),
        durationMinutes: duration,
      }));
    } catch (error) {
      if (error instanceof BbbConfigError || error instanceof BbbApiError) {
        return NextResponse.json(
          { error: error.message, detail: error instanceof BbbApiError ? error.details : undefined },
          { status: 503 },
        );
      }
      throw error;
    }

    await db.insert(liveClasses).values({
      id: classId,
      courseId: courseId || null,
      title: title.trim(),
      scheduledAt: scheduled.toISOString(),
      durationMinutes: duration,
      provider: "bbb",
      roomUrl: meetingId,
      dailyRoomUrl: meetingId,
      recordingUrl: null,
      status: "scheduled",
      createdAt: now,
    });

    const [liveClass] = await db.select().from(liveClasses).where(eq(liveClasses.id, classId));

    return NextResponse.json({ liveClass }, { status: 201 });
  } catch (error) {
    console.error("Error creating live class:", error);
    return NextResponse.json({ error: "Error al crear clase" }, { status: 500 });
  }
}
