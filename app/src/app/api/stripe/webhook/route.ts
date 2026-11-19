import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { cancelarPedido, cumplirPedido, reembolsarPorPago } from "@/lib/pagos";
import { cumplirCompraPsicologia } from "@/lib/pagos-psicologia";
import { hayWebhookConfigurado, verificarEvento } from "@/lib/stripe";

/**
 * Eventos de Stripe. Aquí es donde se concede lo comprado.
 *
 * No se cumple desde la página de vuelta: quien paga y pierde la conexión
 * antes de que esa página cargue también tiene que recibir su acceso.
 *
 * Una sola dirección atiende a todas las cuentas: si cada empresa cobra en
 * su propia cuenta de Stripe, cada una registra este mismo endpoint y la
 * firma se comprueba contra el secreto de cada cuenta.
 *
 * Eventos que hay que activar en el endpoint:
 *   checkout.session.completed
 *   checkout.session.async_payment_succeeded
 *   checkout.session.async_payment_failed
 *   checkout.session.expired
 *   charge.refunded
 */
/** Cada canal cumple a su manera: cursos dan inscripción; Psicología, códigos. */
function cumplir(sesion: Stripe.Checkout.Session) {
  return sesion.metadata?.tipo === "psicologia" ? cumplirCompraPsicologia(sesion) : cumplirPedido(sesion);
}

export async function POST(request: Request) {
  if (!hayWebhookConfigurado()) {
    console.error("[stripe/webhook] falta STRIPE_SECRET_KEY o STRIPE_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Webhook no configurado" }, { status: 503 });
  }

  const firma = request.headers.get("stripe-signature");
  if (!firma) {
    return NextResponse.json({ error: "Falta la firma" }, { status: 400 });
  }

  // El cuerpo tiene que llegar crudo: pasarlo por `json()` invalidaría la firma.
  const crudo = await request.text();

  const verificado = await verificarEvento(crudo, firma);
  if (!verificado) {
    // Firma que no cuadra con ninguna cuenta: o no viene de Stripe o alguien la manipuló.
    console.error("[stripe/webhook] firma inválida");
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }
  const { evento } = verificado;

  try {
    switch (evento.type) {
      case "checkout.session.completed": {
        const sesion = evento.data.object;
        // Con métodos de pago diferidos (OXXO, SPEI) este evento llega sin
        // cobrar todavía; el bueno será `async_payment_succeeded`.
        if (sesion.payment_status !== "unpaid") await cumplir(sesion);
        break;
      }
      case "checkout.session.async_payment_succeeded":
        await cumplir(evento.data.object);
        break;
      case "checkout.session.async_payment_failed":
      case "checkout.session.expired":
        await cancelarPedido(evento.data.object);
        break;
      case "charge.refunded": {
        const cargo = evento.data.object;
        const pago = typeof cargo.payment_intent === "string" ? cargo.payment_intent : cargo.payment_intent?.id;
        // Solo el reembolso total retira el acceso.
        if (pago && cargo.refunded) await reembolsarPorPago(pago);
        break;
      }
      default:
        break;
    }
  } catch (error) {
    // Un 500 hace que Stripe reintente, que es lo que queremos si falló la base.
    console.error(`[stripe/webhook] ${evento.type}:`, error);
    return NextResponse.json({ error: "Error al procesar el evento" }, { status: 500 });
  }

  return NextResponse.json({ recibido: true });
}
