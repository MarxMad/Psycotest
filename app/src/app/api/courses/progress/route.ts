import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getEnrollmentBySlug, getPlayerState, markLessonProgress } from "@/lib/course-access";
import { getCourseBySlug, getLessonInCourse } from "@/lib/courses";

export async function GET(request: Request) {
  const user = await getSessionUser();
  const { searchParams } = new URL(request.url);
  const courseSlug = searchParams.get("courseSlug");
  if (!courseSlug) return NextResponse.json({ error: "courseSlug requerido" }, { status: 400 });

  if (!user) {
    return NextResponse.json({ enrolled: false, progressPercent: 0 });
  }

  const row = await getEnrollmentBySlug(user.id, courseSlug);
  if (!row) {
    return NextResponse.json({ enrolled: false, progressPercent: 0 });
  }

  return NextResponse.json({
    enrolled: row.enrollment.status === "active",
    progressPercent: row.enrollment.progressPercent,
    enrollmentId: row.enrollment.id,
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
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const enrollmentRow = await getEnrollmentBySlug(user.id, body.courseSlug);
  if (!enrollmentRow || enrollmentRow.enrollment.status !== "active") {
    return NextResponse.json({ error: "No inscrito en este curso" }, { status: 403 });
  }

  const lessonRow = await getLessonInCourse(body.courseSlug, body.lessonId);
  if (!lessonRow) return NextResponse.json({ error: "Clase no encontrada" }, { status: 404 });

  const percent = await markLessonProgress({
    enrollmentId: enrollmentRow.enrollment.id,
    lessonId: body.lessonId,
    courseId: enrollmentRow.course.id,
    completed: body.completed,
    positionSeconds: body.positionSeconds,
  });

  const state = await getPlayerState(user.id, body.courseSlug);
  return NextResponse.json({ progressPercent: percent, state });
}
