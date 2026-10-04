"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { Trama } from "./arte";
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
export function Cifras({ datos }: { datos: { valor: string; etiqueta: string }[] }) {
  return (
    <section className={s.wrap}>
      <div className={s.cifras}>
        {datos.map((d, i) => (
          <Reveal key={d.etiqueta} delay={Math.min(i * 0.07, 0.3)}>
            <div className={s.cifra}>
              <span className={s.cifraValor}>{d.valor}</span>
              <span className={s.cifraEtiqueta}>{d.etiqueta}</span>
            </div>
          </Reveal>
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
  return (
    <section id={id} className={s.wrap}>
      <div
        className={`${s.pasos} ${enFila ? s.pasosFila : ""} ${pegado ? s.pasosPegado : ""}`}
        style={{ ["--n" as string]: pasos.length }}
      >
        {pasos.map((p, i) => (
          <Reveal key={p.title} delay={Math.min(i * 0.08, 0.4)}>
            <div className={s.paso}>
              <span className={s.pasoPunto} aria-hidden />
              <span className={s.pasoNum}>{String(i + 1).padStart(2, "0")}</span>
              <h3>{p.title}</h3>
              <p>{p.text}</p>
            </div>
          </Reveal>
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
