"use client";

/**
 * Fondo del hero de CEDUCT: un guilloche, el grabado de roseta que llevan
 * los certificados, los títulos y los billetes para que no se falsifiquen.
 *
 * Sustituye al video de archivo: dice de qué va la marca en vez de mostrar
 * a cualquiera frente a una laptop, pesa unos kilobytes y no depende de que
 * el navegador permita reproducir automáticamente.
 */

const r2 = (n: number) => Number(n.toFixed(2));

/**
 * Hipotrocoide: el trazo que deja un punto de un círculo que rueda dentro
 * de otro. Variando el radio interior salen las rosetas del grabado.
 */
function roseta(R: number, r: number, d: number, pasos = 720): string {
  const puntos: string[] = [];
  const vueltas = r / gcd(R, r);
  for (let i = 0; i <= pasos; i += 1) {
    const t = (Math.PI * 2 * vueltas * i) / pasos;
    const k = (R - r) / r;
    const x = (R - r) * Math.cos(t) + d * Math.cos(k * t);
    const y = (R - r) * Math.sin(t) - d * Math.sin(k * t);
    puntos.push(`${r2(x)},${r2(y)}`);
  }
  return `M${puntos.join("L")}Z`;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

const ROSETAS = [
  { d: roseta(200, 61, 96), ancho: 0.6, opacidad: 0.5, giro: 0, dur: 190 },
  { d: roseta(200, 47, 120), ancho: 0.5, opacidad: 0.34, giro: 12, dur: 150 },
  { d: roseta(160, 33, 92), ancho: 0.45, opacidad: 0.26, giro: 24, dur: 115 },
];

export function TramaCertificado({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="-260 -260 520 520"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      focusable="false"
    >
      <defs>
        <radialGradient id="tc-desvanecido">
          <stop offset="0%" stopColor="#fff" stopOpacity="1" />
          <stop offset="62%" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id="tc-mascara">
          <rect x="-260" y="-260" width="520" height="520" fill="url(#tc-desvanecido)" />
        </mask>
      </defs>

      <g mask="url(#tc-mascara)">
        {ROSETAS.map((ros, i) => (
          <g key={i} className="tc-gira" style={{ animationDuration: `${ros.dur}s` }}>
            <path
              d={ros.d}
              fill="none"
              stroke="var(--ced-gold, #c9a227)"
              strokeWidth={ros.ancho}
              opacity={ros.opacidad}
              transform={`rotate(${ros.giro})`}
            />
          </g>
        ))}

        {/* Anillos de registro, como el borde impreso de un título */}
        <circle cx="0" cy="0" r="236" fill="none" stroke="#fff" strokeWidth="0.5" opacity="0.1" />
        <circle cx="0" cy="0" r="222" fill="none" stroke="#fff" strokeWidth="0.5" opacity="0.07" />
      </g>
    </svg>
  );
}
