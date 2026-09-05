import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getSessionUser } from "@/lib/auth";
import { getEnrollmentBySlug } from "@/lib/course-access";
import {
  countQuizAttempts,
  getBestQuizAttempt,
  getQuizById,
  getQuizQuestionsPublic,
  gradeQuizAttempt,
} from "@/lib/quizzes";

type Props = { params: Promise<{ quizId: string }> };

async function getLessonContext(lessonId: string) {
  const db = getDb();
  const [row] = await db
    .select({
      lesson: schema.courseLessons,
      module: schema.courseModules,
      course: schema.courses,
    })
    .from(schema.courseLessons)
    .innerJoin(schema.courseModules, eq(schema.courseLessons.moduleId, schema.courseModules.id))
    .innerJoin(schema.courses, eq(schema.courseModules.courseId, schema.courses.id))
    .where(eq(schema.courseLessons.id, lessonId))
    .limit(1);
  return row ?? null;
}

export async function GET(_request: Request, { params }: Props) {
  const { quizId } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const quiz = await getQuizById(quizId);
  if (!quiz) return NextResponse.json({ error: "Quiz no encontrado" }, { status: 404 });

  const ctx = await getLessonContext(quiz.lessonId);
  if (!ctx) return NextResponse.json({ error: "Lección no encontrada" }, { status: 404 });

  const enrolled = await getEnrollmentBySlug(user.id, ctx.course.slug);
  if (!enrolled && !ctx.lesson.freePreview) {
    return NextResponse.json({ error: "Sin inscripción" }, { status: 403 });
  }

  const questions = await getQuizQuestionsPublic(quizId);
  const attemptsUsed = enrolled ? await countQuizAttempts(enrolled.enrollment.id, quizId) : 0;
  const best = enrolled ? await getBestQuizAttempt(enrolled.enrollment.id, quizId) : null;

  return NextResponse.json({
    quiz: {
      id: quiz.id,
      lessonId: quiz.lessonId,
      passScore: quiz.passScore,
      maxAttempts: quiz.maxAttempts,
      shuffleQuestions: quiz.shuffleQuestions,
    },
    questions,
    attemptsUsed,
    attemptsRemaining: Math.max(0, quiz.maxAttempts - attemptsUsed),
    bestAttempt: best
      ? { score: best.score, passed: best.passed, attemptNumber: best.attemptNumber }
      : null,
  });
}

export async function POST(request: Request, { params }: Props) {
  const { quizId } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const quiz = await getQuizById(quizId);
  if (!quiz) return NextResponse.json({ error: "Quiz no encontrado" }, { status: 404 });

  const ctx = await getLessonContext(quiz.lessonId);
  if (!ctx) return NextResponse.json({ error: "Lección no encontrada" }, { status: 404 });

  const enrolled = await getEnrollmentBySlug(user.id, ctx.course.slug);
  if (!enrolled) {
    return NextResponse.json({ error: "Debes estar inscrito para enviar el quiz" }, { status: 403 });
  }

  const body = (await request.json()) as { answers?: Record<string, string[]> };
  if (!body.answers || typeof body.answers !== "object") {
    return NextResponse.json({ error: "answers requerido" }, { status: 400 });
  }

  try {
    const result = await gradeQuizAttempt({
      quizId,
      enrollmentId: enrolled.enrollment.id,
      courseId: ctx.course.id,
      lessonId: quiz.lessonId,
      answers: body.answers,
    });

    if (!result.ok && result.reason === "max_attempts") {
      return NextResponse.json(
        { error: "Se agotaron los intentos", maxAttempts: result.maxAttempts },
        { status: 429 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[quiz submit]", error);
    return NextResponse.json({ error: "No se pudo calificar" }, { status: 500 });
  }
}
