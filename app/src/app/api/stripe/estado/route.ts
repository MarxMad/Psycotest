import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

/**
 * Estado de un pago para la página de gracias.
 *
 * Se consulta por el identificador de sesión, que no se puede adivinar, así
 * que no hace falta sesión iniciada: quien compró sin cuenta también merece
 * ver su confirmación. Solo devuelve si está pagado y por cuánto.
 */
export async function GET(request: Request) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe no configurado" }, { status: 503 });
  }

  const sessionId = new URL(request.url).searchParams.get("session_id");
  if (!sessionId || !sessionId.startsWith("cs_")) {
    return NextResponse.json({ error: "Falta la sesión" }, { status: 400 });
  }

  try {
    const sesion = await stripe.checkout.sessions.retrieve(sessionId);
    return NextResponse.json({
      pagado: sesion.payment_status === "paid",
      estado: sesion.payment_status,
      total: sesion.amount_total,
      correo: sesion.customer_details?.email ?? null,
    });
  } catch {
    return NextResponse.json({ error: "No se encontró ese pago" }, { status: 404 });
  }
}
