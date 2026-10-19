import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { cancelarPedido, cumplirPedido } from "@/lib/pagos";
import { stripe } from "@/lib/stripe";

/**
 * Eventos de Stripe. Aquí es donde se concede lo comprado.
 *
 * No se cumple desde la página de vuelta: quien paga y pierde la conexión
 * antes de que esa página cargue también tiene que recibir su acceso.
 */
export async function POST(request: Request) {
  const secreto = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secreto) {
    console.error("[stripe/webhook] falta STRIPE_SECRET_KEY o STRIPE_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Webhook no configurado" }, { status: 503 });
  }

  const firma = request.headers.get("stripe-signature");
  if (!firma) {
    return NextResponse.json({ error: "Falta la firma" }, { status: 400 });
  }

  // El cuerpo tiene que llegar crudo: pasarlo por `json()` invalidaría la firma.
  const crudo = await request.text();

  let evento: Stripe.Event;
  try {
    evento = await stripe.webhooks.constructEventAsync(crudo, firma, secreto);
  } catch (error) {
    // Firma que no cuadra: o no viene de Stripe o alguien la manipuló.
    console.error("[stripe/webhook] firma inválida:", (error as Error).message);
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }

  try {
    switch (evento.type) {
      case "checkout.session.completed": {
        const sesion = evento.data.object;
        // Con métodos de pago diferidos este evento llega sin cobrar todavía;
        // el bueno será `async_payment_succeeded`.
        if (sesion.payment_status !== "unpaid") await cumplirPedido(sesion);
        break;
      }
      case "checkout.session.async_payment_succeeded":
        await cumplirPedido(evento.data.object);
        break;
      case "checkout.session.async_payment_failed":
      case "checkout.session.expired":
        await cancelarPedido(evento.data.object);
        break;
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
