import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { countCourseLessons, getCourseCurriculum } from "./courses";

export async function getEnrollment(userId: string, courseId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(schema.courseEnrollments)
    .where(
      and(
        eq(schema.courseEnrollments.userId, userId),
        eq(schema.courseEnrollments.courseId, courseId),
        eq(schema.courseEnrollments.status, "active"),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function getEnrollmentBySlug(userId: string, courseSlug: string) {
  const db = getDb();
  const [row] = await db
    .select({ enrollment: schema.courseEnrollments, course: schema.courses })
    .from(schema.courseEnrollments)
    .innerJoin(schema.courses, eq(schema.courseEnrollments.courseId, schema.courses.id))
    .where(and(eq(schema.courseEnrollments.userId, userId), eq(schema.courses.slug, courseSlug)))
    .limit(1);
  return row ?? null;
}

export async function activateEnrollment(params: {
  userId: string;
  courseId: string;
  stripeSessionId: string;
  stripePaymentIntentId?: string | null;
}) {
  const db = getDb();
  const now = new Date().toISOString();
  const existing = await getEnrollment(params.userId, params.courseId);
  if (existing) {
    await db
      .update(schema.courseEnrollments)
      .set({
        status: "active",
        stripeSessionId: params.stripeSessionId,
        stripePaymentIntentId: params.stripePaymentIntentId ?? null,
        enrolledAt: now,
        updatedAt: now,
      })
      .where(eq(schema.courseEnrollments.id, existing.id));
    return existing.id;
  }

  const id = crypto.randomUUID();
  await db.insert(schema.courseEnrollments).values({
    id,
    userId: params.userId,
    courseId: params.courseId,
    status: "active",
    stripeSessionId: params.stripeSessionId,
    stripePaymentIntentId: params.stripePaymentIntentId ?? null,
    progressPercent: 0,
    enrolledAt: now,
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

export async function getLessonProgressMap(enrollmentId: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.lessonProgress)
    .where(eq(schema.lessonProgress.enrollmentId, enrollmentId));
  return new Map(rows.map((r) => [r.lessonId, r]));
}

export async function recalculateProgress(enrollmentId: string, courseId: string) {
  const db = getDb();
  const total = await countCourseLessons(courseId);
  if (total === 0) return 0;

  const completed = await db
    .select({ id: schema.lessonProgress.id })
    .from(schema.lessonProgress)
    .where(
      and(
        eq(schema.lessonProgress.enrollmentId, enrollmentId),
        eq(schema.lessonProgress.completed, true),
      ),
    );

  const percent = Math.round((completed.length / total) * 100);
  const now = new Date().toISOString();
  await db
    .update(schema.courseEnrollments)
    .set({
      progressPercent: percent,
      completedAt: percent >= 100 ? now : null,
      updatedAt: now,
    })
    .where(eq(schema.courseEnrollments.id, enrollmentId));

  return percent;
}

export async function markLessonProgress(params: {
  enrollmentId: string;
  lessonId: string;
  courseId: string;
  completed?: boolean;
  positionSeconds?: number;
}) {
  const db = getDb();
  const now = new Date().toISOString();
  const [existing] = await db
    .select()
    .from(schema.lessonProgress)
    .where(
      and(
        eq(schema.lessonProgress.enrollmentId, params.enrollmentId),
        eq(schema.lessonProgress.lessonId, params.lessonId),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .update(schema.lessonProgress)
      .set({
        completed: params.completed ?? existing.completed,
        lastPositionSeconds: params.positionSeconds ?? existing.lastPositionSeconds,
        updatedAt: now,
      })
      .where(eq(schema.lessonProgress.id, existing.id));
  } else {
    await db.insert(schema.lessonProgress).values({
      id: crypto.randomUUID(),
      enrollmentId: params.enrollmentId,
      lessonId: params.lessonId,
      completed: params.completed ?? false,
      lastPositionSeconds: params.positionSeconds ?? 0,
      updatedAt: now,
    });
  }

  return recalculateProgress(params.enrollmentId, params.courseId);
}

export async function canAccessLesson(params: {
  userId: string | null;
  courseId: string;
  lessonId: string;
  freePreview: boolean;
}) {
  if (params.freePreview) return true;
  if (!params.userId) return false;
  const enrollment = await getEnrollment(params.userId, params.courseId);
  return Boolean(enrollment);
}

export async function getPlayerState(userId: string, courseSlug: string) {
  const row = await getEnrollmentBySlug(userId, courseSlug);
  if (!row) return null;

  const curriculum = await getCourseCurriculum(row.course.id);
  const progressMap = await getLessonProgressMap(row.enrollment.id);

  return {
    enrollment: row.enrollment,
    course: row.course,
    curriculum: curriculum.map((block) => ({
      ...block,
      lessons: block.lessons.map((lesson) => ({
        lesson,
        progress: progressMap.get(lesson.id) ?? null,
      })),
    })),
  };
}
