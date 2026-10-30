"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { BadgeCheck } from "lucide-react";
import { ETAPAS, LOGROS } from "@/lib/ceduct/config";
import { Revelar } from "../Revelar";
import s from "../mk.module.css";
import l from "./landing.module.css";

/**
 * El camino a la certificación.
 *
 * La portada ya cuenta cómo se compra (`PASOS`: elige, paga, accede), pero eso
 * no explica qué se lleva nadie. Esta sección cuenta el recorrido formativo en
 * las tres etapas con las que CEDUCT lo ha explicado siempre, que es lo que
 * justifica el precio: no vendemos un curso, reconocemos un oficio.
 *
 * Se recorre con el scroll: la sección queda fija y una luz viaja por un hilo
 * de una etapa a la siguiente, del diagnóstico al certificado.
 */

const AMARILLO = "#facc15";
const LUZ = "#bccdf0";
const CENTRO: [number, number] = [300, 240];

/** Dónde queda cada etapa en el mundo; el panel es una ventana que viaja entre ellas. */
const ESTACIONES: [number, number][] = [
  [300, 240],
  [980, 470],
  [1660, 240],
];

const HILO = (() => {
  const [x0, y0] = ESTACIONES[0];
  let d = `M ${x0 - 420} ${y0 + 180} C ${x0 - 220} ${y0 + 170} ${x0 - 160} ${y0} ${x0} ${y0}`;
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
  return k + f * f * (3 - 2 * f);
}

/** Redondeo para que servidor y navegador escriban el mismo número. */
const fijo = (n: number) => Math.round(n * 100) / 100;

/** Lo que ya sabes (lleno) y lo que falta (hueco), alrededor de ti. */
const SABERES = Array.from({ length: 6 }, (_, k) => {
  const a = (Math.PI / 3) * k - Math.PI / 2;
  return { x: fijo(CENTRO[0] + 130 * Math.cos(a)), y: fijo(CENTRO[1] + 130 * Math.sin(a)), sabe: k !== 2 && k !== 4 };
});

const MODULOS = ["Módulo 1", "Módulo 2", "Módulo 3", "Módulo 4"];

function menosMovimiento() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function Escena({ etapa, avance }: { etapa: number; avance: React.RefObject<number> }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const lienzo = useRef<SVGSVGElement>(null);
  const hilo = useRef<SVGPathElement>(null);
  const recorrido = useRef<SVGPathElement>(null);
  const camara = useRef<SVGGElement>(null);
  const viajero = useRef<SVGGElement>(null);
  const [nudos, setNudos] = useState<[number, number][]>([]);
  const [angosto, setAngosto] = useState(false);

  useEffect(() => {
    const nodo = lienzo.current;
    if (!nodo) return;
    const medir = () => setAngosto(nodo.clientWidth < nodo.clientHeight);
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(nodo);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const ruta = hilo.current;
    if (!ruta) return;
    const total = ruta.getTotalLength();
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
      if (ESTACIONES.every(([x, y]) => (p.x - x) ** 2 + (p.y - y) ** 2 > 70 ** 2)) marcas.push([p.x, p.y]);
    }
    setNudos(marcas);
    recorrido.current?.style.setProperty("stroke-dasharray", `${total}`);

    const quieto = menosMovimiento();
    let u = 0;
    let [cx, cy] = ESTACIONES[0];
    let [fx, fy] = [Infinity, Infinity];
    let cuadro = 0;
    const mover = () => {
      cuadro = requestAnimationFrame(mover);
      const meta = tramo(avance.current ?? 0, ESTACIONES.length);
      if (Math.abs(meta - u) < 0.0005 && Math.abs(fx - cx) + Math.abs(fy - cy) < 0.05) return;
      u += (meta - u) * (quieto ? 1 : 0.16);
      const a = Math.min(Math.floor(u), ESTACIONES.length - 2);
      const largo = largos[a] + (largos[a + 1] - largos[a]) * (u - a);
      const p = ruta.getPointAtLength(largo);
      [fx, fy] = [p.x, p.y];
      // La cámara va detrás de la luz: se le ve adelantarse y luego llegar.
      cx += (p.x - cx) * (quieto ? 1 : 0.09);
      cy += (p.y - cy) * (quieto ? 1 : 0.09);
      viajero.current?.setAttribute("transform", `translate(${p.x} ${p.y})`);
      camara.current?.setAttribute("transform", `translate(${(300 - cx).toFixed(2)} ${(240 - cy).toFixed(2)})`);
      recorrido.current?.style.setProperty("stroke-dashoffset", `${total - largo}`);
    };
    mover();
    return () => cancelAnimationFrame(cuadro);
  }, [avance]);

  const capa = (n: number): CSSProperties => ({ opacity: etapa === n ? 1 : 0.25, transition: "opacity 700ms ease" });
  const en = (n: number) => `translate(${ESTACIONES[n][0] - CENTRO[0]} ${ESTACIONES[n][1] - CENTRO[1]})`;

  return (
    <svg ref={lienzo} viewBox={angosto ? "80 0 440 480" : "0 0 600 480"} aria-hidden className={l.rutaLienzo}>
      <defs>
        <filter id={`b${id}`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
        <radialGradient id={`h${id}`}>
          <stop offset="0" stopColor={AMARILLO} stopOpacity="0.22" />
          <stop offset="1" stopColor={AMARILLO} stopOpacity="0" />
        </radialGradient>
      </defs>

      <g ref={camara} transform={`translate(0 0)`}>
        {Array.from({ length: 30 }, (_, k) => (
          <line key={`v${k}`} x1={k * 100 - 600} y1="-600" x2={k * 100 - 600} y2="1300" stroke={LUZ} strokeOpacity="0.06" />
        ))}
        {Array.from({ length: 17 }, (_, k) => (
          <line key={`h${k}`} x1="-600" y1={k * 120 - 600} x2="2400" y2={k * 120 - 600} stroke={LUZ} strokeOpacity="0.06" />
        ))}

        <path ref={hilo} d={HILO} fill="none" stroke={LUZ} strokeOpacity="0.25" strokeWidth="1.5" strokeDasharray="2 6" />
        <path ref={recorrido} d={HILO} fill="none" stroke={AMARILLO} strokeOpacity="0.9" strokeWidth="2" strokeLinecap="round" />
        {nudos.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="4.5" fill="#0b2a6f" stroke={LUZ} strokeOpacity="0.6" strokeWidth="1.4" />
        ))}

        {/* 1 · reconoce: lo que ya dominas alrededor tuyo, y lo que falta. */}
        <g transform={en(0)} style={capa(0)}>
          <circle cx={CENTRO[0]} cy={CENTRO[1]} r="130" fill="none" stroke={LUZ} strokeOpacity="0.25" strokeDasharray="3 7" />
          <circle cx={CENTRO[0]} cy={CENTRO[1]} r="190" fill="none" stroke={LUZ} strokeOpacity="0.12" strokeDasharray="3 9" />
          <circle cx={CENTRO[0]} cy={CENTRO[1]} r="90" fill={`url(#h${id})`} />
          {SABERES.map((b, k) => (
            <g key={k}>
              <line x1={CENTRO[0]} y1={CENTRO[1]} x2={b.x} y2={b.y} stroke={LUZ} strokeOpacity={b.sabe ? 0.35 : 0.12} />
              <circle cx={b.x} cy={b.y} r="17" fill={b.sabe ? AMARILLO : "#0b2a6f"} stroke={b.sabe ? AMARILLO : LUZ} strokeOpacity={b.sabe ? 1 : 0.5} strokeDasharray={b.sabe ? undefined : "3 4"} />
              {b.sabe && <path d={`M ${b.x - 6} ${b.y} l 4 4.5 l 8 -9`} fill="none" stroke="#0a1b45" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />}
            </g>
          ))}
        </g>

        {ESTACIONES.map(([x, y], k) => (
          <circle
            key={k}
            cx={x}
            cy={y}
            r="19"
            fill="none"
            stroke={k <= etapa ? AMARILLO : LUZ}
            strokeOpacity={k <= etapa ? 0.8 : 0.3}
            strokeWidth="1.5"
            style={{ transition: "stroke 500ms ease, stroke-opacity 500ms ease" }}
          />
        ))}

        <g ref={viajero} transform={`translate(${ESTACIONES[0][0]} ${ESTACIONES[0][1]})`}>
          <circle r="28" fill={AMARILLO} opacity="0.45" filter={`url(#b${id})`} />
          <circle r="9" fill="#fff7cc" />
        </g>

        {/* 2 · cursa: los módulos que te faltan se van llenando. */}
        <g transform={en(1)} style={capa(1)}>
          <rect x="140" y="110" width="320" height="260" rx="16" fill="#0b2a6f" fillOpacity="0.6" stroke={LUZ} strokeOpacity="0.3" />
          {MODULOS.map((m, k) => (
            <g key={m} transform={`translate(170 ${148 + k * 52})`}>
              <text x="0" y="-8" fill={LUZ} fontSize={angosto ? 15 : 12} opacity="0.8">
                {m}
              </text>
              <rect width="260" height="10" rx="5" fill={LUZ} fillOpacity="0.12" />
              <rect
                width="260"
                height="10"
                rx="5"
                fill={AMARILLO}
                style={{
                  transformBox: "fill-box",
                  transform: `scaleX(${etapa >= 1 ? [1, 1, 0.75, 0.4][k] : 0})`,
                  transition: `transform 900ms cubic-bezier(0.22, 1, 0.36, 1) ${200 + k * 140}ms`,
                }}
              />
            </g>
          ))}
        </g>

        {/* 3 · certifícate: el certificado, con su sello. Como los módulos, va encima: la luz llega y se mete debajo. */}
        <g transform={en(2)} style={capa(2)}>
          <g transform="rotate(-5 300 240)">
            <rect x="140" y="130" width="320" height="210" rx="12" fill="#f0f6ff" />
            <rect x="140" y="130" width="320" height="40" rx="12" fill="#1d4ed8" />
            <rect x="140" y="158" width="320" height="12" fill="#1d4ed8" />
            <text x="160" y="156" fill="#f0f6ff" fontSize="12" fontWeight="700" letterSpacing="2">
              CERTIFICADO DE COMPETENCIA
            </text>
            <text x="160" y="204" fill="#0a1b45" fontSize="22" fontWeight="700">
              EC0217.01
            </text>
            {[226, 244, 262].map((y, k) => (
              <rect key={y} x="160" y={y} width={[200, 170, 120][k]} height="8" rx="4" fill="#0a1b45" fillOpacity="0.15" />
            ))}
            <path d="M 162 312 c 14 -16 22 10 34 -4 s 18 -10 28 2" fill="none" stroke="#1d4ed8" strokeWidth="2" />
          </g>
          <g
            style={{
              transformBox: "fill-box",
              transformOrigin: "center",
              transform: `translate(420px, 300px) scale(${etapa === 2 ? 1 : 0})`,
              transition: "transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1) 500ms",
            }}
          >
            {Array.from({ length: 16 }, (_, k) => {
              const a = (Math.PI / 8) * k;
              return <circle key={k} cx={fijo(46 * Math.cos(a))} cy={fijo(46 * Math.sin(a))} r="9" fill={AMARILLO} />;
            })}
            <circle r="46" fill={AMARILLO} />
            <circle r="34" fill="none" stroke="#0a1b45" strokeOpacity="0.25" strokeWidth="2" />
            <path d="M -14 0 l 9 10 l 19 -21" fill="none" stroke="#0a1b45" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </g>
      </g>
    </svg>
  );
}

