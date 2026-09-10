import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getCourseBySlug } from "@/lib/courses";
import { enrollUserInCourse, getEnrollment } from "@/lib/course-access";
import { isStripeConfigured, siteUrl, stripe } from "@/lib/stripe";

/**
 * Checkout Stripe cuando hay price_id.
 * Si el curso es gratis, inscribe sin Stripe y redirige al player.
 */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Inicia sesión" }, { status: 401 });
    }

    const body = (await request.json()) as { courseSlug?: string };
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
      return NextResponse.json({
        url: `${siteUrl()}/consultorio/cursos/${course.slug}/aprender`,
      });
    }

    if (course.priceMxn <= 0) {
      await enrollUserInCourse({
        userId: user.id,
        courseId: course.id,
        stripeSessionId: `free_${Date.now()}`,
      });
      return NextResponse.json({
        url: `${siteUrl()}/consultorio/cursos/${course.slug}/aprender`,
      });
    }

    if (!isStripeConfigured() || !stripe) {
      return NextResponse.json(
        {
          error: "Stripe no configurado. Usa el cupón DEMO100 o inscribe cursos gratis.",
          code: "STRIPE_NOT_CONFIGURED",
        },
        { status: 503 },
      );
    }

    if (!course.stripePriceId) {
      return NextResponse.json(
        {
          error: "Este curso aún no tiene precio Stripe. Usa DEMO100 para acceso completo.",
          code: "MISSING_PRICE_ID",
        },
        { status: 503 },
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      line_items: [{ price: course.stripePriceId, quantity: 1 }],
      success_url: `${siteUrl()}/consultorio/cursos/${course.slug}/aprender?checkout=ok`,
      cancel_url: `${siteUrl()}/consultorio/cursos/${course.slug}?checkout=cancel`,
      metadata: {
        userId: user.id,
        courseId: course.id,
        courseSlug: course.slug,
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: "No se pudo crear la sesión de pago" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[stripe] create-checkout-session:", error);
    return NextResponse.json({ error: "Error al iniciar el pago" }, { status: 500 });
  }
}
