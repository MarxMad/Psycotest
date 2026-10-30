"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type RefObject } from "react";
import { menosMovimiento } from "@/lib/aparicion";

/*
 * Arte de la portada de IGE.
 *
 * Todo sale del logo: el cuadro, los seis integrantes y la flecha que rompe
 * la esquina. Las ilustraciones repiten esa gramática —puntos que se juntan,
 * una línea que sube— para que la página entera se lea como una sola marca.
 */

const TINTA = "#1f2a3d";
const ROJO = "#d8322c";

/** Los seis puntos del logo, en coordenadas del cuadro (0–1). */
export const PUNTOS_LOGO: [number, number][] = [
  [0.15, 0.18],
  [0.5, 0.18],
  [0.15, 0.53],
  [0.76, 0.55],
  [0.47, 0.83],
  [0.82, 0.83],
];

/** La marca de IGE, dibujada para que escale sin perder filo. */
export function MarcaIge({
  className,
  style,
  tinta = "currentColor",
  titulo,
}: {
  className?: string;
  style?: CSSProperties;
  tinta?: string;
  titulo?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 92"
      className={className}
      style={style}
      role={titulo ? "img" : undefined}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
    >
      <rect x="9" y="20" width="66" height="66" fill="none" stroke={ROJO} strokeWidth="5" />
      {PUNTOS_LOGO.map(([x, y], i) => (
        <circle key={i} cx={9 + x * 66} cy={20 + y * 66} r="5.6" fill={tinta} />
      ))}
      <line x1="9" y1="86" x2="83" y2="12" stroke={ROJO} strokeWidth="4.6" />
      <polygon points="94,1 79.4,7.6 87.4,15.6" fill={ROJO} />
    </svg>
  );
}

/* ------------------------------------------------------------------ nubes */

const TONOS_NUBE = {
  lila: ["#fffaf2", "#bdb8ef"],
  durazno: ["#fff7ee", "#f1b996"],
  menta: ["#fbfff9", "#a9dcc8"],
} as const;

/**
 * Nube punteada.
 *
 * El borde se deshace con un desplazamiento de ruido y la panza se cubre de
 * puntos más densos abajo: la textura de grabado que tienen las nubes de la
 * referencia, sin cargar una sola imagen.
 */
