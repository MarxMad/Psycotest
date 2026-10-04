/**
 * Los cinco instrumentos como un radar.
 *
 * No es decoración: es la forma en que realmente se lee una batería —los
 * cinco ejes juntos, no uno por uno. Dos perfiles superpuestos muestran
 * por qué el contraste importa.
 */

const EJES = [
  "Personalidad",
  "Valores",
  "Decisiones",
  "Compatibilidad",
  "Estilo gerencial",
] as const;

const CX = 200;
const CY = 190;
const R = 125;

/** Node y el navegador serializan los flotantes distinto: redondear evita el aviso de hidratación. */
const r3 = (n: number) => Number(n.toFixed(3));

/** Punto del eje i (de 5) a una distancia 0–1 del centro. */
function punto(i: number, v: number) {
  const a = (Math.PI * 2 * i) / EJES.length - Math.PI / 2;
  return [r3(CX + Math.cos(a) * R * v), r3(CY + Math.sin(a) * R * v)] as const;
}

function poligono(valores: number[]) {
  return valores.map((v, i) => punto(i, v).join(",")).join(" ");
}

const PUESTO = [0.86, 0.72, 0.9, 0.78, 0.68];
const PERSONA = [0.62, 0.88, 0.58, 0.84, 0.46];

export function RadarBateria({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 400 400"
      role="img"
      aria-label="Los cinco instrumentos de la batería, leídos como un solo perfil"
    >
      <defs>
        <linearGradient id="rb-puesto" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--ch-accent)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--ch-accent)" stopOpacity="0.08" />
        </linearGradient>
      </defs>

      {/* Anillos de referencia */}
      {[0.25, 0.5, 0.75, 1].map((v) => (
        <polygon
          key={v}
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
          <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="currentColor" strokeWidth="1" opacity="0.16" />
        );
      })}

      {/* Lo que el puesto exige */}
      <polygon
        points={poligono(PUESTO)}
        fill="url(#rb-puesto)"
        stroke="var(--ch-accent)"
        strokeWidth="1.5"
      />

      {/* Lo que la persona ofrece */}
      <polygon
        points={poligono(PERSONA)}
        fill="none"
        stroke="var(--ch-accent-2, currentColor)"
        strokeWidth="2"
        strokeDasharray="5 4"
      />

      {/* Vértices de la persona */}
      {PERSONA.map((v, i) => {
        const [x, y] = punto(i, v);
        return <circle key={i} cx={x} cy={y} r="3.5" fill="var(--ch-accent-2, currentColor)" />;
      })}

      {/* Etiquetas */}
      {EJES.map((eje, i) => {
        const [x, y] = punto(i, 1.2);
        const anchor = x < CX - 12 ? "end" : x > CX + 12 ? "start" : "middle";
        return (
          <text
            key={eje}
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
      <g transform="translate(118, 364)" fontSize="11" fill="currentColor">
        <rect width="12" height="3" y="-2" fill="var(--ch-accent)" rx="1.5" />
        <text x="18" y="2" opacity="0.72">lo que el puesto exige</text>
        <rect width="12" height="3" x="150" y="-2" fill="var(--ch-accent-2, currentColor)" rx="1.5" />
        <text x="168" y="2" opacity="0.72">lo que la persona ofrece</text>
      </g>
    </svg>
  );
}
