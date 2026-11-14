/**
 * La dirección pública del sitio, para enlaces que salen de la página: QR de
 * certificados, correos, vueltas de Stripe cuando no hay petición a la mano.
 *
 * Manda `NEXT_PUBLIC_SITE_URL` (o `NEXT_PUBLIC_APP_URL`). Si no está, en
 * Vercel se usa el dominio de producción que la plataforma expone sola; sólo
 * en local queda `localhost`.
 */
export function urlDelSitio(): string {
  const propia = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (propia) return propia.replace(/\/$/, "");
  const vercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_BRANCH_URL ||
    process.env.VERCEL_URL;
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
  return "http://localhost:3000";
}
