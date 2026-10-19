/**
 * Portada ilustrada de un programa cuando no hay fotografía.
 *
 * No es relleno: cada categoría tiene su color y su figura, y la variación
 * (giro, posición del halo) sale del slug, así dos tarjetas nunca se ven
 * iguales y un mismo programa siempre conserva su portada.
 */

import { categoriaPorSlug } from "@/lib/ceduct/config";

function hash(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i += 1) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

const r = (n: number) => Number(n.toFixed(2));

function Figura({ icono }: { icono: string }) {
  switch (icono) {
    case "megafono":
      return (
        <g fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round">
          <path d="M150 120 L250 82 L250 198 L150 160 Z" fill="currentColor" fillOpacity="0.18" />
          <rect x="118" y="118" width="32" height="44" rx="6" fill="currentColor" fillOpacity="0.35" />
          <path d="M276 108 Q300 140 276 172" opacity="0.8" />
          <path d="M296 90 Q336 140 296 190" opacity="0.5" />
          <path d="M316 72 Q372 140 316 208" opacity="0.28" />
        </g>
      );
    case "chip":
      return (
        <g fill="none" stroke="currentColor" strokeWidth="4">
          <rect x="160" y="80" width="120" height="120" rx="16" fill="currentColor" fillOpacity="0.16" />
          <rect x="190" y="110" width="60" height="60" rx="8" fill="currentColor" fillOpacity="0.4" />
          {[0, 1, 2, 3].map((i) => (
            <g key={i} opacity="0.7">
              <line x1={176 + i * 29} y1="80" x2={176 + i * 29} y2="52" />
              <line x1={176 + i * 29} y1="200" x2={176 + i * 29} y2="228" />
              <line x1="160" y1={96 + i * 29} x2="132" y2={96 + i * 29} />
              <line x1="280" y1={96 + i * 29} x2="308" y2={96 + i * 29} />
            </g>
          ))}
        </g>
      );
    case "maletin":
      return (
        <g fill="currentColor">
          {[0, 1, 2, 3, 4].map((i) => (
            <rect
              key={i}
              x={130 + i * 40}
              y={210 - (i + 1) * 28}
              width="28"
              height={(i + 1) * 28}
              rx="5"
              opacity={0.22 + i * 0.16}
            />
          ))}
          <path
            d="M128 150 L188 110 L228 130 L318 62"
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="318" cy="62" r="9" />
        </g>
      );
    case "pulso":
      return (
        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M100 150 L170 150 L192 104 L222 196 L250 124 L268 150 L340 150"
            strokeWidth="6"
          />
          <circle cx="220" cy="140" r="86" strokeWidth="3" opacity="0.35" />
          <circle cx="220" cy="140" r="112" strokeWidth="2" opacity="0.18" />
        </g>
      );
    case "birrete":
      return (
        <g fill="currentColor">
          <path d="M220 78 L330 124 L220 170 L110 124 Z" opacity="0.5" />
          <path d="M160 146 L160 190 Q220 222 280 190 L280 146 L220 172 Z" opacity="0.3" />
          <path
            d="M322 128 L322 186"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="322" cy="192" r="8" />
        </g>
      );
    case "personas":
    default:
      return (
        <g fill="currentColor">
          <circle cx="220" cy="104" r="26" opacity="0.6" />
          <path d="M172 198 Q172 146 220 146 Q268 146 268 198 Z" opacity="0.4" />
          <circle cx="150" cy="122" r="18" opacity="0.35" />
          <path d="M116 196 Q116 158 150 158 Q184 158 184 196 Z" opacity="0.22" />
          <circle cx="290" cy="122" r="18" opacity="0.35" />
          <path d="M256 196 Q256 158 290 158 Q324 158 324 196 Z" opacity="0.22" />
        </g>
      );
  }
}

export function Portada({
  slug,
  categoria,
  etiqueta,
  className,
}: {
  slug: string;
  categoria: string;
  /** Texto grande de fondo, p. ej. la clave del estándar. */
  etiqueta?: string | null;
  className?: string;
}) {
  const cat = categoriaPorSlug(categoria);
  const h = hash(slug);
  const giro = (h % 18) - 9;
  const hx = 60 + (h % 320);
  const hy = 20 + ((h >> 8) % 120);
  const id = `pt-${h.toString(36)}`;

  return (
    <svg
      className={className}
      viewBox="0 0 440 280"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
    >
      <defs>
        <linearGradient id={`${id}-f`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#17469f" />
          <stop offset="100%" stopColor="#081f57" />
        </linearGradient>
        <radialGradient id={`${id}-h`} cx={r(hx / 440)} cy={r(hy / 280)} r="0.7">
          <stop offset="0%" stopColor={cat.tono} stopOpacity="0.55" />
          <stop offset="100%" stopColor={cat.tono} stopOpacity="0" />
        </radialGradient>
        <pattern id={`${id}-p`} width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.2" fill="#f0f6ff" opacity="0.16" />
        </pattern>
      </defs>
      <rect width="440" height="280" fill={`url(#${id}-f)`} />
      <rect width="440" height="280" fill={`url(#${id}-h)`} />
      <rect width="440" height="280" fill={`url(#${id}-p)`} />
      {etiqueta && (
        <text
          x="420"
          y="262"
          textAnchor="end"
          fill="#f0f6ff"
          opacity="0.09"
          fontSize="72"
          fontWeight="700"
          fontFamily="var(--mk-font-display), sans-serif"
          letterSpacing="-2"
        >
          {etiqueta}
        </text>
      )}
      <g color={cat.tono} transform={`rotate(${giro} 220 140)`}>
        <Figura icono={cat.icono} />
      </g>
    </svg>
  );
}
