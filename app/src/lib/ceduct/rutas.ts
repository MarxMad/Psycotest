/**
 * Rutas del marketplace. Un único lugar para que navbar, tarjetas y
 * pie nunca apunten a sitios distintos.
 *
 * Todas son rutas de plataforma (ver `isPlatformPath` en channels.ts): en el
 * subdominio de CEDUCT no se reescriben a /sites/ceduct/...
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
