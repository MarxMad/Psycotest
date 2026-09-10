import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { getReadyDb } from "@/db/index";
import { courseEnrollments, courses } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { recordVodEvent } from "@/lib/vod-permanence";
import { grantCompletionCoupon } from "@/lib/legal-promo";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const db = await getReadyDb();
    const body = await request.json();
    const { courseSlug, lessonId, eventType, positionSeconds, completed } = body;

    if (!courseSlug || !lessonId) {
      return NextResponse.json({ error: "Faltan courseSlug o lessonId" }, { status: 400 });
    }

    const [course] = await db.select().from(courses).where(eq(courses.slug, courseSlug)).limit(1);
    if (!course) return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });

    const [enrollment] = await db
      .select()
      .from(courseEnrollments)
      .where(
        and(
          eq(courseEnrollments.userId, user.id),
          eq(courseEnrollments.courseId, course.id),
          inArray(courseEnrollments.status, ["active", "completed"]),
        ),
      )
      .limit(1);

    if (!enrollment) {
      return NextResponse.json({ error: "Sin inscripción activa" }, { status: 403 });
    }

    // Compat: marcar completado sin evento VOD
    if (completed && !eventType) {
      const result = await recordVodEvent({
        enrollmentId: enrollment.id,
        lessonId,
        eventType: "ended",
        positionSeconds: positionSeconds || 0,
      });
      let coupon = null;
      if (result.progressPercent >= 100) {
        coupon = await grantCompletionCoupon(enrollment.id);
      }
      return NextResponse.json({ ok: true, ...result, coupon });
    }

    const type = eventType || "heartbeat";
    if (!["play", "pause", "heartbeat", "seek", "ended"].includes(type)) {
      return NextResponse.json({ error: "eventType inválido" }, { status: 400 });
    }

    const result = await recordVodEvent({
      enrollmentId: enrollment.id,
      lessonId,
      eventType: type,
      positionSeconds: positionSeconds || 0,
    });

    let coupon = null;
    if (result.progressPercent >= 100) {
      coupon = await grantCompletionCoupon(enrollment.id);
    }

    return NextResponse.json({ ok: true, ...result, coupon });
  } catch (error) {
    console.error("progress/vod:", error);
    return NextResponse.json({ error: "Error al guardar progreso" }, { status: 500 });
  }
}
