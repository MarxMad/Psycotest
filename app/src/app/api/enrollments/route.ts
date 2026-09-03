import { NextResponse } from "next/server";
import { getDb } from "@/db/index";
import { enrollments } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const db = getDb();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const courseId = searchParams.get("courseId");

    let allEnrollments;

    if (userId && courseId) {
      allEnrollments = await db
        .select()
        .from(enrollments)
        .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)));
    } else if (userId) {
      allEnrollments = await db.select().from(enrollments).where(eq(enrollments.userId, userId));
    } else if (courseId) {
      allEnrollments = await db
        .select()
        .from(enrollments)
        .where(eq(enrollments.courseId, courseId));
    } else {
      allEnrollments = await db.select().from(enrollments);
    }

    return NextResponse.json({ enrollments: allEnrollments });
  } catch (error) {
    console.error("Error fetching enrollments:", error);
    return NextResponse.json({ error: "Error al cargar inscripciones" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, courseId } = body;

    const now = new Date().toISOString();
    const enrollmentId = `enroll_${Date.now()}`;

    await db.insert(enrollments).values({
      id: enrollmentId,
      userId,
      courseId,
      status: "active",
      progressPercent: 0,
      enrolledAt: now,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    const [enrollment] = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.id, enrollmentId));

    return NextResponse.json({ enrollment }, { status: 201 });
  } catch (error) {
    console.error("Error creating enrollment:", error);
    return NextResponse.json({ error: "Error al crear inscripción" }, { status: 500 });
  }
}
