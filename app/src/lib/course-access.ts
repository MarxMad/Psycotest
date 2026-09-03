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
  } else {
    const [inserted] = await db
      .insert(schema.courseEnrollments)
      .values({
        userId: params.userId,
        courseId: params.courseId,
        status: "active",
        stripeSessionId: params.stripeSessionId,
        stripePaymentIntentId: params.stripePaymentIntentId ?? null,
        enrolledAt: now,
        updatedAt: now,
      })
      .returning();
    return inserted.id;
  }
}

export async function getCourseProgress(userId: string, courseId: string) {
  const db = getDb();
  const curriculum = await getCourseCurriculum(courseId);
  const allLessonIds = curriculum.flatMap((m) => m.lessons.map((l) => l.id));
  if (allLessonIds.length === 0) return { completed: 0, total: 0, percentage: 0 };

  const completed = await db
    .select()
    .from(schema.courseLessonProgress)
    .where(
      and(
        eq(schema.courseLessonProgress.userId, userId),
        eq(schema.courseLessonProgress.completed, true),
      ),
    );

  const completedInCourse = completed.filter((c) => allLessonIds.includes(c.lessonId));
  const percentage = Math.round((completedInCourse.length / allLessonIds.length) * 100);
  return { completed: completedInCourse.length, total: allLessonIds.length, percentage };
}

export async function canAccessLesson(params: {
  userId: string;
  courseId: string;
  lessonId: string;
}): Promise<boolean> {
  const enrollment = await getEnrollment(params.userId, params.courseId);
  return enrollment !== null && enrollment.status === "active";
}

export async function getPlayerState(userId: string, lessonId: string) {
  const db = getDb();
  const [progress] = await db
    .select()
    .from(schema.courseLessonProgress)
    .where(
      and(
        eq(schema.courseLessonProgress.userId, userId),
        eq(schema.courseLessonProgress.lessonId, lessonId),
      ),
    )
    .limit(1);
  return progress ?? null;
}
