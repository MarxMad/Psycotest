"use client";

import {
  SUMA_ESPERADA,
  etiquetaNivel,
  nivel,
  type ResultadoHartman,
  type ResultadoParte,
} from "@/lib/hartman";
import { AXIOGRAMAS, type Axiograma } from "@/data/hartman-axiogramas";
import s from "./hartman.module.css";

function Parte({
  titulo,
  p,
  axiograma,
  interpretable,
}: {
  titulo: string;
  p: ResultadoParte;
  axiograma: Axiograma;
  interpretable: boolean;
}) {
  const ax = AXIOGRAMAS[axiograma];
  const texto = (clave: string) => ax.indicadores.find((i) => i.clave === clave)?.texto ?? "";

  const filas: { clave: string; sigla: string; valor: number; columna: string }[] = [
    { clave: "DIM_I", sigla: "DIM I", valor: p.ejes.I.balance, columna: "DIM" },
    { clave: "DIM_E", sigla: "DIM E", valor: p.ejes.E.balance, columna: "DIM" },
    { clave: "DIM_S", sigla: "DIM S", valor: p.ejes.S.balance, columna: "DIM" },
    { clave: "DIM", sigla: "DIM", valor: p.DIM, columna: "DIM" },
    { clave: "DIM_PCT", sigla: "DIM %", valor: p.DIMpct, columna: "DIM_PCT" },
    { clave: "INT_I", sigla: "INT I", valor: p.ejes.I.INT, columna: "INT_EJE" },
    { clave: "INT_E", sigla: "INT E", valor: p.ejes.E.INT, columna: "INT_EJE" },
    { clave: "INT_S", sigla: "INT S", valor: p.ejes.S.INT, columna: "INT_EJE" },
    { clave: "INT", sigla: "INT", valor: p.INT, columna: "INT" },
    { clave: "INT_PCT", sigla: "INT %", valor: p.INTpct, columna: "INT_PCT" },
    { clave: "DIS", sigla: "DIS", valor: p.DIS, columna: "DI" },
  ];

  return (
    <section className={s.adminParte}>
      <h2 className={s.sectionTitle}>{titulo}</h2>

      {p.alertas.map((a) => (
        <p key={a} className={s.alert}>
          {a}
        </p>
      ))}

      <div className={s.metrics}>
        <div className={s.metric}>
          <span className={s.k}>Σ rankings</span>
          <span className={s.v}>{p.DIF}</span>
          <span className={s.lvl}>{p.DIF === SUMA_ESPERADA ? "correcto" : "revisar"}</span>
        </div>
        <div className={s.metric}>
          <span className={s.k}>DIS</span>
          <span className={s.v}>{p.DIS}</span>
          <span className={s.lvl}>{p.DIS % 2 === 0 ? "par" : "impar"}</span>
        </div>
        {interpretable && (
          <>
            <div className={s.metric}>
              <span className={s.k}>Cantidad (Q₁)</span>
              <span className={s.v}>{p.Q1}</span>
              <span className={s.lvl}>{etiquetaNivel(nivel("Q1", p.Q1))}</span>
            </div>
            <div className={s.metric}>
              <span className={s.k}>Calidad (Q₂)</span>
              <span className={s.v}>{p.Q2}</span>
              <span className={s.lvl}>{etiquetaNivel(nivel("Q2", p.Q2))}</span>
            </div>
          </>
        )}
      </div>

      {interpretable && (
        <div className={s.tableShell}>
          <table>
            <thead>
              <tr>
                <th>Indicador</th>
                <th className={s.n}>Valor</th>
                <th>Nivel</th>
                <th>Qué mide</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.clave}>
                  <td className="mono">
                    <strong>{f.sigla}</strong>
                  </td>
                  <td className={s.n}>
                    {Number.isInteger(f.valor) ? f.valor : f.valor.toFixed(1)}
                  </td>
                  <td className={s.lvl}>
                    {etiquetaNivel(nivel(f.columna as never, f.valor))}
                  </td>
                  <td style={{ fontSize: 13, color: "var(--muted)" }}>{texto(f.clave)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function HartmanCalificacion({ cal }: { cal: ResultadoHartman }) {
  return (
    <div className={s.adminCalif}>
      <p className={s.validityBanner}>
        Interpretable: <strong>{cal.interpretable ? "Sí" : "No"}</strong>
        {!cal.interpretable && cal.motivo && <> — {cal.motivo}</>}
      </p>
      <Parte titulo="Parte I — V.Q. (Valores en cantidad)" p={cal.VQ} axiograma="externo" interpretable={cal.interpretable} />
      <Parte titulo="Parte II — S.Q. (Valores en calidad)" p={cal.SQ} axiograma="propio" interpretable={cal.interpretable} />
    </div>
  );
}
