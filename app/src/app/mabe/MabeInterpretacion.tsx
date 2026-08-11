"use client";

import {
  CUADRANTES,
  NOMBRES_CUADRANTE,
  NOMBRES_VALOR,
  VALORES,
  type ResultadoMabe,
} from "@/lib/mabe";
import s from "./MabeInterpretacion.module.css";

function fmt(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function topBrechas<T extends string>(
  record: Record<T, number>,
  nombres: Record<T, string>,
  n = 3,
) {
  return Object.entries(record)
    .map(([k, v]) => ({ key: k as T, val: v as number, nombre: nombres[k as T] }))
    .sort((a, b) => Math.abs(b.val) - Math.abs(a.val))
    .slice(0, n);
}

export function MabeInterpretacion({
  resultado: r,
  participante,
  puesto,
  textoBorrador,
}: {
  resultado: ResultadoMabe;
  participante: string;
  puesto?: string;
  textoBorrador: string;
}) {
  const topProc = topBrechas(r.brechas.proceso, NOMBRES_CUADRANTE);
  const topVal = topBrechas(r.brechas.valores, NOMBRES_VALOR);

  const ajusteGlobal =
    Object.values(r.brechas.proceso).reduce((s, v) => s + Math.abs(v), 0) +
    Object.values(r.brechas.valores).reduce((s, v) => s + Math.abs(v), 0);

  return (
    <div className={s.wrap}>
      <header className={s.hero}>
        <div>
          <span className={s.eyebrow}>Ajuste persona – puesto</span>
          <h2>{participante}</h2>
          {puesto && <p className={s.sub}>Puesto de referencia: {puesto}</p>}
        </div>
        <div className={s.scoreCard}>
          <span>Índice de brecha total</span>
          <strong>{fmt(ajusteGlobal)}</strong>
          <small>Suma de |brechas| en proceso + valores</small>
        </div>
      </header>

      <div className={s.grid}>
        <section className={s.card}>
          <h3>Mayores brechas — proceso pensante</h3>
          <ul className={s.brechaList}>
            {topProc.map((b) => (
              <li key={b.key} className={b.val >= 0 ? s.pos : s.neg}>
                <span className={s.key}>{b.key}</span>
                <span className={s.nombre}>{b.nombre}</span>
                <strong>
                  {b.val > 0 ? "+" : ""}
                  {fmt(b.val)}
                </strong>
              </li>
            ))}
          </ul>
          <p className={s.nota}>
            Positivo: la persona supera lo que el puesto demanda en ese cuadrante.
          </p>
        </section>

        <section className={s.card}>
          <h3>Mayores brechas — valores</h3>
          <ul className={s.brechaList}>
            {topVal.map((b) => (
              <li key={b.key} className={b.val >= 0 ? s.pos : s.neg}>
                <span className={s.key}>{b.key}</span>
                <span className={s.nombre}>{b.nombre}</span>
                <strong>
                  {b.val > 0 ? "+" : ""}
                  {fmt(b.val)}
                </strong>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className={s.card}>
        <h3>Combinaciones del puesto (cuadrantes)</h3>
        <div className={s.comboGrid}>
          {(
            [
              ["L", "Izquierdo (A+L)", r.combinaciones.L],
              ["R", "Derecho (I+V)", r.combinaciones.R],
              ["C", "Cortical (A+V)", r.combinaciones.C],
              ["S", "Límbico (L+I)", r.combinaciones.S],
            ] as const
          ).map(([k, label, val]) => (
            <div key={k} className={s.combo}>
              <span>{k}</span>
              <small>{label}</small>
              <strong>{val}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className={s.card}>
        <h3>Detalle completo de brechas</h3>
        <div className={s.detalleGrid}>
          <div>
            <h4>Proceso pensante</h4>
            {CUADRANTES.map((q) => (
              <div key={q} className={s.detalleRow}>
                <span>
                  {q} · {NOMBRES_CUADRANTE[q]}
                </span>
                <span className={r.brechas.proceso[q] >= 0 ? s.pos : s.neg}>
                  {r.brechas.proceso[q] > 0 ? "+" : ""}
                  {fmt(r.brechas.proceso[q])}
                </span>
              </div>
            ))}
          </div>
          <div>
            <h4>Valores Spranger</h4>
            {VALORES.map((v) => (
              <div key={v} className={s.detalleRow}>
                <span>
                  {v} · {NOMBRES_VALOR[v]}
                </span>
                <span className={r.brechas.valores[v] >= 0 ? s.pos : s.neg}>
                  {r.brechas.valores[v] > 0 ? "+" : ""}
                  {fmt(r.brechas.valores[v])}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={s.card}>
        <h3>Texto borrador del informe</h3>
        <pre className={s.pre}>{textoBorrador}</pre>
        <p className={s.nota}>
          Completar con manual MABE_2007: combinaciones de valores, supervisión efectiva y textos
          clínicos por par de valores altos.
        </p>
      </section>
    </div>
  );
}
