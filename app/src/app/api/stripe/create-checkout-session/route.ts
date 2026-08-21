import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getSessionUser } from "@/lib/auth";
import { getCourseBySlug } from "@/lib/courses";
import { isStripeConfigured, siteUrl, stripe } from "@/lib/stripe";

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : "Error al crear la sesión de pago";
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
    }

    const body = (await request.json()) as { courseSlug?: string };
    if (!body.courseSlug) {
      return NextResponse.json({ error: "Curso requerido" }, { status: 400 });
    }

    const row = await getCourseBySlug(body.courseSlug);
    if (!row?.course.published) {
      return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });
    }

    const { course } = row;

    if (!isStripeConfigured() || !stripe) {
      return NextResponse.json(
        { error: "Pagos no configurados", code: "STRIPE_NOT_CONFIGURED" },
        { status: 503 },
      );
    }

    if (!course.stripePriceId) {
      return NextResponse.json(
        { error: "Este curso aún no tiene precio en Stripe", code: "NO_PRICE_ID" },
        { status: 400 },
      );
    }

    const db = getDb();
    const [dbUser] = await db.select().from(schema.users).where(eq(schema.users.id, user.id)).limit(1);
    if (!dbUser) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    const base = siteUrl();
    let customerId = dbUser.stripeCustomerId ?? null;

    const createSession = (custId: string | undefined) =>
      stripe!.checkout.sessions.create({
        customer: custId,
        customer_email: custId ? undefined : dbUser.email,
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [{ price: course.stripePriceId!, quantity: 1 }],
        success_url: `${base}/consultorio/cursos/${course.slug}?checkout=success`,
        cancel_url: `${base}/consultorio/cursos/${course.slug}?checkout=cancel`,
        metadata: {
          userId: user.id,
          courseId: course.id,
          courseSlug: course.slug,
        },
      });

    let sessionStripe;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: dbUser.email,
        name: dbUser.nombre,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await db.update(schema.users).set({ stripeCustomerId: customerId }).where(eq(schema.users.id, user.id));
      sessionStripe = await createSession(customerId);
    } else {
      try {
        sessionStripe = await createSession(customerId);
      } catch (e) {
        const msg = errMsg(e);
        if (msg.includes("No such customer")) {
          const customer = await stripe.customers.create({
            email: dbUser.email,
            name: dbUser.nombre,
            metadata: { userId: user.id },
          });
          customerId = customer.id;
          await db.update(schema.users).set({ stripeCustomerId: customerId }).where(eq(schema.users.id, user.id));
          sessionStripe = await createSession(customerId);
        } else {
          throw e;
        }
      }
    }

    if (!sessionStripe.url) {
      return NextResponse.json({ error: "Stripe no devolvió URL" }, { status: 500 });
    }

    return NextResponse.json({ url: sessionStripe.url });
  } catch (e) {
    console.error("create-checkout-session:", e);
    return NextResponse.json({ error: errMsg(e) }, { status: 500 });
  }
}
