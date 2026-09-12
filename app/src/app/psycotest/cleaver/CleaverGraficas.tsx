"use client";

import {
  FACTORES_CLEAVER,
  NOMBRES_FACTOR,
  type ConteosFactor,
  type ResultadoCleaver,
} from "@/lib/cleaver";
import s from "./CleaverGraficas.module.css";

function Barras({
  titulo,
  datos,
  min,
  max,
}: {
  titulo: string;
  datos: ConteosFactor;
  min: number;
  max: number;
}) {
  const span = max - min || 1;
  return (
    <div className={s.block}>
      <h3>{titulo}</h3>
      <div className={s.chart}>
        {FACTORES_CLEAVER.map((f) => {
          const v = datos[f];
          const h = Math.max(4, ((v - min) / span) * 100);
          return (
            <div key={f} className={s.col}>
              <div className={s.track}>
                <div className={s.bar} style={{ height: `${h}%` }} title={`${f}: ${v}`} />
              </div>
              <span className={s.key}>{f}</span>
              <span className={s.val}>
                {v >= 0 ? "+" : ""}
                {v}
              </span>
              <span className={s.name}>{NOMBRES_FACTOR[f]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CleaverGraficas({ cal }: { cal: ResultadoCleaver }) {
  const mVals = FACTORES_CLEAVER.map((f) => cal.M[f]);
  const lVals = FACTORES_CLEAVER.map((f) => cal.L[f]);
  const tVals = FACTORES_CLEAVER.map((f) => cal.T[f]);
  const mMax = Math.max(8, ...mVals, ...lVals);
  const tMin = Math.min(-8, ...tVals);
  const tMax = Math.max(8, ...tVals);

  return (
    <div className={s.wrap}>
      <header className={s.head}>
        <p>
          Protocolo {cal.completo ? "completo" : `incompleto (${cal.respondidas}/24)`} · ΣT ={" "}
          {cal.validez} ({cal.validezEtiqueta})
        </p>
        {cal.alertas.length > 0 && (
          <ul className={s.alerts}>
            {cal.alertas.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        )}
      </header>
      <div className={s.grid}>
        <Barras titulo="Gráfica M — motivado" datos={cal.M} min={0} max={mMax} />
        <Barras titulo="Gráfica L — bajo presión" datos={cal.L} min={0} max={mMax} />
        <Barras titulo="Gráfica T — cotidiano (M−L)" datos={cal.T} min={tMin} max={tMax} />
      </div>
      <table className={s.table}>
        <thead>
          <tr>
            <th />
            {FACTORES_CLEAVER.map((f) => (
              <th key={f}>{f}</th>
            ))}
            <th>Σ</th>
          </tr>
        </thead>
        <tbody>
          {(
            [
              ["M", cal.M],
              ["L", cal.L],
              ["T", cal.T],
            ] as const
          ).map(([label, row]) => (
            <tr key={label}>
              <th>{label}</th>
              {FACTORES_CLEAVER.map((f) => (
                <td key={f}>
                  {label === "T" && row[f] > 0 ? "+" : ""}
                  {row[f]}
                </td>
              ))}
              <td>
                {label === "T"
                  ? cal.validez
                  : FACTORES_CLEAVER.reduce((a, f) => a + row[f], 0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
