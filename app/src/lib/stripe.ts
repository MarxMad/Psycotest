import Stripe from "stripe";

/**
 * Cliente de Stripe.
 *
 * La clave vive en el entorno, nunca en el repositorio. Si no está puesta, el
 * cliente queda en null y el resto del sistema sigue funcionando sin cobro con
 * tarjeta: los pedidos quedan pendientes y se acuerdan por contacto.
 */
const secreto = process.env.STRIPE_SECRET_KEY;

export const stripe = secreto
  ? new Stripe(secreto, { apiVersion: "2026-08-26.dahlia" })
  : null;

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function isStripeConfigured() {
  return Boolean(secreto);
}

/**
 * Importe para mostrar.
 *
 * Los precios se guardan en centavos (`courses.price_mxn`). Esta función los
 * daba por pesos, así que las páginas de cursos enseñaban cien veces el
 * precio real: 700 pesos se leían como $70,000.00.
 */
export function formatMxn(centavos: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: centavos % 100 === 0 ? 0 : 2,
  }).format(centavos / 100);
}
