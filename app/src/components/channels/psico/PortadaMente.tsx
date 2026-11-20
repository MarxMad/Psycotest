"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { menosMovimiento } from "@/lib/aparicion";
import { LogoPsi3D } from "./LogoPsi";
import { ARTE } from "./ArteMente";
import s from "./portada-mente.module.css";

/**
 * Portada «Abre la mente».
 *
 * La cabeza de una persona se abre y de adentro salen los instrumentos de la
 * batería: lo que el psicólogo ve y lo que la empresa contrata. Cada objeto
 * es también un acceso a su prueba.
 *
 * El arte es provisional (dibujado en código). Para usar el definitivo basta
 * con poner `imagen` en cada objeto (PNG/WebP con fondo transparente en
 * /public/psico/mente) y la foto recortada de la persona en PERSONA.
 */

type Objeto = {
  id: keyof typeof ARTE | "psi";
  etiqueta: string;
  href: string;
  /** Posición final, en % de la portada */
  x: number;
  y: number;
  /** Tamaño en vmin */
  t: number;
  /** Profundidad para el paralaje: más alto, más se mueve */
  prof: number;
  giro: number;
  imagen?: string;
};

// Un ramillete que brota de la cabeza: apretado al centro, como si saliera
// del hueco, y con un par de satélites a los lados. El orden es el de las
// capas: los primeros quedan detrás.
const OBJETOS: Objeto[] = [
  { id: "cerebro", etiqueta: "Batería completa", href: "#bateria", x: 50, y: 37, t: 21, prof: 0.9, giro: -4 },
  { id: "radar", etiqueta: "Perfil laboral · PAPI", href: "#bateria", x: 59, y: 27, t: 11, prof: 0.5, giro: 8 },
  { id: "psi", etiqueta: "Quiénes somos", href: "#hola", x: 42, y: 27, t: 12, prof: 0.6, giro: -12 },
  { id: "informe", etiqueta: "Informe en 72 h", href: "#hola", x: 37, y: 42, t: 13, prof: 1.1, giro: -14 },
  { id: "disc", etiqueta: "Comportamiento · Cleaver", href: "#bateria", x: 63, y: 41, t: 14, prof: 1.2, giro: 10 },
  { id: "ruta", etiqueta: "Decisiones · MABE", href: "#bateria", x: 70, y: 27, t: 9, prof: 0.4, giro: 6 },
  { id: "brujula", etiqueta: "Estilos · LIFO", href: "#bateria", x: 27, y: 53, t: 12, prof: 1.5, giro: -10 },
  { id: "balanza", etiqueta: "Valores · Hartman", href: "#bateria", x: 74, y: 52, t: 13, prof: 1.5, giro: 8 },
  { id: "casa", etiqueta: "Estudio socioeconómico", href: "#bateria", x: 30, y: 30, t: 9, prof: 0.5, giro: 12 },
];

/** Foto recortada de la persona (definitiva). Mientras, se dibuja la cabeza. */
const PERSONA: { tapa?: string; cara?: string } = {};

/** Dónde nace cada objeto: el hueco de la cabeza, en % de la portada. */
const ORIGEN = { x: 50, y: 62 };

