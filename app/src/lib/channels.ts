/**
 * Multi-canal por subdominio.
 * Host examples: martin.localhost:3000, ceduct.sistemapsic.com
 */

export type ChannelId = "martin" | "ceduct" | "psicologia" | "ige";

export type ChannelTheme = {
  /** CSS variables injected on the site shell */
  vars: Record<string, string>;
  fontDisplay: string;
  fontBody: string;
};

export type ChannelDef = {
  id: ChannelId;
  hostPrefix: string;
  name: string;
  legalName: string;
  tagline: string;
  description: string;
  accentLabel: string;
  /** Logo público opcional (p. ej. /ceduct/hqdefault.jpg) */
  logo?: string;
  theme: ChannelTheme;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  nav: Array<{ label: string; href: string }>;
};

const ROOT = () => (process.env.ROOT_DOMAIN || "").trim().replace(/^www\./, "");

/**
 * ¿Hay un dominio propio donde los subdominios sí existen?
 *
 * Una URL de despliegue de Vercel (*.vercel.app) no admite subdominios
 * arbitrarios: ceduct.mi-app.vercel.app no resuelve. Y sin ROOT_DOMAIN
 * configurado, los enlaces salían apuntando a localhost en producción.
 */
function dominioConSubdominios(): string | null {
  const root = ROOT();
  if (!root) return null;
  if (root === "localhost" || root.endsWith(".localhost")) return null;
  if (root.endsWith(".vercel.app")) return null;
  return root;
}

