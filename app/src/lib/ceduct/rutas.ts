/**
 * Rutas del marketplace. Un único lugar para que navbar, tarjetas y
 * pie nunca apunten a sitios distintos.
 *
 * Ninguna se reescribe a /sites/ceduct/... en el subdominio de CEDUCT, pero por
 * dos vías distintas (ambas en channels.ts):
 *
 * - `/diplomados`, `/carrito`, `/checkout`, `/gracias`, `/legal` y `/verificar`
 *   son rutas de plataforma: valen igual en cualquier host (`isPlatformPath`).
 * - `/nosotros`, `/contacto`, `/acceso` y `/mis-cursos` son rutas propias del
 *   canal (`CHANNEL_PATHS`): sólo se libran del rewrite en el subdominio de
 *   CEDUCT. En martin.* o ige.* esos nombres quedan libres para esas marcas.
 *
 * Sin subdominios configurados (previews *.vercel.app, localhost sin
 * ROOT_DOMAIN) no hay canal en el host, no hay rewrite, y las dos clases se
 * sirven igual desde el dominio principal.
 */

import { channelPublicUrl } from "@/lib/channels";
import type { TipoPrograma } from "./tipos";

export const RUTAS = {
  inicio: () => channelPublicUrl("ceduct"),
  catalogo: (filtros?: { tipo?: TipoPrograma; categoria?: string; q?: string }) => {
    const p = new URLSearchParams();
    if (filtros?.tipo) p.set("tipo", filtros.tipo);
    if (filtros?.categoria) p.set("categoria", filtros.categoria);
    if (filtros?.q) p.set("q", filtros.q);
    const qs = p.toString();
    return `/diplomados${qs ? `?${qs}` : ""}`;
  },
  programa: (slug: string) => `/diplomados/${slug}`,
  carrito: "/carrito",
  checkout: "/checkout",
  nosotros: "/nosotros",
  contacto: "/contacto",
  empresas: "/contacto?asunto=empresas",
  acceso: "/acceso",
  registro: "/acceso?modo=registro",
  misCursos: "/mis-cursos",
  legal: "/legal",
  verificar: "/verificar",
} as const;