export function Nube({
  className,
  style,
  tono = "lila",
}: {
  className?: string;
  style?: CSSProperties;
  tono?: keyof typeof TONOS_NUBE;
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [claro, oscuro] = TONOS_NUBE[tono];
  const forma = (
    <>
      <ellipse cx="130" cy="128" rx="104" ry="40" />
      <circle cx="92" cy="104" r="42" />
      <circle cx="148" cy="84" r="58" />
      <circle cx="206" cy="112" r="38" />
      <circle cx="56" cy="124" r="28" />
    </>
  );

  return (
    <svg viewBox="0 0 260 180" className={className} style={style} aria-hidden>
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.2" stopColor={claro} />
          <stop offset="1" stopColor={oscuro} />
        </linearGradient>
        <linearGradient id={`d${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.25" stopColor="#000" />
          <stop offset="1" stopColor="#fff" />
        </linearGradient>
        <pattern id={`p${id}`} width="4.5" height="4.5" patternUnits="userSpaceOnUse">
          <circle cx="1.4" cy="1.4" r="0.95" fill={oscuro} />
        </pattern>
        <mask id={`m${id}`}>
          <rect width="260" height="180" fill={`url(#d${id})`} />
        </mask>
        <filter id={`f${id}`} x="-15%" y="-15%" width="130%" height="130%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="7" />
          <feDisplacementMap in="SourceGraphic" scale="12" />
        </filter>
      </defs>
      <g filter={`url(#f${id})`}>
        <g fill={`url(#g${id})`}>{forma}</g>
        <g fill={`url(#p${id})`} mask={`url(#m${id})`}>
          {forma}
        </g>
      </g>
    </svg>
  );
}

/* ----------------------------------------------------- servicios (claras) */

function Punteado({ id, color }: { id: string; color: string }) {
  return (
    <pattern id={id} width="5" height="5" patternUnits="userSpaceOnUse">
      <circle cx="1.5" cy="1.5" r="1" fill={color} />
    </pattern>
  );
}

const trazo = { fill: "none", stroke: TINTA, strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export type ServicioArte = "diagnostico" | "directivo" | "personal" | "taller" | "conferencia";

/** Ilustración de cada servicio: línea de tinta, relleno pastel y sombra punteada. */
export function ArteServicio({ tipo, tinte }: { tipo: ServicioArte; tinte: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const sombra = `url(#s${id})`;

  return (
    <svg viewBox="0 0 320 260" aria-hidden>
      <defs>
        <Punteado id={`s${id}`} color={TINTA} />
      </defs>

      {tipo === "diagnostico" && (
        <g>
          <rect x="52" y="40" width="168" height="196" rx="10" {...trazo} fill="#fffdf8" />
          <rect x="104" y="28" width="64" height="24" rx="6" {...trazo} fill={tinte} />
          {[0, 1, 2].map((k) => (
            <polygon
              key={k}
              points={hexagono(136, 132, 26 + k * 24)}
              fill="none"
              stroke={TINTA}
              strokeOpacity={0.25}
              strokeWidth="1.4"
            />
          ))}
          <polygon points="136,72 192,110 176,168 136,174 100,160 88,104" {...trazo} fill={tinte} />
          <polygon points="136,72 192,110 176,168 136,174 100,160 88,104" fill={sombra} opacity="0.22" />
          <circle cx="232" cy="176" r="40" {...trazo} fill="#ffffff" fillOpacity="0.55" strokeWidth={3} />
          <line x1="260" y1="206" x2="292" y2="240" {...trazo} strokeWidth={9} />
          <line x1="70" y1="208" x2="168" y2="208" {...trazo} strokeOpacity={0.4} />
          <line x1="70" y1="222" x2="140" y2="222" {...trazo} strokeOpacity={0.4} />
        </g>
      )}

      {tipo === "directivo" && (
        <g>
          {[0, 1, 2, 3].map((k) => (
            <g key={k}>
              <rect x={40 + k * 58} y={190 - k * 40} width="58" height={40 + k * 40} {...trazo} fill={tinte} />
              <rect x={40 + k * 58} y={190 - k * 40} width="58" height={40 + k * 40} fill={sombra} opacity="0.18" />
            </g>
          ))}
          <line x1="256" y1="70" x2="256" y2="14" {...trazo} />
          <path d="M256 14 L292 24 L256 36 Z" fill={ROJO} stroke={ROJO} strokeLinejoin="round" />
          {[
            [69, 178],
            [127, 138],
            [150, 138],
            [185, 98],
            [208, 98],
            [243, 58],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="8" fill={TINTA} />
          ))}
        </g>
      )}

      {tipo === "personal" && (
        <g>
          <path
            d="M30 236 C 90 236, 70 160, 140 160 S 200 92, 268 58"
            fill="none"
            stroke={TINTA}
            strokeWidth="18"
            strokeOpacity="0.08"
            strokeLinecap="round"
          />
          <path d="M30 236 C 90 236, 70 160, 140 160 S 200 92, 268 58" {...trazo} strokeDasharray="2 9" />
          <circle cx="140" cy="160" r="11" fill={TINTA} />
          <circle cx="268" cy="58" r="34" {...trazo} fill="#fffdf8" />
          <circle cx="268" cy="58" r="34" fill={tinte} opacity="0.6" />
          <path d="M268 32 L276 58 L268 84 L260 58 Z" fill={ROJO} />
          <circle cx="268" cy="58" r="4" fill="#fffdf8" />
        </g>
      )}

      {tipo === "taller" && (
        <g>
          <rect x="196" y="28" width="96" height="78" rx="4" {...trazo} fill="#fffdf8" />
          <polyline points="210,90 232,70 252,80 278,46" {...trazo} stroke={ROJO} />
          <line x1="244" y1="106" x2="230" y2="140" {...trazo} />
          <line x1="244" y1="106" x2="258" y2="140" {...trazo} />
          <ellipse cx="140" cy="176" rx="104" ry="42" {...trazo} fill={tinte} />
          <ellipse cx="140" cy="176" rx="104" ry="42" fill={sombra} opacity="0.18" />
          {[
            [56, 140],
            [104, 124],
            [176, 124],
            [224, 142],
            [92, 230],
            [188, 230],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="13" fill={TINTA} />
          ))}
        </g>
      )}

      {tipo === "conferencia" && (
        <g>
          <path d="M40 120 Q160 56 280 120" {...trazo} strokeOpacity={0.35} />
          <path d="M70 96 Q160 40 250 96" {...trazo} strokeOpacity={0.2} />
          <rect x="128" y="94" width="64" height="70" rx="4" {...trazo} fill={tinte} />
          <rect x="128" y="94" width="64" height="70" rx="4" fill={sombra} opacity="0.2" />
          <line x1="160" y1="94" x2="160" y2="72" {...trazo} />
          <circle cx="160" cy="66" r="7" fill={ROJO} />
          {[0, 1, 2].map((fila) =>
            Array.from({ length: 6 + fila }, (_, k) => {
              const n = 6 + fila;
              const x = 160 + (k - (n - 1) / 2) * 34;
              return <circle key={`${fila}-${k}`} cx={x} cy={190 + fila * 24} r="8" fill={TINTA} opacity={1 - fila * 0.22} />;
            }),
          )}
        </g>
      )}
    </svg>
  );
}

function hexagono(cx: number, cy: number, r: number) {
  return Array.from({ length: 6 }, (_, k) => {
    const a = (Math.PI / 3) * k - Math.PI / 2;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
}

/* --------------------------------------------------- formatos (oscuras) */

const LUZ = "#cdeee0";

export type FormatoArte = "privado" | "programa" | "publico" | "conferencia";

/** Lámina técnica de cada formato: líneas claras sobre azul, como un plano. */
export function ArteFormato({ tipo }: { tipo: FormatoArte }) {
  const linea = { fill: "none", stroke: LUZ, strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;

  return (
    <svg viewBox="0 0 360 220" aria-hidden>
      {Array.from({ length: 9 }, (_, k) => (
        <line key={`v${k}`} x1={k * 45} y1="0" x2={k * 45} y2="220" stroke={LUZ} strokeOpacity="0.07" />
      ))}
      {Array.from({ length: 5 }, (_, k) => (
        <line key={`h${k}`} x1="0" y1={k * 55} x2="360" y2={k * 55} stroke={LUZ} strokeOpacity="0.07" />
      ))}

      {tipo === "privado" && (
        <g>
          <path d="M70 186 V84 L180 34 L290 84 V186 Z" {...linea} />
          <rect x="112" y="112" width="136" height="46" rx="23" {...linea} strokeDasharray="4 5" />
          {[
            [126, 100],
            [180, 96],
            [234, 100],
            [126, 172],
            [180, 176],
            [234, 172],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="7" fill={LUZ} />
          ))}
          <text x="80" y="206" fill={LUZ} fontSize="9" letterSpacing="1.5" opacity="0.7">
            EN TUS INSTALACIONES
          </text>
        </g>
      )}

      {tipo === "programa" && (
        <g>
          <line x1="30" y1="186" x2="330" y2="186" {...linea} strokeOpacity={0.5} />
          <path d="M40 176 C 110 170, 140 140, 180 116 S 270 50, 320 40" {...linea} strokeWidth={2.4} />
          {[40, 110, 180, 250, 320].map((x, i) => (
            <g key={x}>
              <line x1={x} y1="180" x2={x} y2="192" {...linea} />
              <text x={x - 10} y="208" fill={LUZ} fontSize="9" opacity="0.7">
                S{i + 1}
              </text>
            </g>
          ))}
          {[
            [40, 176],
            [110, 162],
            [180, 116],
            [250, 66],
            [320, 40],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="6" fill={i === 4 ? ROJO : LUZ} />
          ))}
          <rect x="34" y="22" width="96" height="26" rx="13" {...linea} />
          <text x="48" y="39" fill={LUZ} fontSize="10">
            competencia
          </text>
        </g>
      )}

      {tipo === "publico" && (
        <g>
          <rect x="70" y="30" width="220" height="164" rx="8" {...linea} />
          <line x1="70" y1="62" x2="290" y2="62" {...linea} />
          {Array.from({ length: 4 }, (_, f) =>
            Array.from({ length: 7 }, (_, c) => {
              const marcado = (f === 1 && c === 2) || (f === 2 && c === 5) || (f === 3 && c === 1);
              return (
                <rect
                  key={`${f}-${c}`}
                  x={82 + c * 29}
                  y={74 + f * 29}
                  width="22"
                  height="22"
                  rx="4"
                  fill={marcado ? LUZ : "none"}
                  stroke={LUZ}
                  strokeOpacity={marcado ? 1 : 0.35}
                />
              );
            }),
          )}
          <circle cx="98" cy="46" r="4" fill={ROJO} />
          <circle cx="262" cy="46" r="4" fill={ROJO} />
        </g>
      )}

      {tipo === "conferencia" && (
        <g>
          <path d="M40 98 Q180 30 320 98" {...linea} strokeOpacity={0.6} />
          <rect x="150" y="72" width="60" height="40" rx="3" {...linea} />
          <line x1="180" y1="72" x2="180" y2="54" {...linea} />
          <circle cx="180" cy="50" r="5" fill={ROJO} />
          {[0, 1, 2, 3].map((fila) =>
            Array.from({ length: 8 + fila * 2 }, (_, k) => {
              const n = 8 + fila * 2;
              const x = 180 + (k - (n - 1) / 2) * (26 - fila * 2);
              return <circle key={`${fila}-${k}`} cx={x} cy={136 + fila * 20} r="4.5" fill={LUZ} opacity={1 - fila * 0.2} />;
            }),
          )}
        </g>
      )}
    </svg>
  );
}

/* --------------------------------------------------- escena del método */

const CENTRO: [number, number] = [300, 240];

/** Dónde está cada uno de los seis integrantes en cada etapa del método. */
const FORMACIONES: [number, number][][] = [
  // Escuchamos: el grupo llega disperso.
  [
    [128, 118],
    [466, 104],
    [92, 300],
    [312, 128],
    [214, 396],
    [492, 352],
  ],
  // Medimos: cada uno en su eje del radar.
  radar([0.62, 0.86, 0.48, 0.74, 0.56, 0.9]),
  // Diseñamos: se acomodan sobre la retícula.
  [
    [180, 180],
    [300, 180],
    [420, 180],
    [180, 300],
    [300, 300],
    [420, 300],
  ],
  // Intervenimos: conectados al trabajo común.
  [
    [176, 150],
    [300, 104],
    [424, 150],
    [176, 330],
    [300, 376],
    [424, 330],
  ],
  // Sostenemos: la formación del logo.
  PUNTOS_LOGO.map(([x, y]) => [170 + x * 260, 130 + y * 260]),
];

const EJES = ["Clima", "Comunicación", "Mando", "Acuerdos", "Seguimiento", "Carga"];

function radar(valores: number[]): [number, number][] {
  return valores.map((v, k) => {
    const a = (Math.PI / 3) * k - Math.PI / 2;
    return [CENTRO[0] + 170 * v * Math.cos(a), CENTRO[1] + 170 * v * Math.sin(a)];
  });
}

const ETIQUETA_PASO = ["Reunión inicial", "Diagnóstico", "Propuesta · costo cerrado", "En sitio o en línea", "Volvemos a medir"];

/*
 * El hilo del método: las cinco etapas viven a lo largo de una sola línea y
 * el panel es una ventana que viaja por ella. Un círculo de luz recorre el
 * hilo con el scroll y la cámara lo sigue con un poco de retraso, así que
 * entre una etapa y otra se ve el camino en vez de un corte.
 */

/** Dónde queda cada etapa en el mundo: alternan arriba y abajo para que el hilo ondule. */
const ESTACIONES: [number, number][] = [0, 1, 2, 3, 4].map((k) => [300 + k * 680, k % 2 ? 500 : 240]);

const HILO = (() => {
  const [x0, y0] = ESTACIONES[0];
  let d = `M ${x0 - 420} ${y0 - 190} C ${x0 - 220} ${y0 - 170} ${x0 - 160} ${y0} ${x0} ${y0}`;
  for (let k = 1; k < ESTACIONES.length; k++) {
    const [ax, ay] = ESTACIONES[k - 1];
    const [bx, by] = ESTACIONES[k];
    d += ` C ${ax + 320} ${ay} ${bx - 320} ${by} ${bx} ${by}`;
  }
  const [xn, yn] = ESTACIONES[ESTACIONES.length - 1];
  return `${d} C ${xn + 160} ${yn} ${xn + 220} ${yn - 170} ${xn + 420} ${yn - 190}`;
})();

/** Se queda quieto en cada etapa y viaja sólo en la franja del cambio. */
function tramo(avance: number, n: number) {
  const c = Math.min(Math.max(avance - 0.5, 0), n - 1);
  const k = Math.min(Math.floor(c), n - 2);
  const f = Math.min(Math.max((c - k - 0.22) / 0.56, 0), 1);
  return { k, e: f * f * (3 - 2 * f) };
}

/**
 * La escena que acompaña al método. `avance` va de 0 a 5 con el scroll de
 * la sección; se lee en cada cuadro sin volver a pintar React. Los seis
 * puntos del grupo viajan por el mundo junto con el hilo y llegan a cada
 * etapa ya en su formación.
 */
export function EscenaMetodo({ paso, avance }: { paso: number; avance: RefObject<number> }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const hilo = useRef<SVGPathElement>(null);
  const recorrido = useRef<SVGPathElement>(null);
  const camara = useRef<SVGGElement>(null);
  const viajero = useRef<SVGGElement>(null);
  const grupo = useRef<(SVGGElement | null)[]>([]);
  const [nudos, setNudos] = useState<[number, number][]>([]);

  useEffect(() => {
    const ruta = hilo.current;
    if (!ruta) return;
    const total = ruta.getTotalLength();

    // Largo del hilo en cada etapa: el punto más cercano, buscado a pasos de 2.
    const largos = ESTACIONES.map(([x, y]) => {
      let mejor = 0;
      let dist = Infinity;
      for (let l = 0; l <= total; l += 2) {
        const p = ruta.getPointAtLength(l);
        const d = (p.x - x) ** 2 + (p.y - y) ** 2;
        if (d < dist) [dist, mejor] = [d, l];
      }
      return mejor;
    });
    const marcas: [number, number][] = [];
    for (let l = 90; l < total; l += 150) {
      const p = ruta.getPointAtLength(l);
      if (ESTACIONES.every(([x, y]) => (p.x - x) ** 2 + (p.y - y) ** 2 > 60 ** 2)) marcas.push([p.x, p.y]);
    }
    setNudos(marcas);
    recorrido.current?.style.setProperty("stroke-dasharray", `${total}`);

    const quieto = menosMovimiento();
    let u = 0;
    let cx = ESTACIONES[0][0];
    let cy = ESTACIONES[0][1];
    let [fx, fy] = [Infinity, Infinity];
    let cuadro = 0;
    const mover = () => {
      const { k, e } = tramo(avance.current ?? 0, ESTACIONES.length);
      cuadro = requestAnimationFrame(mover);
      // Quieto en su parada no hay nada que volver a escribir.
      if (Math.abs(k + e - u) < 0.0005 && Math.abs(fx - cx) + Math.abs(fy - cy) < 0.05) return;
      u += (k + e - u) * (quieto ? 1 : 0.16);
      const a = Math.min(Math.floor(u), ESTACIONES.length - 2);
      const f = u - a;
      const largo = largos[a] + (largos[a + 1] - largos[a]) * f;
      const p = ruta.getPointAtLength(largo);
      [fx, fy] = [p.x, p.y];
      // La cámara va detrás del círculo: se le ve adelantarse y luego llegar.
      cx += (p.x - cx) * (quieto ? 1 : 0.09);
      cy += (p.y - cy) * (quieto ? 1 : 0.09);
      viajero.current?.setAttribute("transform", `translate(${p.x} ${p.y})`);
      camara.current?.setAttribute("transform", `translate(${(300 - cx).toFixed(2)} ${(240 - cy).toFixed(2)})`);
      recorrido.current?.style.setProperty("stroke-dashoffset", `${total - largo}`);
      // El grupo viaja con el hilo y se reacomoda en el camino, cada uno un poco después del anterior.
      grupo.current.forEach((nodo, i) => {
        const g = Math.min(Math.max((f - i * 0.05) / 0.75, 0), 1);
        const s = g * g * (3 - 2 * g);
        const [ax, ay] = FORMACIONES[a][i];
        const [bx, by] = FORMACIONES[a + 1][i];
        const x = ESTACIONES[a][0] - CENTRO[0] + ax + (ESTACIONES[a + 1][0] - CENTRO[0] + bx - ESTACIONES[a][0] + CENTRO[0] - ax) * s;
        const y = ESTACIONES[a][1] - CENTRO[1] + ay + (ESTACIONES[a + 1][1] - CENTRO[1] + by - ESTACIONES[a][1] + CENTRO[1] - ay) * s;
        nodo?.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
      });
    };
    mover();
    return () => cancelAnimationFrame(cuadro);
  }, [avance]);

  const capa = (n: number): CSSProperties => ({
    opacity: paso === n ? 1 : 0.22,
    transition: "opacity 700ms ease",
  });
  const en = (n: number) => `translate(${ESTACIONES[n][0] - CENTRO[0]} ${ESTACIONES[n][1] - CENTRO[1]})`;

  return (
    <svg viewBox="0 0 600 480" aria-hidden className="escena-metodo">
      <defs>
        <filter id={`b${id}`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <radialGradient id={`h${id}`}>
          <stop offset="0" stopColor={LUZ} stopOpacity="0.28" />
          <stop offset="1" stopColor={LUZ} stopOpacity="0" />
        </radialGradient>
      </defs>

      <g ref={camara} transform={`translate(${300 - ESTACIONES[0][0]} ${240 - ESTACIONES[0][1]})`}>
        {/* La retícula es del mundo: al pasar de largo es lo que cuenta que hay viaje. */}
        {Array.from({ length: 42 }, (_, k) => (
          <line key={`v${k}`} x1={k * 100 - 600} y1="-600" x2={k * 100 - 600} y2="1300" stroke={LUZ} strokeOpacity="0.06" />
        ))}
        {Array.from({ length: 17 }, (_, k) => (
          <line key={`h${k}`} x1="-600" y1={k * 120 - 600} x2="3700" y2={k * 120 - 600} stroke={LUZ} strokeOpacity="0.06" />
        ))}

        <path ref={hilo} d={HILO} fill="none" stroke={LUZ} strokeOpacity="0.22" strokeWidth="1.5" strokeDasharray="2 6" />
        <path ref={recorrido} d={HILO} fill="none" stroke={LUZ} strokeOpacity="0.85" strokeWidth="2" strokeLinecap="round" />
        {nudos.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="4.5" fill="#233046" stroke={LUZ} strokeOpacity="0.6" strokeWidth="1.4" />
        ))}

        {/* 1 · escuchar */}
        <g transform={en(0)} style={capa(0)}>
          {[70, 140, 210].map((r, k) => (
            <circle
              key={r}
              cx={CENTRO[0]}
              cy={CENTRO[1]}
              r={r}
              fill="none"
              stroke={LUZ}
              strokeOpacity={0.35 - k * 0.09}
              strokeDasharray="3 7"
              className="onda"
              style={{ animationDelay: `${k * 0.6}s` }}
            />
          ))}
          <circle cx={CENTRO[0]} cy={CENTRO[1]} r="80" fill={`url(#h${id})`} />
        </g>

        {/* 2 · medir */}
        <g transform={en(1)} style={capa(1)}>
          {[0.33, 0.66, 1].map((f) => (
            <polygon key={f} points={hexagono(CENTRO[0], CENTRO[1], 170 * f)} fill="none" stroke={LUZ} strokeOpacity="0.2" />
          ))}
          {EJES.map((eje, k) => {
            const a = (Math.PI / 3) * k - Math.PI / 2;
            const x = CENTRO[0] + 196 * Math.cos(a);
            const y = CENTRO[1] + 196 * Math.sin(a);
            return (
              <g key={eje}>
                <line
                  x1={CENTRO[0]}
                  y1={CENTRO[1]}
                  x2={CENTRO[0] + 170 * Math.cos(a)}
                  y2={CENTRO[1] + 170 * Math.sin(a)}
                  stroke={LUZ}
                  strokeOpacity="0.2"
                />
                <text x={x} y={y + 4} fill={LUZ} fontSize="12" textAnchor="middle" opacity="0.75">
                  {eje}
                </text>
              </g>
            );
          })}
          <polygon
            points={FORMACIONES[1].map(([x, y]) => `${x},${y}`).join(" ")}
            fill={LUZ}
            fillOpacity="0.12"
            stroke={LUZ}
            strokeOpacity="0.8"
            strokeWidth="1.6"
          />
        </g>

        {/* 3 · diseñar */}
        <g transform={en(2)} style={capa(2)}>
          <rect x="130" y="130" width="340" height="220" fill="none" stroke={LUZ} strokeOpacity="0.5" strokeDasharray="6 6" />
          {FORMACIONES[2].map(([x, y], i) => (
            <rect key={i} x={x - 30} y={y - 30} width="60" height="60" fill="none" stroke={LUZ} strokeOpacity="0.3" />
          ))}
          <line x1="130" y1="378" x2="470" y2="378" stroke={LUZ} strokeOpacity="0.5" />
          <line x1="130" y1="372" x2="130" y2="384" stroke={LUZ} strokeOpacity="0.5" />
          <line x1="470" y1="372" x2="470" y2="384" stroke={LUZ} strokeOpacity="0.5" />
        </g>

        {/* 4 · intervenir */}
        <g transform={en(3)} style={capa(3)}>
          {FORMACIONES[3].map(([x, y], i) => (
            <line
              key={i}
              x1={CENTRO[0]}
              y1={CENTRO[1]}
              x2={x}
              y2={y}
              stroke={LUZ}
              strokeOpacity="0.6"
              strokeDasharray="4 8"
              className="flujo"
            />
          ))}
          <circle cx={CENTRO[0]} cy={CENTRO[1]} r="30" fill="none" stroke={LUZ} strokeOpacity="0.7" />
          <circle cx={CENTRO[0]} cy={CENTRO[1]} r="52" fill={`url(#h${id})`} />
        </g>

        {/* 5 · sostener */}
        <g transform={en(4)} style={capa(4)}>
          <rect x="170" y="130" width="260" height="260" fill="none" stroke={ROJO} strokeWidth="5" />
          <line
            x1="170"
            y1="390"
            x2="510"
            y2="50"
            stroke={ROJO}
            strokeWidth="5"
            className="trazo-flecha"
            style={{ strokeDasharray: 482, strokeDashoffset: paso === 4 ? 0 : 482 }}
          />
          <polygon points="548,12 503,30 530,57" fill={ROJO} style={{ opacity: paso === 4 ? 1 : 0, transition: "opacity 300ms 700ms" }} />
        </g>

        {/* Cada etapa es una parada del hilo. */}
        {ESTACIONES.map(([x, y], k) => (
          <circle
            key={k}
            cx={x}
            cy={y}
            r="17"
            fill="none"
            stroke={k === 4 ? ROJO : LUZ}
            strokeOpacity={k <= paso ? 0.8 : 0.3}
            strokeWidth="1.5"
            style={{ transition: "stroke-opacity 500ms ease" }}
          />
        ))}

        {FORMACIONES[0].map(([x, y], i) => (
          <g
            key={i}
            ref={(nodo) => {
              grupo.current[i] = nodo;
            }}
            transform={`translate(${x + ESTACIONES[0][0] - CENTRO[0]} ${y + ESTACIONES[0][1] - CENTRO[1]})`}
          >
            <circle r="11" fill={LUZ} opacity="0.4" filter={`url(#b${id})`} />
            <circle r="5.5" fill="#f4fffa" opacity="0.9" />
          </g>
        ))}

        <g ref={viajero} transform={`translate(${ESTACIONES[0][0]} ${ESTACIONES[0][1]})`}>
          <circle r="26" fill={LUZ} opacity="0.45" filter={`url(#b${id})`} />
          <circle r="9" fill={paso === 4 ? ROJO : "#f4fffa"} style={{ transition: "fill 500ms ease" }} />
        </g>
      </g>

      <g transform="translate(36 36)">
        <rect width={ETIQUETA_PASO[paso].length * 7.4 + 28} height="30" rx="8" fill="#233046" stroke={LUZ} strokeOpacity="0.6" />
        <text x="14" y="20" fill={LUZ} fontSize="12.5">
          {ETIQUETA_PASO[paso]}
        </text>
      </g>
    </svg>
  );
}