export const CHANNELS: Record<ChannelId, ChannelDef> = {
  martin: {
    id: "martin",
    hostPrefix: "martin",
    name: "Martín Hernández",
    legalName: "Martín Hernández González",
    tagline: "Consultor · Valuador · Certificador",
    description:
      "Consultoría organizacional, valuación con dictamen técnico y certificación de competencias laborales.",
    accentLabel: "Portafolio",
    theme: {
      fontDisplay: '"Fraunces", "Libre Baskerville", Georgia, serif',
      fontBody: '"DM Sans", "Segoe UI", sans-serif',
      vars: {
        "--ch-bg": "#0c1222",
        "--ch-surface": "#141c2e",
        "--ch-ink": "#f2efe8",
        "--ch-muted": "#9aa3b5",
        "--ch-accent": "#d4a24c",
        "--ch-accent-2": "#3d7ea6",
        "--ch-rule": "rgba(242,239,232,0.12)",
        "--ch-hero-overlay": "linear-gradient(120deg, rgba(12,18,34,0.92) 0%, rgba(12,18,34,0.55) 55%, rgba(12,18,34,0.2) 100%)",
      },
    },
    primaryCta: { label: "Agendar conversación", href: "#contacto" },
    secondaryCta: { label: "Ver mi práctica", href: "#credenciales" },
    nav: [
      { label: "Perfil", href: "#credenciales" },
      { label: "Método", href: "#metodo" },
      { label: "Líneas de trabajo", href: "#canales" },
      { label: "Contacto", href: "#contacto" },
    ],
  },
  ceduct: {
    id: "ceduct",
    hostPrefix: "ceduct",
    name: "Diplomados y Certificaciones",
    legalName: "Centro de Educación y Capacitación para los Trabajadores, A.C.",
    tagline: "Formación con ruta a la certificación CONOCER",
    description:
      "Diplomados y certificación de competencias laborales con validez oficial. Avalados por CEDUCT A.C., clave ECE 002-10.",
    accentLabel: "Competencias laborales",
    logo: "/ceduct/logo-ceduct.png",
    theme: {
      fontDisplay: '"Libre Baskerville", "Fraunces", Georgia, serif',
      fontBody: '"Source Sans 3", "DM Sans", sans-serif',
      vars: {
        "--ch-bg": "#f4f6fb",
        "--ch-surface": "#ffffff",
        "--ch-ink": "#14145c",
        "--ch-muted": "#5b6284",
        "--ch-accent": "#14145c",
        "--ch-accent-2": "#c9a227",
        "--ch-rule": "rgba(20,20,92,0.12)",
        "--ch-hero-overlay":
          "linear-gradient(118deg, rgba(244,246,251,0.97) 0%, rgba(244,246,251,0.85) 42%, rgba(244,246,251,0.4) 100%)",
      },
    },
    primaryCta: { label: "Ver los diplomados", href: "#diplomados" },
    secondaryCta: { label: "Quiero certificarme", href: "#certificaciones" },
    nav: [
      { label: "Diplomados", href: "/diplomados" },
      { label: "Certificaciones", href: "#certificaciones" },
      { label: "Proceso", href: "#proceso" },
      { label: "Respaldo", href: "#respaldo" },
      { label: "Contacto", href: "#contacto" },
    ],
  },
  psicologia: {
    id: "psicologia",
    hostPrefix: "psicologia",
    name: "Psicología Aplicada",
    legalName: "Psicología Aplicada — Evaluación y desarrollo organizacional",
    tagline: "Pruebas · Códigos · Informes · Selección",
    description:
      "Resultados de un conjunto de pruebas psicológicas en minutos: solicita tus códigos, da acceso a tus candidatos y recibe el reporte.",
    accentLabel: "Evaluación",
    theme: {
      fontDisplay: '"Space Grotesk", "DM Sans", sans-serif',
      fontBody: '"IBM Plex Sans", "DM Sans", sans-serif',
      vars: {
        "--ch-bg": "#0e141c",
        "--ch-surface": "#161d28",
        "--ch-ink": "#e8edf4",
        "--ch-muted": "#9aa6b6",
        "--ch-accent": "#d4895a",
        "--ch-accent-2": "#5b7c99",
        "--ch-rule": "rgba(232,237,244,0.12)",
        "--ch-hero-overlay":
          "linear-gradient(115deg, rgba(14,20,28,0.94) 0%, rgba(14,20,28,0.65) 55%, rgba(14,20,28,0.2) 100%)",
      },
    },
    primaryCta: { label: "Entrar con código", href: "#acceso" },
    secondaryCta: { label: "Ver batería", href: "#bateria" },
    nav: [
      { label: "Inicio", href: "/" },
      { label: "Acceso", href: "#acceso" },
      { label: "Cómo funciona", href: "#tres-pasos" },
      { label: "Batería", href: "#bateria" },
      { label: "Diplomados", href: "/diplomados" },
      { label: "Contacto", href: "#contacto" },
    ],
  },
  ige: {
    id: "ige",
    hostPrefix: "ige",
    name: "Ingeniería de Grupos Efectivos",
    legalName: "Ingeniería de Grupos Efectivos",
    tagline: "Cursos · Capacitación · Consultoría",
    description:
      "Cursos, talleres, diplomados, conferencias y consultoría organizacional para el sector público y la iniciativa privada.",
    accentLabel: "Capacitación",
    theme: {
      fontDisplay: '"Outfit", "Space Grotesk", sans-serif',
      fontBody: '"Manrope", "DM Sans", sans-serif',
      vars: {
        "--ch-bg": "#0a0d10",
        "--ch-surface": "#12171c",
        "--ch-ink": "#f3f6f8",
        "--ch-muted": "#93a1ad",
        "--ch-accent": "#22d3ee",
        "--ch-accent-2": "#f97316",
        "--ch-rule": "rgba(34,211,238,0.22)",
        "--ch-hero-overlay": "linear-gradient(100deg, rgba(10,13,16,0.92) 0%, rgba(10,13,16,0.55) 50%, rgba(10,13,16,0.15) 100%)",
      },
    },
    primaryCta: { label: "Solicitar propuesta", href: "#contacto" },
    secondaryCta: { label: "Ver cursos", href: "/consultorio/cursos" },
    nav: [
      { label: "Capacitación", href: "#capacitacion" },
      { label: "Consultoría", href: "#consultoria" },
      { label: "Especialidades", href: "#especialidades" },
      { label: "Cursos", href: "/consultorio/cursos" },
      { label: "Contacto", href: "#contacto" },
    ],
  },
};

