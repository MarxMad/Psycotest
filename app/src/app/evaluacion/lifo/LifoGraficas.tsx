"use client";

import { ESTILOS, PERFILES } from "@/data/lifo";
import {
  ESTILOS_LIFO,
  MAX_ESTILO,
  MIN_ESTILO,
  type ResultadoCondicion,
  type ResultadoLifo,
} from "@/lib/lifo";
import s from "./LifoGraficas.module.css";

const RANGO = MAX_ESTILO - MIN_ESTILO;
/** Promedio esperado: 90 / 4. */
const MEDIA = 22.5;

function altura(v: number) {
  return ((v - MIN_ESTILO) / RANGO) * 100;
}

function Condicion({ titulo, c }: { titulo: string; c: ResultadoCondicion }) {
  const perfil = PERFILES[c.perfil];
  return (
    <section className={s.block}>
      <header>
        <h3>{titulo}</h3>
        <p className={s.perfil}>
          {perfil.nombre}
          {c.primarioModerado ? " · moderado" : ""}
        </p>
      </header>
      <div className={s.chart} role="img" aria-label={`${titulo}: ${ESTILOS_LIFO.map((e) => `${ESTILOS[e].sigla} ${c.puntajes[e]}`).join(", ")}`}>
        {ESTILOS_LIFO.map((e) => {
          const pref = c.preferidos.includes(e);
          const menos = c.menosPreferidos.includes(e);
          return (
            <div key={e} className={s.col}>
              <span className={s.val}>{c.puntajes[e]}</span>
              <div className={s.track}>
                <div
                  className={s.bar}
                  data-tipo={pref ? "pref" : menos ? "menos" : undefined}
                  style={{ height: `${Math.max(3, altura(c.puntajes[e]))}%` }}
                />
                <i className={s.media} style={{ bottom: `${altura(MEDIA)}%` }} title="Media 22.5" />
              </div>
              <span className={s.key}>{ESTILOS[e].sigla}</span>
              <span className={s.name}>{ESTILOS[e].nombre}</span>
            </div>
          );
        })}
      </div>
      <dl className={s.leyenda}>
        <div>
          <dt>Preferidos</dt>
          <dd>{c.preferidos.map((e) => ESTILOS[e].nombre).join(" + ") || "—"}</dd>
        </div>
        <div>
          <dt>Menos preferidos</dt>
          <dd>{c.menosPreferidos.map((e) => ESTILOS[e].nombre).join(" + ") || "—"}</dd>
        </div>
        <div>
          <dt>Suma</dt>
          <dd>{c.total} / 90</dd>
        </div>
      </dl>
    </section>
  );
}

export function LifoGraficas({ cal }: { cal: ResultadoLifo }) {
  return (
    <div className={s.wrap}>
      <header className={s.head}>
        <p>
          Protocolo {cal.completo ? "completo" : `incompleto (${cal.respondidas}/18 grupos)`} ·{" "}
          {cal.cambiaBajoEstres
            ? "cambia de estilo bajo estrés"
            : "mismo patrón en condiciones habituales y de estrés"}
        </p>
        <p className={s.meta}>Escala 9–36 por estilo · preferidos: a 3 puntos o menos del más alto</p>
        {cal.alertas.length > 0 && (
          <ul className={s.alerts}>
            {cal.alertas.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        )}
      </header>
      <div className={s.grid}>
        <Condicion titulo="Condiciones habituales" c={cal.habitual} />
        <Condicion titulo="Condiciones de estrés" c={cal.estres} />
      </div>
    </div>
  );
}
