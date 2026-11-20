/**
 * Objetos provisionales de la portada «Abre la mente», en volumen suave
 * (degradados y sombra) con la paleta de la marca. Se sustituyen por los
 * renders definitivos poniendo `imagen` en cada objeto de PortadaMente.
 */

const VERDE = "#1d5244";
const CREMA = "#f1e3cf";
const ROJO = "#d8342a";
const AMARILLO = "#f2d64b";

function Cerebro() {
  return (
    <svg viewBox="0 0 200 170">
      <defs>
        <radialGradient id="am-cerebro" cx="38%" cy="30%" r="80%">
          <stop offset="0" stopColor="#ffd9d2" />
          <stop offset="0.6" stopColor="#f0a9a0" />
          <stop offset="1" stopColor="#c9776e" />
        </radialGradient>
      </defs>
      <path
        d="M100 18 C70 4 34 16 28 46 C6 54 4 90 22 104 C18 132 46 152 72 144 C84 160 116 160 128 144 C154 152 182 132 178 104 C196 90 194 54 172 46 C166 16 130 4 100 18 Z"
        fill="url(#am-cerebro)"
      />
      <g fill="none" stroke="#b9605a" strokeWidth="5" strokeLinecap="round" opacity="0.7">
        <path d="M100 22 V140" />
        <path d="M44 56 C62 50 70 66 86 60" />
        <path d="M34 92 C52 82 66 100 84 90" />
        <path d="M56 124 C70 114 80 128 92 120" />
        <path d="M116 60 C132 66 140 50 158 56" />
        <path d="M118 90 C136 100 150 82 168 92" />
        <path d="M110 120 C122 128 132 114 146 124" />
      </g>
      <ellipse cx="70" cy="44" rx="22" ry="9" fill="#fff" opacity="0.45" />
    </svg>
  );
}

function Disc() {
  // Cuatro cubos isométricos: D, I, S, C.
  const cubo = (x: number, y: number, c: string, letra: string) => (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 20 L34 0 L68 20 L34 40 Z" fill={c} style={{ filter: "brightness(1.25)" }} />
      <path d="M0 20 L34 40 L34 80 L0 60 Z" fill={c} />
      <path d="M68 20 L34 40 L34 80 L68 60 Z" fill={c} style={{ filter: "brightness(0.75)" }} />
      <text x="17" y="56" fontSize="20" fontWeight="800" fill="#fff" fontFamily="system-ui" textAnchor="middle">
        {letra}
      </text>
    </g>
  );
  return (
    <svg viewBox="0 0 170 160">
      {cubo(50, 0, ROJO, "D")}
      {cubo(16, 22, AMARILLO, "I")}
      {cubo(84, 22, "#3f8f6b", "S")}
      {cubo(50, 44, "#3b6fa8", "C")}
    </svg>
  );
}

function Brujula() {
  return (
    <svg viewBox="0 0 160 160">
      <defs>
        <radialGradient id="am-laton" cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#ffe9a8" />
          <stop offset="0.55" stopColor="#d9a94a" />
          <stop offset="1" stopColor="#8d6624" />
        </radialGradient>
      </defs>
      <circle cx="80" cy="80" r="72" fill="url(#am-laton)" />
      <circle cx="80" cy="80" r="56" fill={CREMA} />
      <g stroke={VERDE} strokeWidth="3" opacity="0.5">
        <path d="M80 30 V40 M80 120 V130 M30 80 H40 M120 80 H130" />
      </g>
      <path d="M80 34 L92 80 L80 80 Z" fill={ROJO} />
      <path d="M80 34 L68 80 L80 80 Z" fill="#a8261e" />
      <path d="M80 126 L92 80 L80 80 Z" fill="#c9c2b6" />
      <path d="M80 126 L68 80 L80 80 Z" fill="#a39c90" />
      <circle cx="80" cy="80" r="7" fill={VERDE} />
      <ellipse cx="52" cy="46" rx="18" ry="8" fill="#fff" opacity="0.5" transform="rotate(-30 52 46)" />
    </svg>
  );
}

