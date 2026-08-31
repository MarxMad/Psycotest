import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { liveClasses } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = db.select().from(liveClasses);

    if (
      status &&
      (status === "scheduled" || status === "live" || status === "completed" || status === "cancelled")
    ) {
      query = query.where(eq(liveClasses.status, status));
    }

    const allClasses = await query;

    return NextResponse.json({ classes: allClasses });
  } catch (error) {
    console.error("Error fetching live classes:", error);
    return NextResponse.json({ error: "Error al cargar clases" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, scheduledAt, durationMinutes, courseId } = body;

    const now = new Date().toISOString();
    const classId = `liveclass_${Date.now()}`;

    await db.insert(liveClasses).values({
      id: classId,
      courseId: courseId || null,
      title,
      scheduledAt: new Date(scheduledAt).toISOString(),
      durationMinutes,
      dailyRoomUrl: null,
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
