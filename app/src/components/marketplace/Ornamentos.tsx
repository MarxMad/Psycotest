import { useId } from "react";
import o from "./ornamentos.module.css";

/*
 * Ornamentos de documento de valor: la guilloché de los billetes y los
 * títulos, y el sello circular de una entidad certificadora. Son SVG
 * calculados una sola vez al cargar el módulo (deterministas: el HTML del
 * servidor y el del cliente coinciden) y heredan `currentColor`.
 */

/** Epitrocoide: la curva que trazaba el torno de guilloché. */
function epitrocoide(R: number, r: number, d: number, escala: number, pasos = 420) {
  const vueltas = r / gcd(R, r);
  const total = Math.PI * 2 * vueltas;
  let ruta = "";
  for (let i = 0; i <= pasos * vueltas; i++) {
    const t = (i / (pasos * vueltas)) * total;
    const x = (R + r) * Math.cos(t) - d * Math.cos(((R + r) / r) * t);
    const y = (R + r) * Math.sin(t) - d * Math.sin(((R + r) / r) * t);
    ruta += `${i ? "L" : "M"}${(x * escala).toFixed(1)} ${(y * escala).toFixed(1)}`;
  }
  return ruta + "Z";
}

function gcd(a: number, b: number): number {
  return b ? gcd(b, a % b) : a;
}

/**
 * Tres bandas concéntricas. Cada una es la misma curva repetida con un leve
 * desfase de giro: los cruces forman la malla fina de un título de valor.
 */
const BANDAS = [
  { d: epitrocoide(90, 3, 9, 2.35), copias: 4, w: 0.35 },
  { d: epitrocoide(64, 2, 7, 2.4), copias: 3, w: 0.3 },
  { d: epitrocoide(40, 2, 6, 2.25), copias: 3, w: 0.3 },
];

export function Guilloche({ className = "" }: { className?: string }) {
  // Cada curva se escribe una vez y las copias la reutilizan con <use>.
  const base = `gu-${useId().replace(/:/g, "")}`;
  return (
    <svg className={`${o.guilloche} ${className}`} viewBox="-240 -240 480 480" aria-hidden focusable="false">
      <defs>
        {BANDAS.map((b, i) => (
          <path key={i} id={`${base}-${i}`} d={b.d} fill="none" stroke="currentColor" strokeWidth={b.w} />
        ))}
      </defs>
      {BANDAS.map((b, i) => (
        <g key={i} className={o.anillo}>
          {Array.from({ length: b.copias }, (_, k) => (
            <use key={k} href={`#${base}-${i}`} transform={`rotate(${(k * 360) / (b.copias * 32)})`} />
          ))}
        </g>
      ))}
      <circle r="234" fill="none" stroke="currentColor" strokeWidth="0.6" />
      <circle r="229" fill="none" stroke="currentColor" strokeWidth="0.3" strokeDasharray="1 3" />
    </svg>
  );
}

const TEXTO_SELLO = "CEDUCT · ENTIDAD DE CERTIFICACIÓN Y EVALUACIÓN · ECE 002-10 ·";

/** Borde dentado del sello de foil: 60 dientes alternando dos radios. */
const DIENTES = (() => {
  const n = 60;
  let d = "";
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 ? 113 : 119;
    d += `${i ? "L" : "M"}${(120 + r * Math.cos(a)).toFixed(2)} ${(120 + r * Math.sin(a)).toFixed(2)}`;
  }
  return d + "Z";
})();

/** Roseta fina del centro, la misma familia de curvas que la guilloché. */
const ROSETA = epitrocoide(30, 1, 7, 1.62, 900);

/** Marcas de minutero entre la banda de texto y la roseta. */
const MARCAS = Array.from({ length: 72 }, (_, i) => {
  const a = (i / 72) * Math.PI * 2;
  const r1 = 76;
  const r2 = i % 6 ? 79 : 81.5;
  return `M${(120 + r1 * Math.cos(a)).toFixed(2)} ${(120 + r1 * Math.sin(a)).toFixed(2)}L${(120 + r2 * Math.cos(a)).toFixed(2)} ${(120 + r2 * Math.sin(a)).toFixed(2)}`;
}).join("");

