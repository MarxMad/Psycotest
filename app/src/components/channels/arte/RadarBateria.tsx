/**
 * Los cinco instrumentos como un radar.
 *
 * No es decoración: es la forma en que realmente se lee una batería —los
 * cinco ejes juntos, no uno por uno. Dos perfiles superpuestos muestran
 * por qué el contraste importa, y el segmento marcado sobre un eje es la
 * brecha más grande: lo que habría que cuidar si se contrata.
 *
 * La geometría se exporta porque `RadarVivo` necesita recalcular los mismos
 * puntos para animar el cambio de candidato. Un solo juego de fórmulas evita
 * que el dibujo y la animación se separen.
 */

export const EJES = [
  "Personalidad",
  "Valores",
  "Decisiones",
  "Compatibilidad",
  "Estilo gerencial",
] as const;

export const CX = 200;
export const CY = 190;
export const R = 125;

/** Node y el navegador serializan los flotantes distinto: redondear evita el aviso de hidratación. */
const r3 = (n: number) => Number(n.toFixed(3));

/** Punto del eje i (de 5) a una distancia 0–1 del centro. */
export function punto(i: number, v: number) {
  const a = (Math.PI * 2 * i) / EJES.length - Math.PI / 2;
  return [r3(CX + Math.cos(a) * R * v), r3(CY + Math.sin(a) * R * v)] as const;
}

export function poligono(valores: readonly number[]) {
  return valores.map((v, i) => punto(i, v).join(",")).join(" ");
}

/** Lo que exige la vacante del ejemplo. Es el mismo para los tres candidatos. */
export const PUESTO = [0.86, 0.72, 0.9, 0.78, 0.68] as const;

/**
 * Tres candidatos de ejemplo para la misma vacante. Son datos ilustrativos:
 * sirven para enseñar cómo se lee la distancia entre los dos perfiles, no
 * son resultados de nadie.
 */
export const CANDIDATOS = [
  { id: "a", nombre: "Candidata A", valores: [0.8, 0.7, 0.84, 0.76, 0.62] },
  { id: "b", nombre: "Candidato B", valores: [0.62, 0.88, 0.58, 0.84, 0.46] },
  { id: "c", nombre: "Candidata C", valores: [0.45, 0.52, 0.66, 0.5, 0.9] },
] as const;

/** Qué tanto alcanza la persona lo que el puesto pide, en porcentaje. */
export function ajuste(valores: readonly number[]) {
  const falta = PUESTO.reduce((n, p, i) => n + Math.max(0, p - valores[i]), 0);
  const total = PUESTO.reduce((n, p) => n + p, 0);
  return Math.round((1 - falta / total) * 100);
}

/** El eje donde la persona se queda más corta: el que hay que mirar. */
export function mayorBrecha(valores: readonly number[]) {
  let eje = 0;
  let falta = 0;
  PUESTO.forEach((p, i) => {
    const d = p - valores[i];
    if (d > falta) {
      falta = d;
      eje = i;
    }
  });
  return { eje, falta, nombre: EJES[eje] };
}

export function RadarBateria({
  className,
  persona = CANDIDATOS[0].valores,
}: {
  className?: string;
  persona?: readonly number[];
}) {
  const brecha = mayorBrecha(persona);
  const [bx1, by1] = punto(brecha.eje, persona[brecha.eje]);
  const [bx2, by2] = punto(brecha.eje, PUESTO[brecha.eje]);

  return (
    <svg
      className={className}
      viewBox="-45 0 490 400"
      role="img"
      aria-label="Los cinco instrumentos de la batería, leídos como un solo perfil"
    >
      <defs>
        <linearGradient id="rb-puesto" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--ch-accent)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--ch-accent)" stopOpacity="0.08" />
        </linearGradient>
        <radialGradient id="rb-centro">
          <stop offset="0%" stopColor="var(--ch-accent)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--ch-accent)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx={CX} cy={CY} r={R * 1.05} fill="url(#rb-centro)" data-halo />

      {/* Anillos de referencia */}
      {[0.25, 0.5, 0.75, 1].map((v) => (
        <polygon
          key={v}
          data-anillo
          points={poligono(EJES.map(() => v))}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.16"
        />
      ))}

      {/* Radios */}
      {EJES.map((_, i) => {
        const [x, y] = punto(i, 1);
        return (
          <line
            key={i}
            data-radio
            data-eje={i}
            x1={CX}
            y1={CY}
            x2={x}
            y2={y}
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.16"
          />
        );
      })}

      {/* Lo que el puesto exige */}
      <polygon
        data-perfil="puesto"
        points={poligono(PUESTO)}
        fill="url(#rb-puesto)"
        stroke="var(--ch-accent)"
        strokeWidth="1.5"
      />

      {/* La brecha más grande, marcada sobre su eje */}
      <line
        data-brecha
        x1={bx1}
        y1={by1}
        x2={bx2}
        y2={by2}
        stroke="var(--ch-accent)"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.85"
      />

      {/* Lo que la persona ofrece */}
      <polygon
        data-perfil="persona"
        points={poligono(persona)}
        fill="none"
        stroke="var(--ch-accent-2, currentColor)"
        strokeWidth="2"
        strokeDasharray="5 4"
      />

      {/* Vértices de la persona */}
      {persona.map((v, i) => {
        const [x, y] = punto(i, v);
        return (
          <circle
            key={i}
            data-vertice
            data-eje={i}
            cx={x}
            cy={y}
            r="3.5"
            fill="var(--ch-accent-2, currentColor)"
          />
        );
      })}

      {/* Etiquetas */}
      {EJES.map((eje, i) => {
        const [x, y] = punto(i, 1.2);
        const anchor = x < CX - 12 ? "end" : x > CX + 12 ? "start" : "middle";
        return (
          <text
            key={eje}
            data-etiqueta
            data-eje={i}
            x={x}
            y={y}
            textAnchor={anchor}
            dominantBaseline="middle"
            fontSize="11"
            fill="currentColor"
            opacity="0.72"
          >
            {eje}
          </text>
        );
      })}

      {/* Leyenda */}
      <g data-leyenda transform="translate(54, 364)" fontSize="11" fill="currentColor">
        <rect width="12" height="3" y="-2" fill="var(--ch-accent)" rx="1.5" />
        <text x="18" y="2" opacity="0.72">lo que el puesto exige</text>
        <rect width="12" height="3" x="150" y="-2" fill="var(--ch-accent-2, currentColor)" rx="1.5" />
        <text x="168" y="2" opacity="0.72">lo que la persona ofrece</text>
      </g>
    </svg>
  );
}
