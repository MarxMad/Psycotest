import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getEnrollmentBySlug, markLessonProgress } from "@/lib/course-access";
import { getCourseBySlug, getLessonInCourse } from "@/lib/courses";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const courseSlug = searchParams.get("courseSlug");
  if (!courseSlug) {
    return NextResponse.json({ error: "courseSlug requerido" }, { status: 400 });
  }

  const row = await getEnrollmentBySlug(user.id, courseSlug);
  if (!row) return NextResponse.json({ error: "Sin inscripción" }, { status: 404 });

  return NextResponse.json({
    progressPercent: row.enrollment.progressPercent,
    enrollmentId: row.enrollment.id,
    status: row.enrollment.status,
  });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = (await request.json()) as {
    courseSlug?: string;
    lessonId?: string;
    completed?: boolean;
    positionSeconds?: number;
  };

  if (!body.courseSlug || !body.lessonId) {
    return NextResponse.json({ error: "courseSlug y lessonId requeridos" }, { status: 400 });
  }

  const lessonRow = await getLessonInCourse(body.courseSlug, body.lessonId);
  if (!lessonRow) return NextResponse.json({ error: "Lección no encontrada" }, { status: 404 });

  const enrolled = await getEnrollmentBySlug(user.id, body.courseSlug);
  if (!enrolled && !lessonRow.lesson.freePreview) {
    return NextResponse.json({ error: "Sin inscripción activa" }, { status: 403 });
  }

  if (!enrolled) {
    return NextResponse.json({ progressPercent: 0, preview: true });
  }

  const progressPercent = await markLessonProgress({
    enrollmentId: enrolled.enrollment.id,
    lessonId: body.lessonId,
    courseId: lessonRow.course.id,
    completed: body.completed,
    positionSeconds: body.positionSeconds,
  });

  return NextResponse.json({ progressPercent });
}