export function PortadaMente({
  titulo,
  children,
  onListo,
}: {
  /** Nombre gigante detrás de los objetos */
  titulo: string;
  /** Titular, interruptor y acciones (abajo a la izquierda) */
  children: ReactNode;
  onListo: () => void;
}) {
  const zona = useRef<HTMLElement>(null);
  const [fase, setFase] = useState<"cerrada" | "abriendo" | "abierta">("cerrada");
  const [activo, setActivo] = useState<string | null>(null);

  // La portada no espera videos: está lista en cuanto pinta.
  useEffect(() => {
    onListo();
  }, [onListo]);

  // Coreografía de entrada: sube la cabeza, se abre, salen los objetos.
  useEffect(() => {
    if (menosMovimiento()) {
      setFase("abierta");
      return;
    }
    // Si está el cargador (primera visita), la función empieza cuando se va.
    const inicio = document.querySelector("[data-cargador]") ? 1700 : 0;
    zona.current?.style.setProperty("--inicio", `${inicio}ms`);
    const t1 = window.setTimeout(() => setFase("abriendo"), inicio + 1500);
    const t2 = window.setTimeout(() => setFase("abierta"), inicio + 2300);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  // Paralaje con el puntero y la mirada que lo sigue. Se escribe directo en
  // variables CSS (sin re-render) y una vez por cuadro.
  useEffect(() => {
    const el = zona.current;
    if (!el || menosMovimiento()) return;
    let cuadro = 0;
    let mx = 0;
    let my = 0;
    const pintar = () => {
      cuadro = 0;
      el.style.setProperty("--mx", mx.toFixed(3));
      el.style.setProperty("--my", my.toFixed(3));
    };
    const mover = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width) * 2 - 1;
      my = ((e.clientY - r.top) / r.height) * 2 - 1;
      if (!cuadro) cuadro = requestAnimationFrame(pintar);
    };
    const salir = () => {
      mx = 0;
      my = 0;
      if (!cuadro) cuadro = requestAnimationFrame(pintar);
    };
    el.addEventListener("pointermove", mover);
    el.addEventListener("pointerleave", salir);
    return () => {
      el.removeEventListener("pointermove", mover);
      el.removeEventListener("pointerleave", salir);
      cancelAnimationFrame(cuadro);
    };
  }, []);

  // Al bajar, la cabeza se hunde y los objetos se dispersan hacia arriba.
  useEffect(() => {
    const el = zona.current;
    if (!el || menosMovimiento()) return;
    let cuadro = 0;
    const leer = () => {
      cuadro = 0;
      const p = Math.min(1, Math.max(0, window.scrollY / el.offsetHeight));
      el.style.setProperty("--sp", p.toFixed(3));
    };
    const alBajar = () => {
      if (!cuadro) cuadro = requestAnimationFrame(leer);
    };
    leer();
    window.addEventListener("scroll", alBajar, { passive: true });
    return () => {
      window.removeEventListener("scroll", alBajar);
      cancelAnimationFrame(cuadro);
    };
  }, []);

  return (
    <section id="acceso" ref={zona} className={s.portada} data-fase={fase} data-tono="oscuro" aria-label="Inicio">
      <h2 className={s.nombre} aria-hidden>
        {titulo.split(" ").map((p, i) => (
          <span key={p} className={s.nombreLinea} style={{ ["--i" as string]: i }}>
            <span>{p}</span>
          </span>
        ))}
      </h2>

      <div className={s.persona}>
        <Cabeza tapa={PERSONA.tapa} cara={PERSONA.cara} />
      </div>

      <ul className={s.objetos} aria-label="Lo que evaluamos">
        {OBJETOS.map((o, i) => {
          const Arte = o.id === "psi" ? null : ARTE[o.id];
          return (
            <li
              key={o.id}
              className={s.objeto}
              data-activo={activo === o.id || undefined}
              style={
                {
                  "--x": o.x,
                  "--y": o.y,
                  "--t": `${o.t}vmin`,
                  "--prof": o.prof,
                  "--giro": `${o.giro}deg`,
                  "--dx": `${ORIGEN.x - o.x}vw`,
                  "--dy": `${ORIGEN.y - o.y}svh`,
                  "--retraso": `${i * 70}ms`,
                  "--fase": `${(i * 0.37) % 1}`,
                } as React.CSSProperties
              }
            >
              <a
                href={o.href}
                className={s.objetoEnlace}
                onPointerEnter={() => setActivo(o.id)}
                onPointerLeave={() => setActivo(null)}
                onFocus={() => setActivo(o.id)}
                onBlur={() => setActivo(null)}
              >
                <span className={s.vuelo}>
                  <span className={s.flota}>
                    <span className={s.arte}>
                      {o.imagen ? (
                        <img src={o.imagen} alt="" />
                      ) : o.id === "psi" ? (
                        <LogoPsi3D className={s.psi} />
                      ) : Arte ? (
                        <Arte />
                      ) : null}
                    </span>
                  </span>
                </span>
                <span className={s.etiqueta}>{o.etiqueta}</span>
              </a>
            </li>
          );
        })}
      </ul>

      <div className={s.texto}>{children}</div>
    </section>
  );
}

