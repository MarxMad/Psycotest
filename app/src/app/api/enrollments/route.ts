import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { enrollments } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const courseId = searchParams.get("courseId");

    let query = db.select().from(enrollments);

    if (userId) {
      query = query.where(eq(enrollments.userId, userId));
    }

    if (courseId) {
      query = query.where(eq(enrollments.courseId, courseId));
    }

    const allEnrollments = await query;

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
      progressPercentage: 0,
      enrolledAt: now,
      completedAt: null,
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
