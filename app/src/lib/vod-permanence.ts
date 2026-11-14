import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import {
  courseEnrollments,
  courseLessons,
  courseModules,
  lessonProgress,
  vodEvents,
} from "@/db/schema";

/** El reproductor avisa cada 15 s; el margen cubre la latencia de red. */
const MAX_AVANCE_POR_LATIDO = 20;

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
  const position = Math.max(0, Math.floor(input.positionSeconds || 0));

  // Los latidos sólo mueven el avance de la lección: guardarlos como eventos
  // eran ~4 filas por minuto por alumno que nadie leía. Play, pausa, salto y
  // fin sí se quedan como bitácora.
  if (input.eventType !== "heartbeat") {
    await db.insert(vodEvents).values({
      id: id("vod"),
      enrollmentId: input.enrollmentId,
      lessonId: input.lessonId,
      eventType: input.eventType,
      positionSeconds: position,
      createdAt: now,
    });
  }

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

  // Se acredita lo que avanzó el video desde el último aviso, nunca más de un
  // intervalo: un aviso repetido no suma y saltar hacia adelante no cuenta.
  let watched = progress?.watchedSeconds || 0;
  if (input.eventType === "heartbeat") {
    const avance = position - (progress?.lastPositionSeconds ?? 0);
    if (avance > 0 && avance <= MAX_AVANCE_POR_LATIDO) {
      watched = Math.min(duration, watched + avance);
    }
  }
  if (input.eventType === "ended") {
    watched = Math.max(watched, duration);
  }

  const permanencePercent = Math.min(100, Math.round((watched / duration) * 100));
  const lastPosition = position;
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
      const lecciones = await db
        .select({ id: courseLessons.id })
        .from(courseLessons)
        .where(inArray(courseLessons.moduleId, moduleIds));
      totalLessons = lecciones.length;
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