function Balanza() {
  return (
    <svg viewBox="0 0 180 160">
      <defs>
        <linearGradient id="am-metal" x1="0" x2="1">
          <stop offset="0" stopColor="#2b6b59" />
          <stop offset="0.5" stopColor="#3f8f78" />
          <stop offset="1" stopColor="#174237" />
        </linearGradient>
      </defs>
      <rect x="84" y="24" width="12" height="112" rx="5" fill="url(#am-metal)" />
      <rect x="54" y="132" width="72" height="16" rx="8" fill={VERDE} />
      <rect x="18" y="30" width="144" height="9" rx="4.5" fill="url(#am-metal)" transform="rotate(-8 90 34)" />
      <circle cx="90" cy="26" r="9" fill={AMARILLO} />
      <g stroke="#174237" strokeWidth="2.5">
        <path d="M26 45 L12 88 M26 45 L40 88" />
        <path d="M154 25 L140 68 M154 25 L168 68" />
      </g>
      <path d="M6 88 H46 Q26 106 6 88 Z" fill={ROJO} />
      <path d="M134 68 H174 Q154 86 134 68 Z" fill={AMARILLO} />
    </svg>
  );
}

function Radar() {
  const hex = (r: number) =>
    Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      return `${(80 + Math.cos(a) * r).toFixed(1)},${(80 + Math.sin(a) * r).toFixed(1)}`;
    }).join(" ");
  const datos = [0.9, 0.6, 0.8, 0.45, 0.75, 0.55];
  const area = datos
    .map((v, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      return `${(80 + Math.cos(a) * 64 * v).toFixed(1)},${(80 + Math.sin(a) * 64 * v).toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 160 160">
      <polygon points={hex(72)} fill={CREMA} stroke="#fff" strokeWidth="6" strokeLinejoin="round" />
      <polygon points={hex(48)} fill="none" stroke={VERDE} strokeOpacity="0.2" strokeWidth="2" />
      <polygon points={hex(24)} fill="none" stroke={VERDE} strokeOpacity="0.2" strokeWidth="2" />
      <polygon points={area} fill={ROJO} fillOpacity="0.85" stroke="#a8261e" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}

function Ruta() {
  // Poste con dos flechas: tomar una decisión.
  return (
    <svg viewBox="0 0 160 170">
      <rect x="74" y="30" width="12" height="130" rx="5" fill="#8d6a4a" />
      <path d="M20 40 H112 L134 56 L112 72 H20 Z" fill={AMARILLO} stroke="#fff" strokeWidth="5" strokeLinejoin="round" />
      <path d="M140 84 H48 L26 100 L48 116 H140 Z" fill={VERDE} stroke="#fff" strokeWidth="5" strokeLinejoin="round" />
      <ellipse cx="80" cy="162" rx="34" ry="6" fill="#000" opacity="0.15" />
    </svg>
  );
}

function Casa() {
  return (
    <svg viewBox="0 0 160 150">
      <path d="M30 70 L80 26 L130 70 V136 H30 Z" fill={CREMA} />
      <path d="M130 70 L146 82 V140 L130 136 Z" fill="#d8c6ac" />
      <path d="M18 74 L80 18 L142 74" fill="none" stroke={ROJO} strokeWidth="16" strokeLinejoin="round" strokeLinecap="round" />
      <rect x="66" y="96" width="28" height="40" rx="3" fill={VERDE} />
      <rect x="40" y="84" width="18" height="18" rx="2" fill={AMARILLO} />
      <rect x="102" y="84" width="18" height="18" rx="2" fill={AMARILLO} />
    </svg>
  );
}

function Informe() {
  return (
    <svg viewBox="0 0 150 180">
      <rect x="22" y="14" width="110" height="146" rx="8" fill="#e7dccb" transform="rotate(5 77 87)" />
      <rect x="16" y="10" width="110" height="146" rx="8" fill="#fffdf8" />
      <rect x="32" y="32" width="56" height="8" rx="4" fill={VERDE} />
      {[52, 66, 80, 94].map((y) => (
        <rect key={y} x="32" y={y} width={y === 94 ? 50 : 78} height="5" rx="2.5" fill={VERDE} opacity="0.22" />
      ))}
      <circle cx="98" cy="128" r="22" fill={ROJO} />
      <circle cx="98" cy="128" r="15" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="2" />
      <text x="98" y="134" fontSize="16" fontWeight="800" fill="#fff" textAnchor="middle" fontFamily="system-ui">
        Ψ
      </text>
    </svg>
  );
}

export const ARTE = {
  cerebro: Cerebro,
  disc: Disc,
  brujula: Brujula,
  balanza: Balanza,
  radar: Radar,
  ruta: Ruta,
  casa: Casa,
  informe: Informe,
};
