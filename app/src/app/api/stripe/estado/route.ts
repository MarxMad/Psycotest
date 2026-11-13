import { NextResponse } from "next/server";
import { cumplirPedido } from "@/lib/pagos";
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
    // Si el webhook aún no llega, se cumple aquí. Es idempotente y los datos
    // vienen de Stripe, no del navegador.
    if (sesion.payment_status !== "unpaid" && sesion.metadata?.tipo !== "psicologia") {
      await cumplirPedido(sesion).catch((e) => console.error("[stripe/estado] cumplir:", e));
    }
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
