import { and, asc, desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { markLessonProgress } from "./course-access";

export type QuizPublicQuestion = {
  id: string;
  prompt: string;
  type: "single" | "multiple" | "true_false";
  options: Array<{ key: string; label: string }>;
  sortOrder: number;
};

export async function getQuizByLessonId(lessonId: string) {
  const db = getDb();
  const [quiz] = await db
    .select()
    .from(schema.courseQuizzes)
    .where(eq(schema.courseQuizzes.lessonId, lessonId))
    .limit(1);
  return quiz ?? null;
}

export async function getQuizById(quizId: string) {
  const db = getDb();
  const [quiz] = await db
    .select()
    .from(schema.courseQuizzes)
    .where(eq(schema.courseQuizzes.id, quizId))
    .limit(1);
  return quiz ?? null;
}

export async function getQuizQuestionsPublic(quizId: string): Promise<QuizPublicQuestion[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: schema.quizQuestions.id,
      prompt: schema.quizQuestions.prompt,
      type: schema.quizQuestions.type,
      options: schema.quizQuestions.options,
      sortOrder: schema.quizQuestions.sortOrder,
    })
    .from(schema.quizQuestions)
    .where(eq(schema.quizQuestions.quizId, quizId))
    .orderBy(asc(schema.quizQuestions.sortOrder));

  return rows.map((r) => ({
    id: r.id,
    prompt: r.prompt,
    type: r.type,
    options: r.options,
    sortOrder: r.sortOrder,
  }));
}

export async function countQuizAttempts(enrollmentId: string, quizId: string) {
  const db = getDb();
  const rows = await db
    .select({ id: schema.quizAttempts.id })
    .from(schema.quizAttempts)
    .where(
      and(
        eq(schema.quizAttempts.enrollmentId, enrollmentId),
        eq(schema.quizAttempts.quizId, quizId),
      ),
    );
  return rows.length;
}

export async function getBestQuizAttempt(enrollmentId: string, quizId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(schema.quizAttempts)
    .where(
      and(
        eq(schema.quizAttempts.enrollmentId, enrollmentId),
        eq(schema.quizAttempts.quizId, quizId),
      ),
    )
    .orderBy(desc(schema.quizAttempts.score), desc(schema.quizAttempts.createdAt))
    .limit(1);
  return row ?? null;
}

function sameKeys(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((k, i) => k === sb[i]);
}

export async function gradeQuizAttempt(params: {
  quizId: string;
  enrollmentId: string;
  courseId: string;
  lessonId: string;
  answers: Record<string, string[]>;
}) {
  const db = getDb();
  const quiz = await getQuizById(params.quizId);
  if (!quiz) throw new Error("QUIZ_NOT_FOUND");

  const attemptCount = await countQuizAttempts(params.enrollmentId, params.quizId);
  if (attemptCount >= quiz.maxAttempts) {
    return { ok: false as const, reason: "max_attempts" as const, maxAttempts: quiz.maxAttempts };
  }

  const questions = await db
    .select()
    .from(schema.quizQuestions)
    .where(eq(schema.quizQuestions.quizId, params.quizId))
    .orderBy(asc(schema.quizQuestions.sortOrder));

  if (questions.length === 0) throw new Error("QUIZ_EMPTY");

  let correct = 0;
  const breakdown = questions.map((q) => {
    const given = params.answers[q.id] ?? [];
    const ok = sameKeys(given, q.correctKeys);
    if (ok) correct += 1;
    return {
      questionId: q.id,
      correct: ok,
      correctKeys: q.correctKeys,
      explanation: q.explanation,
    };
  });

  const score = Math.round((correct / questions.length) * 100);
  const passed = score >= quiz.passScore;
  const now = new Date().toISOString();
  const attemptNumber = attemptCount + 1;
  const attemptId = crypto.randomUUID();

  await db.insert(schema.quizAttempts).values({
    id: attemptId,
    enrollmentId: params.enrollmentId,
    quizId: params.quizId,
    answers: params.answers,
    score,
    passed,
    attemptNumber,
    createdAt: now,
  });

  let progressPercent: number | undefined;
  if (passed) {
    progressPercent = await markLessonProgress({
      enrollmentId: params.enrollmentId,
      lessonId: params.lessonId,
      courseId: params.courseId,
      completed: true,
    });
  }

  return {
    ok: true as const,
    attemptId,
    attemptNumber,
    score,
    passed,
    passScore: quiz.passScore,
    maxAttempts: quiz.maxAttempts,
    attemptsRemaining: Math.max(0, quiz.maxAttempts - attemptNumber),
    breakdown,
    progressPercent,
  };
}

export async function listQuizzesForAdmin(courseId: string) {
  const db = getDb();
  const rows = await db
    .select({
      quiz: schema.courseQuizzes,
      lesson: schema.courseLessons,
      module: schema.courseModules,
    })
    .from(schema.courseQuizzes)
    .innerJoin(schema.courseLessons, eq(schema.courseQuizzes.lessonId, schema.courseLessons.id))
    .innerJoin(schema.courseModules, eq(schema.courseLessons.moduleId, schema.courseModules.id))
    .where(eq(schema.courseModules.courseId, courseId))
    .orderBy(asc(schema.courseModules.sortOrder), asc(schema.courseLessons.sortOrder));
  return rows;
}
