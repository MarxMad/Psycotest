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
  crudos,
  unidad,
}: {
  titulo: string;
  datos: ConteosFactor;
  crudos?: ConteosFactor;
  unidad: string;
}) {
  return (
    <div className={s.block}>
      <h3>{titulo}</h3>
      <div className={s.chart}>
        {FACTORES_CLEAVER.map((f) => {
          const v = datos[f];
          const h = Math.max(4, Math.min(100, v));
          return (
            <div key={f} className={s.col}>
              <div className={s.track}>
                <div
                  className={s.bar}
                  style={{ height: `${h}%` }}
                  title={`${f}: ${Math.round(v)}${unidad}${crudos ? ` (crudo ${crudos[f]})` : ""}`}
                />
                <i className={s.mid} title="Línea media 50" />
                <i className={s.bandLow} title="Aplanado 40" />
                <i className={s.bandHigh} title="Aplanado 60" />
              </div>
              <span className={s.key}>{f}</span>
              <span className={s.val}>{Math.round(v)}</span>
              {crudos && <span className={s.raw}>{crudos[f] >= 0 && unidad === "" ? "+" : ""}{crudos[f]}</span>}
              <span className={s.name}>{NOMBRES_FACTOR[f]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CleaverGraficas({ cal }: { cal: ResultadoCleaver }) {
  return (
    <div className={s.wrap}>
      <header className={s.head}>
        <p>
          Protocolo {cal.completo ? "completo" : `incompleto (${cal.respondidas}/24)`} · ΣT ={" "}
          {cal.validez} ({cal.validezEtiqueta})
          {cal.estiloClasico
            ? ` · Estilo #${cal.estiloClasico.id} ${cal.estiloClasico.nombre}`
            : ""}
        </p>
        <p className={s.meta}>
          Aplanados (40–60): M={cal.aplanado.M ? "sí" : "no"} · L={cal.aplanado.L ? "sí" : "no"} · T=
          {cal.aplanado.T ? "sí" : "no"} · escala gráfica 0–100 (baremo)
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
        <Barras titulo="Gráfica M — motivado" datos={cal.grafica.M} crudos={cal.M} unidad="" />
        <Barras titulo="Gráfica L — bajo presión" datos={cal.grafica.L} crudos={cal.L} unidad="" />
        <Barras titulo="Gráfica T — cotidiano" datos={cal.grafica.T} crudos={cal.T} unidad="" />
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
                {label === "T" ? cal.validez : FACTORES_CLEAVER.reduce((a, f) => a + row[f], 0)}
              </td>
            </tr>
          ))}
          <tr>
            <th>T gráf.</th>
            {FACTORES_CLEAVER.map((f) => (
              <td key={f}>{Math.round(cal.grafica.T[f])}</td>
            ))}
            <td>—</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
