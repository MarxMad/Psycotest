import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  courseEnrollments,
  courseLessons,
  courseModules,
  lessonProgress,
  vodEvents,
} from "@/db/schema";

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export async function recordVodEvent(input: {
  enrollmentId: string;
  lessonId: string;
  eventType: "play" | "pause" | "heartbeat" | "seek" | "ended";
  positionSeconds: number;
}) {
  const db = getDb();
  const now = new Date().toISOString();
  const eventId = id("vod");

  await db.insert(vodEvents).values({
    id: eventId,
    enrollmentId: input.enrollmentId,
    lessonId: input.lessonId,
    eventType: input.eventType,
    positionSeconds: Math.max(0, Math.floor(input.positionSeconds || 0)),
    createdAt: now,
  });

  const [lesson] = await db
    .select()
    .from(courseLessons)
    .where(eq(courseLessons.id, input.lessonId));
  const duration = Math.max(1, lesson?.durationSeconds || 1);

  const [progress] = await db
    .select()
    .from(lessonProgress)
    .where(
      and(
        eq(lessonProgress.enrollmentId, input.enrollmentId),
        eq(lessonProgress.lessonId, input.lessonId),
      ),
    )
    .limit(1);

  let watched = progress?.watchedSeconds || 0;
  if (input.eventType === "heartbeat" || input.eventType === "play") {
    watched = Math.min(duration, watched + 15);
  }
  if (input.eventType === "ended") {
    watched = Math.max(watched, duration);
  }

  const permanencePercent = Math.min(100, Math.round((watched / duration) * 100));
  const lastPosition = Math.floor(input.positionSeconds || 0);
  const completed =
    permanencePercent >= 80 || input.eventType === "ended" || Boolean(progress?.completed);

  if (progress) {
    await db
      .update(lessonProgress)
      .set({
        watchedSeconds: watched,
        permanencePercent,
        lastPositionSeconds: lastPosition,
        updatedAt: now,
        completed,
      })
      .where(eq(lessonProgress.id, progress.id));
  } else {
    await db.insert(lessonProgress).values({
      id: id("lp"),
      enrollmentId: input.enrollmentId,
      lessonId: input.lessonId,
      completed,
      lastPositionSeconds: lastPosition,
      watchedSeconds: watched,
      permanencePercent,
      updatedAt: now,
    });
  }

  const [enrollment] = await db
    .select()
    .from(courseEnrollments)
    .where(eq(courseEnrollments.id, input.enrollmentId));

  let progressPercent = enrollment?.progressPercent || 0;
  if (enrollment) {
    const modules = await db
      .select({ id: courseModules.id })
      .from(courseModules)
      .where(eq(courseModules.courseId, enrollment.courseId));
    const moduleIds = modules.map((m) => m.id);
    let totalLessons = 0;
    if (moduleIds.length) {
      const allLessons = await db
        .select({ id: courseLessons.id, moduleId: courseLessons.moduleId })
        .from(courseLessons);
      totalLessons = allLessons.filter((l) => moduleIds.includes(l.moduleId)).length;
    }
    const allProgress = await db
      .select()
      .from(lessonProgress)
      .where(eq(lessonProgress.enrollmentId, input.enrollmentId));
    const completedCount = allProgress.filter((p) => p.completed).length;
    progressPercent =
      totalLessons > 0
        ? Math.min(100, Math.round((completedCount / totalLessons) * 100))
        : Math.min(100, Math.round((completedCount / Math.max(allProgress.length, 1)) * 100));

    await db
      .update(courseEnrollments)
      .set({
        progressPercent,
        updatedAt: now,
        ...(progressPercent >= 100
          ? { status: "completed" as const, completedAt: now }
          : {}),
      })
      .where(eq(courseEnrollments.id, input.enrollmentId));
  }

  return { watchedSeconds: watched, permanencePercent, progressPercent };
}
