/**
 * Portada de un diplomado cuando no hay fotografía cargada.
 *
 * No es un relleno: cada área tiene su figura, así el catálogo se lee de un
 * vistazo y dos fichas distintas no se ven iguales. El dibujo se deriva del
 * slug, de modo que un mismo diplomado siempre tiene la misma portada.
 */

type Figura = "engrane" | "libro" | "red" | "escalera" | "diana" | "capas" | "brujula" | "sello";

const FIGURAS: Figura[] = [
  "engrane",
  "libro",
  "red",
  "escalera",
  "diana",
  "capas",
  "brujula",
  "sello",
];

/** Hash estable: el servidor y el navegador deben elegir la misma figura. */
function hash(texto: string): number {
  let h = 0;
  for (let i = 0; i < texto.length; i += 1) {
    h = (h * 31 + texto.charCodeAt(i)) >>> 0;
  }
  return h;
}

const r2 = (n: number) => Number(n.toFixed(2));

const DIENTES = Array.from({ length: 12 }, (_, i) => {
  const a = (Math.PI * 2 * i) / 12;
  return {
    i,
    x: r2(100 + Math.cos(a) * 46),
    y: r2(70 + Math.sin(a) * 46),
    rot: r2((360 * i) / 12),
  };
});

const NODOS = [
  [48, 34], [100, 22], [152, 40], [34, 78], [100, 66], [166, 84], [62, 110], [138, 112],
] as const;
const ARISTAS = [[0, 1], [1, 2], [0, 4], [1, 4], [2, 4], [3, 4], [4, 5], [3, 6], [4, 6], [4, 7], [5, 7], [6, 7]] as const;

function Dibujo({ figura }: { figura: Figura }) {
  switch (figura) {
    case "engrane":
      return (
        <g>
          {DIENTES.map((d) => (
            <rect
              key={d.i}
              x={d.x - 5}
              y={d.y - 5}
              width="10"
              height="10"
              rx="2"
              transform={`rotate(${d.rot} ${d.x} ${d.y})`}
              fill="currentColor"
              opacity="0.55"
            />
          ))}
          <circle cx="100" cy="70" r="40" fill="none" stroke="currentColor" strokeWidth="5" />
          <circle cx="100" cy="70" r="17" fill="none" stroke="currentColor" strokeWidth="5" opacity="0.7" />
        </g>
      );
    case "libro":
      return (
        <g fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinejoin="round">
          <path d="M100 38 C78 24, 50 24, 32 32 L32 104 C50 96, 78 96, 100 110 Z" opacity="0.85" />
          <path d="M100 38 C122 24, 150 24, 168 32 L168 104 C150 96, 122 96, 100 110 Z" opacity="0.55" />
          <line x1="100" y1="38" x2="100" y2="110" opacity="0.9" />
        </g>
      );
    case "red":
      return (
        <g>
          {ARISTAS.map(([a, b]) => (
            <line
              key={`${a}-${b}`}
              x1={NODOS[a][0]}
              y1={NODOS[a][1]}
              x2={NODOS[b][0]}
              y2={NODOS[b][1]}
              stroke="currentColor"
              strokeWidth="1.6"
              opacity="0.4"
            />
          ))}
          {NODOS.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i === 4 ? 11 : 6.5} fill="currentColor" opacity={i === 4 ? 0.95 : 0.6} />
          ))}
        </g>
      );
    case "escalera":
      return (
        <g>
          {[0, 1, 2, 3].map((i) => (
            <rect
              key={i}
              x={34 + i * 34}
              y={110 - (i + 1) * 21}
              width="26"
              height={(i + 1) * 21}
              rx="3"
              fill="currentColor"
              opacity={0.3 + i * 0.18}
            />
          ))}
          <path d="M34 30 L170 30" stroke="currentColor" strokeWidth="2.5" opacity="0.35" />
        </g>
      );
    case "capas":
      return (
        <g>
          {[0, 1, 2].map((i) => (
            <path
              key={i}
              d={`M100 ${30 + i * 26} L162 ${48 + i * 26} L100 ${66 + i * 26} L38 ${48 + i * 26} Z`}
              fill="currentColor"
              opacity={0.28 + i * 0.2}
            />
          ))}
        </g>
      );
    case "brujula":
      return (
        <g>
          <circle cx="100" cy="70" r="46" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.5" />
          <path d="M100 70 L124 40 L112 74 Z" fill="currentColor" opacity="0.9" />
          <path d="M100 70 L76 100 L88 66 Z" fill="currentColor" opacity="0.45" />
          <circle cx="100" cy="70" r="5" fill="currentColor" />
        </g>
      );
    case "sello":
      return (
        <g fill="none" stroke="currentColor" strokeWidth="4">
          <circle cx="100" cy="70" r="44" opacity="0.5" />
          <circle cx="100" cy="70" r="30" opacity="0.35" />
          <path d="M78 70 L94 86 L124 56" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" opacity="0.95" />
        </g>
      );
    case "diana":
    default:
      return (
        <g fill="none" stroke="currentColor" strokeWidth="4.5">
          <circle cx="100" cy="70" r="48" opacity="0.3" />
          <circle cx="100" cy="70" r="32" opacity="0.5" />
          <circle cx="100" cy="70" r="16" opacity="0.75" />
          <circle cx="100" cy="70" r="5" fill="currentColor" stroke="none" />
          <path d="M100 70 L150 24" strokeWidth="3.5" opacity="0.85" />
        </g>
      );
  }
}

export function PortadaDiplomado({
  slug,
  clave,
  className,
}: {
  slug: string;
  clave?: string | null;
  className?: string;
}) {
  const figura = FIGURAS[hash(slug) % FIGURAS.length];
  const desplazamiento = hash(slug + "x") % 100;
  const giro = (hash(slug + "g") % 24) - 12;

  return (
    <svg
      className={className}
      viewBox="0 0 200 140"
      preserveAspectRatio="xMidYMid slice"
      role="img" aria-label={clave ? `Portada del diplomado ${clave}` : "Portada del diplomado"}>
      <defs>
        <linearGradient id={`pd-${slug}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--ch-accent)" stopOpacity="0.14" />
          <stop offset={`${40 + (desplazamiento % 25)}%`} stopColor="var(--ch-accent-2)" stopOpacity="0.1" />
          <stop offset="100%" stopColor="var(--ch-accent)" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <rect width="200" height="140" fill={`url(#pd-${slug})`} />
      <g color="var(--ch-accent)" opacity="0.72" transform={`rotate(${giro} 100 70)`}>
        <Dibujo figura={figura} />
      </g>
    </svg>
  );
}
