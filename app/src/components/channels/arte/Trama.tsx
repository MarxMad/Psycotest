/**
 * Tramas de fondo. Sustituyen a la fotografía que no tenemos: dan textura
 * y profundidad sin depender de imágenes, y escalan a cualquier tamaño.
 */

type Props = { variante: "rejilla" | "puntos" | "curvas" | "radial"; className?: string };

export function Trama({ variante, className }: Props) {
  const id = `t-${variante}`;

  if (variante === "rejilla") {
    return (
      <svg className={className} aria-hidden focusable="false">
        <defs>
          <pattern id={id} width="64" height="64" patternUnits="userSpaceOnUse">
            <path d="M64 0H0v64" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
          <radialGradient id={`${id}-m`}>
            <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <mask id={`${id}-mask`}>
            <rect width="100%" height="100%" fill={`url(#${id}-m)`} />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} mask={`url(#${id}-mask)`} />
      </svg>
    );
  }

  if (variante === "puntos") {
    return (
      <svg className={className} aria-hidden focusable="false">
        <defs>
          <pattern id={id} width="26" height="26" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.4" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} />
      </svg>
    );
  }

  if (variante === "curvas") {
    return (
      <svg
        className={className}
        viewBox="0 0 1200 400"
        preserveAspectRatio="none"
        aria-hidden
        focusable="false"
      >
        {Array.from({ length: 9 }, (_, i) => (
          <path
            key={i}
            d={`M-50 ${60 + i * 42} C 300 ${10 + i * 42}, 760 ${150 + i * 36}, 1250 ${40 + i * 40}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            opacity={1 - i * 0.09}
          />
        ))}
      </svg>
    );
  }

  // radial — anillos concéntricos
  return (
    <svg className={className} viewBox="0 0 600 600" aria-hidden focusable="false">
      {Array.from({ length: 12 }, (_, i) => (
        <circle
          key={i}
          cx="300"
          cy="300"
          r={30 + i * 24}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity={0.55 - i * 0.04}
        />
      ))}
    </svg>
  );
}
