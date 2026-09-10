import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getSessionUser } from "@/lib/auth";
import { enrollUserInCourse, getEnrollment } from "@/lib/course-access";
import { getCourseBySlug } from "@/lib/courses";

function applyCoupon(
  priceMxn: number,
  coupon: { type: "percentage" | "fixed"; value: number } | null,
): number {
  if (!coupon) return priceMxn;
  if (coupon.type === "percentage") {
    return Math.max(0, Math.round(priceMxn * (1 - coupon.value / 100)));
  }
  return Math.max(0, priceMxn - coupon.value);
}

/**
 * Inscripción a curso.
 * - Cursos a $0 o cupón que deja el total en $0: inscripción inmediata.
 * - En desarrollo: también permite inscripción de prueba con precio > 0.
 * - En producción con precio > 0: exige Stripe (create-checkout-session).
 */
export async function PUT(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Inicia sesión para inscribirte" }, { status: 401 });
    }

    const body = (await request.json()) as { courseSlug?: string; couponCode?: string };
    const courseSlug = body.courseSlug?.trim();
    if (!courseSlug) {
      return NextResponse.json({ error: "Falta courseSlug" }, { status: 400 });
    }

    const row = await getCourseBySlug(courseSlug);
    if (!row?.course.published) {
      return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });
    }

    const course = row.course;
    const existing = await getEnrollment(user.id, course.id);
    if (existing) {
      return NextResponse.json({ ok: true, enrollmentId: existing.id, alreadyEnrolled: true });
    }

    const db = getDb();
    let coupon: typeof schema.coupons.$inferSelect | null = null;
    const code = body.couponCode?.trim().toUpperCase();
    if (code) {
      const [found] = await db
        .select()
        .from(schema.coupons)
        .where(and(eq(schema.coupons.code, code), eq(schema.coupons.active, true)))
        .limit(1);
      if (!found) {
        return NextResponse.json({ error: "Cupón no válido" }, { status: 400 });
      }
      if (found.expiresAt && new Date(found.expiresAt).getTime() < Date.now()) {
        return NextResponse.json({ error: "Cupón expirado" }, { status: 400 });
      }
      if (found.maxUses != null && found.currentUses >= found.maxUses) {
        return NextResponse.json({ error: "Cupón agotado" }, { status: 400 });
      }
      coupon = found;
    }

    const due = applyCoupon(course.priceMxn, coupon);
    const allowPaidDevEnroll = process.env.NODE_ENV !== "production";

    if (due > 0 && !allowPaidDevEnroll) {
      return NextResponse.json(
        {
          error: "Este curso requiere pago. Usa Stripe o el cupón DEMO100.",
          code: "PAYMENT_REQUIRED",
          dueCents: due,
        },
        { status: 402 },
      );
    }

    const enrollmentId = await enrollUserInCourse({
      userId: user.id,
      courseId: course.id,
      stripeSessionId: due === 0 ? `free_${Date.now()}` : `dev_${Date.now()}`,
    });

    if (coupon) {
      await db
        .update(schema.coupons)
        .set({ currentUses: coupon.currentUses + 1 })
        .where(eq(schema.coupons.id, coupon.id));
    }

    return NextResponse.json({ ok: true, enrollmentId, dueCents: due });
  } catch (error) {
    console.error("[enroll] PUT:", error);
    return NextResponse.json({ error: "No se pudo completar la inscripción" }, { status: 500 });
  }
}
