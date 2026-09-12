import { and, asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { requireUser } from "@/lib/auth";

type Props = { params: Promise<{ id: string }> };

async function guardAdmin() {
  try {
    return await requireUser(["admin"]);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "UNAUTHORIZED") {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }
}

export async function GET(_request: Request, { params }: Props) {
  const auth = await guardAdmin();
  if (auth instanceof NextResponse) return auth;
  const { id: courseId } = await params;
  const db = getDb();

  const modules = await db
    .select()
    .from(schema.courseModules)
    .where(eq(schema.courseModules.courseId, courseId))
    .orderBy(asc(schema.courseModules.sortOrder));

  const result = [];
  for (const mod of modules) {
    const lessons = await db
      .select()
      .from(schema.courseLessons)
      .where(eq(schema.courseLessons.moduleId, mod.id))
      .orderBy(asc(schema.courseLessons.sortOrder));

    const withQuiz = [];
    for (const lesson of lessons) {
      const [quiz] = await db
        .select()
        .from(schema.courseQuizzes)
        .where(eq(schema.courseQuizzes.lessonId, lesson.id))
        .limit(1);
      let questions: (typeof schema.quizQuestions.$inferSelect)[] = [];
      if (quiz) {
        questions = await db
          .select()
          .from(schema.quizQuestions)
          .where(eq(schema.quizQuestions.quizId, quiz.id))
          .orderBy(asc(schema.quizQuestions.sortOrder));
      }
      withQuiz.push({ lesson, quiz: quiz ?? null, questions });
    }
    result.push({ module: mod, lessons: withQuiz });
  }

  return NextResponse.json({ curriculum: result });
}

export async function POST(request: Request, { params }: Props) {
  const auth = await guardAdmin();
  if (auth instanceof NextResponse) return auth;
  const { id: courseId } = await params;
  const body = (await request.json()) as {
    kind?: "module" | "lesson" | "question";
    moduleId?: string;
    title?: string;
    slug?: string;
    type?: "video" | "quiz" | "live_replay";
    videoUrl?: string;
    freePreview?: boolean;
    sortOrder?: number;
    lessonId?: string;
    prompt?: string;
    options?: Array<{ key: string; label: string }>;
    correctKeys?: string[];
    explanation?: string;
    questionType?: "single" | "multiple" | "true_false";
    passScore?: number;
    maxAttempts?: number;
  };

  const db = getDb();
  const now = new Date().toISOString();

  if (body.kind === "module") {
    if (!body.title) return NextResponse.json({ error: "title requerido" }, { status: 400 });
    const id = crypto.randomUUID();
    await db.insert(schema.courseModules).values({
      id,
      courseId,
      title: body.title,
      sortOrder: body.sortOrder ?? 0,
    });
    return NextResponse.json({ moduleId: id }, { status: 201 });
  }

  if (body.kind === "lesson") {
    if (!body.moduleId || !body.title || !body.slug) {
      return NextResponse.json({ error: "moduleId, title y slug requeridos" }, { status: 400 });
    }
    const [mod] = await db
      .select()
      .from(schema.courseModules)
      .where(
        and(eq(schema.courseModules.id, body.moduleId), eq(schema.courseModules.courseId, courseId)),
      )
      .limit(1);
    if (!mod) return NextResponse.json({ error: "Módulo no encontrado" }, { status: 404 });

    const lessonId = crypto.randomUUID();
    const type = body.type ?? "video";
    await db.insert(schema.courseLessons).values({
      id: lessonId,
      moduleId: body.moduleId,
      slug: body.slug,
      title: body.title,
      type,
      videoUrl: body.videoUrl ?? null,
      freePreview: body.freePreview ?? false,
      sortOrder: body.sortOrder ?? 0,
      durationSeconds: 0,
    });

    let quizId: string | null = null;
    if (type === "quiz") {
      quizId = crypto.randomUUID();
      await db.insert(schema.courseQuizzes).values({
        id: quizId,
        lessonId,
        passScore: body.passScore ?? 70,
        maxAttempts: body.maxAttempts ?? 3,
        shuffleQuestions: false,
        createdAt: now,
        updatedAt: now,
      });
    }

    return NextResponse.json({ lessonId, quizId }, { status: 201 });
  }

  if (body.kind === "question") {
    if (!body.lessonId || !body.prompt || !body.options?.length || !body.correctKeys?.length) {
      return NextResponse.json(
        { error: "lessonId, prompt, options y correctKeys requeridos" },
        { status: 400 },
      );
    }
    let [quiz] = await db
      .select()
      .from(schema.courseQuizzes)
      .where(eq(schema.courseQuizzes.lessonId, body.lessonId))
      .limit(1);
    if (!quiz) {
      const quizId = crypto.randomUUID();
      await db.insert(schema.courseQuizzes).values({
        id: quizId,
        lessonId: body.lessonId,
        passScore: 70,
        maxAttempts: 3,
        shuffleQuestions: false,
        createdAt: now,
        updatedAt: now,
      });
      await db
        .update(schema.courseLessons)
        .set({ type: "quiz" })
        .where(eq(schema.courseLessons.id, body.lessonId));
      [quiz] = await db
        .select()
        .from(schema.courseQuizzes)
        .where(eq(schema.courseQuizzes.id, quizId))
        .limit(1);
    }

    const questionId = crypto.randomUUID();
    await db.insert(schema.quizQuestions).values({
      id: questionId,
      quizId: quiz!.id,
      prompt: body.prompt,
      type: body.questionType ?? "single",
      options: body.options,
      correctKeys: body.correctKeys,
      explanation: body.explanation ?? null,
      sortOrder: body.sortOrder ?? 0,
    });
    return NextResponse.json({ questionId, quizId: quiz!.id }, { status: 201 });
  }

  return NextResponse.json({ error: "kind inválido" }, { status: 400 });
}