/**
 * Sello de la entidad: borde dentado de oro laminado, banda con el nombre
 * girando despacio, minutero, roseta guilloché y el centro grabado. Todo
 * vectorial: nítido a cualquier tamaño y en pantallas de alta densidad.
 */
export function Sello({ className = "", centro = "SEP · CONOCER" }: { className?: string; centro?: string }) {
  const id = useId().replace(/:/g, "");
  const oro = `so-${id}`;
  const brillo = `sb-${id}`;
  const fondo = `sf-${id}`;
  const aro = `sa-${id}`;
  return (
    <svg className={`${o.sello} ${className}`} viewBox="0 0 240 240" aria-hidden focusable="false">
      <defs>
        <linearGradient id={oro} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6e6b0" />
          <stop offset="0.22" stopColor="#c99f45" />
          <stop offset="0.45" stopColor="#f2dc98" />
          <stop offset="0.62" stopColor="#a87f2e" />
          <stop offset="0.82" stopColor="#e3c47a" />
          <stop offset="1" stopColor="#8a6620" />
        </linearGradient>
        <radialGradient id={fondo} cx="0.42" cy="0.36" r="0.75">
          <stop offset="0" stopColor="#1c2c49" />
          <stop offset="1" stopColor="#0a1220" />
        </radialGradient>
        <linearGradient id={brillo} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <path id={aro} d="M120 120 m-90 0 a90 90 0 1 1 180 0 a90 90 0 1 1 -180 0" />
      </defs>

      {/* Borde de foil y su relieve */}
      <path d={DIENTES} fill={`url(#${oro})`} />
      <circle cx="120" cy="120" r="108" fill={`url(#${fondo})`} />
      <circle cx="120" cy="120" r="108" fill="none" stroke={`url(#${oro})`} strokeWidth="2.2" />
      <circle cx="120" cy="120" r="103.5" fill="none" stroke={`url(#${oro})`} strokeWidth="0.6" />

      {/* Banda de texto: es lo único que gira */}
      <g className={o.selloGiro}>
        <text className={o.selloTexto} fill={`url(#${oro})`}>
          <textPath href={`#${aro}`} startOffset="0" textLength="560" lengthAdjust="spacing">
            {TEXTO_SELLO}
          </textPath>
        </text>
      </g>

      <circle cx="120" cy="120" r="83.5" fill="none" stroke={`url(#${oro})`} strokeWidth="0.9" />
      <path d={MARCAS} stroke={`url(#${oro})`} strokeWidth="0.7" />
      <circle cx="120" cy="120" r="73" fill="none" stroke={`url(#${oro})`} strokeWidth="1.4" />

      {/* Roseta y centro grabado */}
      <g transform="translate(120 120)">
        <path d={ROSETA} fill="none" stroke={`url(#${oro})`} strokeWidth="0.35" opacity="0.75" />
      </g>
      <circle cx="120" cy="120" r="44" fill={`url(#${fondo})`} stroke={`url(#${oro})`} strokeWidth="1.2" />
      <circle cx="120" cy="120" r="40.5" fill="none" stroke={`url(#${oro})`} strokeWidth="0.4" />
      <path
        transform="translate(120 104) scale(0.62)"
        d="M0 -20 L5.9 -8.1 L19 -6.2 L9.5 3.1 L11.8 16.2 L0 10 L-11.8 16.2 L-9.5 3.1 L-19 -6.2 L-5.9 -8.1 Z"
        fill={`url(#${oro})`}
      />
      <text x="120" y="129" textAnchor="middle" className={o.selloCentro} fill={`url(#${oro})`}>
        {centro.split(" · ")[0]}
      </text>
      <text x="120" y="141" textAnchor="middle" className={o.selloCentro} fill={`url(#${oro})`}>
        {centro.split(" · ")[1] ?? ""}
      </text>

      {/* Reflejo de luz sobre todo el sello */}
      <circle cx="120" cy="120" r="118" fill={`url(#${brillo})`} pointerEvents="none" />
    </svg>
  );
}
