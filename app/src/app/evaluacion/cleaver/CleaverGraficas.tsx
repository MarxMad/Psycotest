"use client";

import {
  FACTORES_CLEAVER,
  NOMBRES_FACTOR,
  type ConteosFactor,
  type ResultadoCleaver,
} from "@/lib/cleaver";
import { brechaPersonaPuesto, type ResultadoCleaverJob } from "@/lib/cleaver-job";
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
              {crudos && (
                <span className={s.raw}>
                  {crudos[f] >= 0 && unidad === "" ? "+" : ""}
                  {crudos[f]}
                </span>
              )}
              <span className={s.name}>{NOMBRES_FACTOR[f]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BarrasBrecha({ titulo, datos }: { titulo: string; datos: ConteosFactor }) {
  return (
    <div className={s.block}>
      <h3>{titulo}</h3>
      <div className={s.chart}>
        {FACTORES_CLEAVER.map((f) => {
          const v = datos[f];
          const abs = Math.min(50, Math.abs(v));
          const pos = v >= 0;
          return (
            <div key={f} className={s.col}>
              <div className={`${s.track} ${s.trackGap}`}>
                <div
                  className={pos ? s.barPos : s.barNeg}
                  style={{
                    height: `${Math.max(4, abs)}%`,
                    [pos ? "bottom" : "top"]: "50%",
                  }}
                  title={`${f}: ${v > 0 ? "+" : ""}${Math.round(v)}`}
                />
                <i className={s.mid} />
              </div>
              <span className={s.key}>{f}</span>
              <span className={v >= 0 ? s.valPos : s.valNeg}>
                {v > 0 ? "+" : ""}
                {Math.round(v)}
              </span>
              <span className={s.name}>{NOMBRES_FACTOR[f]}</span>
            </div>
          );
        })}
      </div>
      <p className={s.meta}>
        Positivo = persona por encima del puesto · Negativo = persona por debajo del Factor Humano
      </p>
    </div>
  );
}

export function CleaverGraficas({
  cal,
  puesto,
  puestoTitulo,
}: {
  cal: ResultadoCleaver;
  puesto?: ResultadoCleaverJob | null;
  puestoTitulo?: string;
}) {
  const brecha =
    puesto?.completo && cal.completo
      ? brechaPersonaPuesto(cal.grafica.T, puesto.grafica)
      : null;

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

      {puesto?.completo && (
        <section className={s.jobSection}>
          <h2 className={s.jobTitle}>
            Factor Humano del puesto
            {puestoTitulo ? ` — ${puestoTitulo}` : ""}
          </h2>
          <p className={s.meta}>
            A={puesto.A} · X(A)={puesto.multiplicador} · aplanado={puesto.aplanado ? "sí" : "no"} ·
            gráfica = 50 + D%
          </p>
          <div className={s.grid2}>
            <Barras titulo="Perfil requerido (puesto)" datos={puesto.grafica} crudos={puesto.R} unidad="" />
            {brecha && (
              <BarrasBrecha titulo="Brecha persona (T) − puesto" datos={brecha} />
            )}
          </div>
          <table className={s.table}>
            <thead>
              <tr>
                <th />
                {FACTORES_CLEAVER.map((f) => (
                  <th key={f}>{f}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>R</th>
                {FACTORES_CLEAVER.map((f) => (
                  <td key={f}>{puesto.R[f]}</td>
                ))}
              </tr>
              <tr>
                <th>D%</th>
                {FACTORES_CLEAVER.map((f) => (
                  <td key={f}>{Math.round(puesto.Dpct[f])}</td>
                ))}
              </tr>
              <tr>
                <th>Puesto</th>
                {FACTORES_CLEAVER.map((f) => (
                  <td key={f}>{Math.round(puesto.grafica[f])}</td>
                ))}
              </tr>
              {brecha && (
                <tr>
                  <th>Brecha</th>
                  {FACTORES_CLEAVER.map((f) => (
                    <td key={f}>
                      {brecha[f] > 0 ? "+" : ""}
                      {Math.round(brecha[f])}
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}

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