export function Ruta() {
  const caja = useRef<HTMLElement>(null);
  const avance = useRef(0);
  const [etapa, setEtapa] = useState(0);
  const n = ETAPAS.length;

  // La etapa sale de cuánto se ha recorrido la parte fija de la sección.
  useEffect(() => {
    let pendiente = 0;
    const medir = () => {
      pendiente = 0;
      const nodo = caja.current;
      if (!nodo) return;
      const r = nodo.getBoundingClientRect();
      const recorrido = r.height - window.innerHeight;
      if (recorrido <= 0) return;
      const p = Math.min(Math.max(-r.top / recorrido, 0), 0.9999);
      avance.current = p * n;
      setEtapa(Math.floor(p * n));
    };
    const pedir = () => {
      if (!pendiente) pendiente = requestAnimationFrame(medir);
    };
    medir();
    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir);
    return () => {
      cancelAnimationFrame(pendiente);
      window.removeEventListener("scroll", pedir);
      window.removeEventListener("resize", pedir);
    };
  }, [n]);

  const irA = (k: number) => {
    const nodo = caja.current;
    if (!nodo) return;
    const r = nodo.getBoundingClientRect();
    const destino = window.scrollY + r.top + ((k + 0.5) / n) * (r.height - window.innerHeight);
    window.scrollTo({ top: destino, behavior: menosMovimiento() ? "auto" : "smooth" });
  };

  return (
    <>
      <section ref={caja} className={l.rutaHilo} aria-labelledby="ruta-titulo" style={{ "--n": n } as CSSProperties}>
        <div className={l.rutaFija}>
          <div className={l.rutaTexto}>
            <div>
              <p className={s.eyebrow}>El camino</p>
              <h2 id="ruta-titulo" className={l.rutaTitulo}>
                De lo que ya sabes a tu certificado.
              </h2>
            </div>
            <ol className={l.rutaEtapas}>
              {ETAPAS.map((e, k) => (
                <li key={e.ordinal} data-activo={k === etapa}>
                  <button type="button" onClick={() => irA(k)} aria-current={k === etapa ? "step" : undefined}>
                    <span className={l.rutaNum}>{k + 1}</span>
                    <span className={l.rutaNombre}>{e.titulo}</span>
                  </button>
                  {/* Una sola caja adentro: así la fila puede plegarse a cero. */}
                  <div className={l.rutaDetalle}>
                    <div>
                      <p>{e.resumen}</p>
                      <ul>
                        {e.pasos.map((p) => (
                          <li key={p.titulo}>
                            <strong>{p.titulo}.</strong> {p.texto}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className={l.rutaPanel}>
            <Escena etapa={Math.min(etapa, n - 1)} avance={avance} />
            <span key={etapa} className={l.rutaEtiqueta}>
              {["Diagnóstico", "Diplomado", "Certificación"][Math.min(etapa, n - 1)]}
            </span>
            <span className={l.rutaContador}>
              {String(etapa + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
            </span>
          </div>
        </div>
      </section>

      <div className={`${s.contenedor} ${l.rutaLogros}`}>
        <Revelar className={l.logros}>
          <h3 className={l.logrosTitulo}>Certifícate y obtén</h3>
          <ul className={l.logrosLista}>
            {LOGROS.map((logro) => (
              <li key={logro}>
                <BadgeCheck size={18} aria-hidden /> {logro}
              </li>
            ))}
          </ul>
        </Revelar>
      </div>
    </>
  );
}