export const CHANNEL_IDS = Object.keys(CHANNELS) as ChannelId[];

export function getChannel(id: string | null | undefined): ChannelDef | null {
  if (!id) return null;
  return CHANNELS[id as ChannelId] ?? null;
}

/** Extract channel prefix from Host header. */
export function getChannelFromHost(hostHeader: string | null): ChannelDef | null {
  if (!hostHeader) return null;
  const host = hostHeader.toLowerCase().split(":")[0];
  if (!host) return null;

  // *.localhost or subdomain.ROOT_DOMAIN
  const parts = host.split(".");
  if (parts.length < 2) return null;

  // martin.localhost → martin
  // ceduct.sistemapsic.com → ceduct
  // www.sistemapsic.com → null (apex/www)
  const first = parts[0];
  if (first === "www" || first === "admin" || first === "app") return null;

  // vercel preview: ignore hash-like hosts
  if (host.includes("vercel.app") && parts.length <= 3 && first !== "martin" && first !== "ceduct" && first !== "psicologia" && first !== "ige") {
    return null;
  }

  return getChannel(first);
}

/**
 * Dirección pública de un canal.
 *
 * Con dominio propio cada marca vive en su subdominio. Sin él —en
 * desarrollo o en la URL de despliegue— se usa la ruta interna, que
 * sirve el mismo sitio y funciona en cualquier host.
 */
export function channelPublicUrl(channelId: ChannelId, path = "/"): string {
  const ch = CHANNELS[channelId];
  const p = path.startsWith("/") ? path : `/${path}`;
  const root = dominioConSubdominios();

  if (!root) return `/sites/${ch.id}${p === "/" ? "" : p}`;
  return `https://${ch.hostPrefix}.${root}${p}`;
}

/** Deep links a motores compartidos (evaluación, CONOCER, cursos). */
export function getChannelPlatformCtas(
  channelId: ChannelId,
): Array<{ label: string; href: string; hint: string }> {
  const map: Record<ChannelId, Array<{ label: string; href: string; hint: string }>> = {
    martin: [
      { label: "CEDUCT", href: channelPublicUrl("ceduct"), hint: "Certificación ECE 002-10" },
      {
        label: "Psicología Aplicada",
        href: channelPublicUrl("psicologia"),
        hint: "Evaluación y diplomados",
      },
      { label: "IGE", href: channelPublicUrl("ige"), hint: "Cursos y consultoría" },
    ],
    ceduct: [
      { label: "Diplomados", href: "/consultorio/cursos", hint: "Formación con seguimiento" },
      { label: "Expedientes", href: "/consultorio/expediente", hint: "Gestión del candidato ECE" },
      { label: "Constancias", href: "/verificar", hint: "Emisión y verificación" },
    ],
    psicologia: [
      { label: "Entrar con código", href: "/evaluacion/acceso", hint: "Portal del candidato" },
      { label: "Diplomados de 90 horas", href: "/consultorio/cursos", hint: "Formación para evaluar con criterio" },
      { label: "Solicitar evaluación", href: "#contacto", hint: "Cotiza tu proceso de selección" },
    ],
    ige: [
      { label: "Catálogo de cursos", href: "/consultorio/cursos", hint: "Inscripción en línea" },
      { label: "Clases en vivo", href: "/consultorio/clases-vivo", hint: "Sesiones sincrónicas" },
      { label: "Consultoría", href: "#consultoria", hint: "Diagnóstico de equipos" },
    ],
  };
  return map[channelId];
}

export function isPlatformPath(pathname: string): boolean {
  const skip = [
    "/admin",
    "/mi-cuenta",
    "/sin-contenido",
    "/diplomados",
    "/carrito",
    "/checkout",
    "/api",
    "/login",
    "/evaluacion",
    "/psycotest",
    "/consultorio",
    "/participantes",
    "/verificar",
    "/sites",
    "/_next",
    "/manuales",
    "/ige/",
    "/media/",
    "/favicon",
  ];
  return skip.some((p) => pathname === p || pathname.startsWith(`${p}/`) || pathname.startsWith(p));
}
