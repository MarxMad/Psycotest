"use client";

import type { ResultadoMabe } from "@/lib/mabe";
import { CUADRANTES, NOMBRES_CUADRANTE, NOMBRES_VALOR, VALORES } from "@/lib/mabe";
import s from "./MabeCalificacion.module.css";

function fmt(n: number, dec = 1) {
  return Number.isInteger(n) ? String(n) : n.toFixed(dec);
}

interface Props {
  resultado: ResultadoMabe;
}

export function MabeCalificacion({ resultado: r }: Props) {
  const { procPuesto, procPersona, valPuesto, valPersona, combinaciones } = r;

  return (
    <div className={s.wrap}>
      <p className={s.nota}>
        Cálculo según manual <strong>MABE_2007</strong> y hoja Excel verificada. Las gráficas usan{" "}
        <span className={s.azul}>TN / T</span> (puesto, azul) y{" "}
        <span className={s.rojo}>esc / N×5</span> (persona, rojo).
      </p>

      <section className={s.block}>
        <h3>1. Proceso pensante del puesto</h3>
        <p className={s.formula}>T → TR → A → D → X → TN (+70)</p>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Cuadrante</th>
              <th>T</th>
              <th>D</th>
              <th>X</th>
              <th>TN</th>
            </tr>
          </thead>
          <tbody>
            {procPuesto.cuadrantes.map((c) => (
              <tr key={c.cuadrante}>
                <td>
                  <strong>{c.cuadrante}</strong> — {NOMBRES_CUADRANTE[c.cuadrante]}
                </td>
                <td>{c.bruto}</td>
                <td>{fmt(c.desviacion)}</td>
                <td>{fmt(c.escalado)}</td>
                <td className={s.azul}>{fmt(c.grafica)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>TR / A</td>
              <td colSpan={2}>
                TR = {procPuesto.total}
              </td>
              <td colSpan={2}>A = {fmt(procPuesto.promedio, 2)}</td>
            </tr>
          </tfoot>
        </table>
        <p className={s.combo}>
          Combinaciones: L (A+L) = {combinaciones.L} · R (I+V) = {combinaciones.R} · C (A+V) ={" "}
          {combinaciones.C} · S (L+I) = {combinaciones.S}
        </p>
      </section>

      <section className={s.block}>
        <h3>2. Proceso pensante personal</h3>
        <p className={s.formula}>S (I×2 + II×3 + III×5) / 10 → N → esc = N×5</p>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Cuadrante</th>
              <th>S</th>
              <th>N</th>
              <th>esc</th>
            </tr>
          </thead>
          <tbody>
            {procPersona.cuadrantes.map((c) => (
              <tr key={c.cuadrante}>
                <td>
                  <strong>{c.cuadrante}</strong> — {NOMBRES_CUADRANTE[c.cuadrante]}
                </td>
                <td>{fmt(c.bruto, 2)}</td>
                <td>{fmt(c.desviacion, 2)}</td>
                <td className={s.rojo}>{fmt(c.grafica, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className={s.block}>
        <h3>3. Valores del puesto</h3>
        <p className={s.formula}>TR → TS → A → D → X → TN (+50)</p>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Valor</th>
              <th>TR</th>
              <th>D</th>
              <th>X</th>
              <th>TN</th>
            </tr>
          </thead>
          <tbody>
            {valPuesto.valores.map((v) => (
              <tr key={v.valor}>
                <td>
                  <strong>{v.valor}</strong> — {NOMBRES_VALOR[v.valor]}
                </td>
                <td>{v.bruto}</td>
                <td>{fmt(v.desviacion, 1)}</td>
                <td>{fmt(v.escalado, 1)}</td>
                <td className={s.azul}>{fmt(v.grafica, 1)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>TS / A</td>
              <td colSpan={2}>TS = {valPuesto.total}</td>
              <td colSpan={2}>A = {fmt(valPuesto.promedio, 2)}</td>
            </tr>
          </tfoot>
        </table>
      </section>

      <section className={s.block}>
        <h3>4. Valores personales</h3>
        <p className={s.formula}>R → A → D → D% → T (+50)</p>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Valor</th>
              <th>R</th>
              <th>D</th>
              <th>D%</th>
              <th>T</th>
            </tr>
          </thead>
          <tbody>
            {valPersona.valores.map((v) => (
              <tr key={v.valor}>
                <td>
                  <strong>{v.valor}</strong> — {NOMBRES_VALOR[v.valor]}
                </td>
                <td>{v.bruto}</td>
                <td>{fmt(v.desviacion, 1)}</td>
                <td>{fmt(v.escalado, 1)}</td>
                <td className={s.rojo}>{fmt(v.grafica, 1)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>Total / A</td>
              <td colSpan={2}>ΣR = {valPersona.total}</td>
              <td colSpan={2}>A = {fmt(valPersona.promedio, 2)}</td>
            </tr>
          </tfoot>
        </table>
      </section>

      <section className={s.block}>
        <h3>Brecha persona − puesto (para interpretación)</h3>
        <div className={s.brechaGrid}>
          <div>
            <h4>Proceso pensante</h4>
            <ul>
              {CUADRANTES.map((q) => (
                <li key={q}>
                  <span>{q}</span> {r.brechas.proceso[q] > 0 ? "+" : ""}
                  {fmt(r.brechas.proceso[q], 1)}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Valores</h4>
            <ul>
              {VALORES.map((v) => (
                <li key={v}>
                  <span>{v}</span> {r.brechas.valores[v] > 0 ? "+" : ""}
                  {fmt(r.brechas.valores[v], 1)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
