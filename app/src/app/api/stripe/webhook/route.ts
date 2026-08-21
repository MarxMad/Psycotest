import { NextResponse } from "next/server";
import { headers } from "next/headers";
import type Stripe from "stripe";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { activateEnrollment } from "@/lib/course-access";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe no configurado" }, { status: 503 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook no configurado" }, { status: 503 });
  }

  const headersList = await headers();
  const sig = headersList.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Falta firma" }, { status: 400 });

  let event: Stripe.Event;
  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown";
    console.error("Webhook signature failed:", message);
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }

  const db = getDb();
  const [existing] = await db
    .select()
    .from(schema.stripeWebhookEvents)
    .where(eq(schema.stripeWebhookEvents.eventId, event.id))
    .limit(1);

  if (existing) {
    return NextResponse.json({ received: true });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const courseId = session.metadata?.courseId;

      if (userId && courseId && session.mode === "payment") {
        await activateEnrollment({
          userId,
          courseId,
          stripeSessionId: session.id,
          stripePaymentIntentId:
            typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
        });
      }
    }

    await db.insert(schema.stripeWebhookEvents).values({
      id: crypto.randomUUID(),
      eventId: event.id,
      type: event.type,
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Webhook handler error:", e);
    return NextResponse.json({ error: "Error procesando evento" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
