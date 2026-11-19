import { CHANNELS, dominioDeCanal, dominioPrincipal, type ChannelId } from "@/lib/channels";

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

/**
 * Enlace absoluto a una ruta de la plataforma (p. ej. /cursos/x o /baja) en el
 * dominio de una marca. Para correos: quien lo abre tiene que caer en el
 * dominio de la empresa que le escribe, que es donde inicia sesión.
 *
 * Ojo: no sirve para la portada de la marca (esa es `channelPublicUrl`), porque
 * sin dominio propio las rutas de plataforma no van bajo /sites/<canal>.
 */
export function urlDePlataforma(canal: ChannelId, ruta: string): string {
  const p = ruta.startsWith("/") ? ruta : `/${ruta}`;
  const propio = dominioDeCanal(canal);
  if (propio) return `https://${propio}${p}`;
  const raiz = dominioPrincipal();
  if (raiz) return canal === "martin" ? `https://${raiz}${p}` : `https://${CHANNELS[canal].hostPrefix}.${raiz}${p}`;
  return `${urlDelSitio()}${p}`;
}
