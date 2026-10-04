"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Trama } from "./arte";
import { Contador } from "./Contador";
import s from "./Secciones.module.css";

const EASE = [0.22, 1, 0.36, 1] as const;

function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 26 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{ duration: 0.65, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Una frase a gran escala. Corta el ritmo de las rejillas. */
export function Declaracion({
  texto,
  destacado,
  pie,
  trama = "rejilla",
  id,
  compacta,
}: {
  texto: string;
  destacado?: string;
  pie?: string;
  trama?: "rejilla" | "puntos" | "curvas" | "radial";
  id?: string;
  /** Le sigue otra sección pegada: menos aire abajo. */
  compacta?: boolean;
}) {
  return (
    <section
      className={`${s.declaracion} ${compacta ? s.declaracionCompacta : ""}`}
      id={id}
    >
      <Trama variante={trama} className={s.declaracionTrama} />
      <div className={s.wrap}>
        <Reveal>
          <h2 className={s.declaracionTexto}>
            {texto} {destacado && <em>{destacado}</em>}
          </h2>
          {pie && <p className={s.declaracionPie}>{pie}</p>}
        </Reveal>
      </div>
    </section>
  );
}

/** Texto a un lado, obra generada al otro. */
export function SplitObra({
  children,
  obra,
  inverso,
  id,
}: {
  children: ReactNode;
  obra: ReactNode;
  inverso?: boolean;
  id?: string;
}) {
  return (
    <section id={id} className={s.wrap}>
      <div className={`${s.split} ${inverso ? s.splitInverso : ""}`}>
        <Reveal>{children}</Reveal>
        <Reveal delay={0.12}>
          <div className={s.obra}>
            <span className={s.obraHalo} aria-hidden />
            {obra}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/** Cifras grandes: lo que se puede afirmar sin inventar nada. */
/** Un valor corto se compone como número; uno largo es una palabra y debe caber. */
function escala(valor: string): "corto" | "medio" | "largo" {
  if (valor.length <= 7) return "corto";
  if (valor.length <= 12) return "medio";
  return "largo";
}

export function Cifras({ datos }: { datos: { valor: string; etiqueta: string }[] }) {
  const rejilla = useRef<HTMLDivElement>(null);
  const [dentro, setDentro] = useState(false);

  // Un solo observador para toda la fila: el escalonado lo hace el CSS.
  useEffect(() => {
    const nodo = rejilla.current;
    if (!nodo) return;
    if (!("IntersectionObserver" in window)) {
      setDentro(true);
      return;
    }
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting) return;
        setDentro(true);
        observador.disconnect();
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    observador.observe(nodo);
    return () => observador.disconnect();
  }, []);

  return (
    <section className={s.wrap}>
      <div className={s.cifras} ref={rejilla} data-en={dentro ? "si" : "no"}>
        {datos.map((d, i) => (
          <div
            key={d.etiqueta}
            className={s.cifra}
            style={{ ["--i" as string]: i }}
          >
            <Contador
              valor={d.valor}
              className={s.cifraValor}
              data-largo={escala(d.valor)}
              retraso={Math.min(i * 90, 360)}
            />
            <span className={s.cifraRegla} aria-hidden />
            <span className={s.cifraEtiqueta}>{d.etiqueta}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Proceso como línea de tiempo. La línea sólo se dibuja cuando los pasos
 * caben en una sola fila; con más de cinco se reparten en varias.
 */
export function Pasos({
  pasos,
  id,
  pegado,
}: {
  pasos: { title: string; text: string }[];
  id?: string;
  /** Va justo debajo de una declaración: sin aire arriba. */
  pegado?: boolean;
}) {
  const enFila = pasos.length <= 5;
  const rejilla = useRef<HTMLDivElement>(null);
  const [dentro, setDentro] = useState(false);

  // La línea se traza y los puntos se encienden en orden: se lee como un recorrido.
  useEffect(() => {
    const nodo = rejilla.current;
    if (!nodo) return;
    if (!("IntersectionObserver" in window)) {
      setDentro(true);
      return;
    }
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting) return;
        setDentro(true);
        observador.disconnect();
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    observador.observe(nodo);
    return () => observador.disconnect();
  }, []);

  return (
    <section id={id} className={s.wrap}>
      <div
        ref={rejilla}
        data-en={dentro ? "si" : "no"}
        className={`${s.pasos} ${enFila ? s.pasosFila : ""} ${pegado ? s.pasosPegado : ""}`}
        style={{ ["--n" as string]: pasos.length }}
      >
        {pasos.map((p, i) => (
          <div key={p.title} className={s.paso} style={{ ["--i" as string]: i }}>
            <span className={s.pasoPunto} aria-hidden />
            <span className={s.pasoNum}>{String(i + 1).padStart(2, "0")}</span>
            <h3>{p.title}</h3>
            <p>{p.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Cita a sangre, centrada, con trama de fondo. */
export function Cita({
  texto,
  autor,
  trama = "curvas",
}: {
  texto: string;
  autor: string;
  trama?: "rejilla" | "puntos" | "curvas" | "radial";
}) {
  return (
    <section className={s.cita}>
      <Trama variante={trama} className={s.citaTrama} />
      <div className={s.wrap}>
        <Reveal>
          <blockquote className={s.citaTexto}>{texto}</blockquote>
          <p className={s.citaAutor}>{autor}</p>
        </Reveal>
      </div>
    </section>
  );
}
