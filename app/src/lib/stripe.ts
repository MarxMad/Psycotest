import Stripe from "stripe";

const secret = process.env.STRIPE_SECRET_KEY;
export const stripe = secret ? new Stripe(secret) : null;

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function formatMxn(cents: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(cents);
}
