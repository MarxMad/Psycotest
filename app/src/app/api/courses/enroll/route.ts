import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { getSessionUser } from "@/lib/auth";
import { getEnrollment, getEnrollmentBySlug } from "@/lib/course-access";
import { getCourseBySlug } from "@/lib/courses";

async function enrollUser(userId: string, courseSlug: string) {
  const courseRow = await getCourseBySlug(courseSlug);
  if (!courseRow) return { error: "Curso no encontrado", status: 404 as const };

  const existing = await getEnrollment(userId, courseRow.course.id);
  if (existing) {
    return { enrollment: existing, created: false as const };
  }

  const db = getDb();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  await db.insert(schema.courseEnrollments).values({
    id,
    userId,
    courseId: courseRow.course.id,
    status: "active",
    progressPercent: 0,
    enrolledAt: now,
    createdAt: now,
    updatedAt: now,
  });

  const [row] = await db
    .select()
    .from(schema.courseEnrollments)
    .where(eq(schema.courseEnrollments.id, id))
    .limit(1);

  return { enrollment: row!, created: true as const };
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = (await request.json()) as { courseSlug?: string };
  if (!body.courseSlug) {
    return NextResponse.json({ error: "courseSlug requerido" }, { status: 400 });
  }

  try {
    const result = await enrollUser(user.id, body.courseSlug);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ enrollment: result.enrollment, created: result.created });
  } catch (error) {
    console.error("[enroll]", error);
    return NextResponse.json({ error: "No se pudo inscribir" }, { status: 500 });
  }
}

/** CourseCheckout usa PUT en modo desarrollo */
export async function PUT(request: Request) {
  return POST(request);
}