/**
 * Cabeza provisional, estilo calcomanía: tapa (cabello) y cara por separado
 * para que la tapa se levante. Los ojos siguen al puntero.
 */
function Cabeza({ tapa, cara }: { tapa?: string; cara?: string }) {
  if (tapa && cara) {
    return (
      <>
        <img src={cara} alt="" className={s.cara} />
        <img src={tapa} alt="" className={s.tapa} />
      </>
    );
  }
  return (
    <>
      <svg className={s.cara} viewBox="0 0 400 420" aria-hidden>
        <defs>
          <radialGradient id="pm-piel" cx="45%" cy="40%" r="70%">
            <stop offset="0" stopColor="#f4dcc2" />
            <stop offset="1" stopColor="#d9b493" />
          </radialGradient>
          <radialGradient id="pm-hueco" cx="50%" cy="40%" r="60%">
            <stop offset="0" stopColor="#0a1a16" />
            <stop offset="1" stopColor="#1d3d34" />
          </radialGradient>
        </defs>
        {/* Contorno blanco de calcomanía */}
        <path
          d="M78 92 C70 40 120 8 200 8 C280 8 330 40 322 92 L330 210 C330 300 280 360 200 372 C120 360 70 300 70 210 Z M150 360 L150 420 L250 420 L250 360 Z"
          fill="#fff"
          stroke="#fff"
          strokeWidth="26"
          strokeLinejoin="round"
        />
        {/* Cuello y cara */}
        <path d="M160 340 L160 420 L240 420 L240 340 Z" fill="#cfa684" />
        <path
          d="M84 92 C78 46 124 16 200 16 C276 16 322 46 316 92 L322 210 C322 296 276 350 200 362 C124 350 78 296 78 210 Z"
          fill="url(#pm-piel)"
        />
        {/* Hueco de la cabeza: se ve cuando la tapa se levanta */}
        <ellipse cx="200" cy="40" rx="118" ry="30" fill="url(#pm-hueco)" />
        {/* Cejas */}
        <path d="M118 150 Q145 136 172 146" stroke="#3a2a22" strokeWidth="9" fill="none" strokeLinecap="round" />
        <path d="M228 146 Q255 136 282 150" stroke="#3a2a22" strokeWidth="9" fill="none" strokeLinecap="round" />
        {/* Ojos con pupila que sigue al puntero */}
        <g className={s.ojo}>
          <ellipse cx="145" cy="186" rx="26" ry="17" fill="#fff" />
          <circle className={s.pupila} cx="145" cy="186" r="10" fill="#1b1410" />
        </g>
        <g className={s.ojo}>
          <ellipse cx="255" cy="186" rx="26" ry="17" fill="#fff" />
          <circle className={s.pupila} cx="255" cy="186" r="10" fill="#1b1410" />
        </g>
        {/* Nariz y boca */}
        <path d="M200 200 Q192 250 206 262" stroke="#b98c6c" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M168 300 Q200 318 232 300" stroke="#9c5a4a" strokeWidth="8" fill="none" strokeLinecap="round" />
      </svg>

      <svg className={s.tapa} viewBox="0 0 400 140" aria-hidden>
        {/* Cabello: la «tapa» que se abre, con su borde de calcomanía */}
        <path
          d="M70 126 C52 50 110 4 200 4 C290 4 348 50 330 126 C300 108 260 100 200 100 C140 100 100 108 70 126 Z"
          fill="#2a1d17"
          stroke="#fff"
          strokeWidth="12"
          strokeLinejoin="round"
        />
        <path d="M120 40 Q170 20 230 30" stroke="#4a362b" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M150 64 Q210 46 270 58" stroke="#4a362b" strokeWidth="6" fill="none" strokeLinecap="round" />
      </svg>
    </>
  );
}
