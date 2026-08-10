"use client";

import s from "./MabeGraficas.module.css";
import {
  CUADRANTES,
  NOMBRES_CUADRANTE,
  NOMBRES_VALOR,
  VALORES,
  type CurvaCuadrante,
  type CurvaValor,
} from "@/lib/mabe";

interface Props {
  titulo: string;
  puesto: { label: string; values: number[] }[];
  persona: { label: string; values: number[] }[];
  min?: number;
  max?: number;
}

function GraficaDual({
  titulo,
  labels,
  puesto,
  persona,
  nombres,
}: {
  titulo: string;
  labels: string[];
  puesto: number[];
  persona: number[];
  nombres: Record<string, string>;
}) {
  const todos = [...puesto, ...persona];
  const min = Math.min(...todos, 0) - 10;
  const max = Math.max(...todos, 80) + 10;
  const rango = max - min || 1;

  return (
    <div className={s.chartBlock}>
      <h3>{titulo}</h3>
      <div className={s.legend}>
        <span><i className={s.dotPuesto} /> Puesto</span>
        <span><i className={s.dotPersona} /> Persona</span>
      </div>
      <div className={s.chart}>
        {labels.map((k, i) => (
          <div key={k} className={s.col}>
            <div className={s.track}>
              <div
                className={s.barPuesto}
                style={{ height: `${((puesto[i] - min) / rango) * 100}%` }}
                title={`Puesto: ${puesto[i]}`}
              />
              <div
                className={s.barPersona}
                style={{ height: `${((persona[i] - min) / rango) * 100}%` }}
                title={`Persona: ${persona[i]}`}
              />
            </div>
            <span className={s.key}>{k}</span>
            <span className={s.name}>{nombres[k]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MabeGraficas({
  procPuesto,
  procPersona,
  valPuesto,
  valPersona,
}: {
  procPuesto: CurvaCuadrante[];
  procPersona: CurvaCuadrante[];
  valPuesto: CurvaValor[];
  valPersona: CurvaValor[];
}) {
  return (
    <div className={s.wrap}>
      <GraficaDual
        titulo="Proceso pensante preferido"
        labels={[...CUADRANTES]}
        puesto={procPuesto.map((c) => c.grafica)}
        persona={procPersona.map((c) => c.grafica)}
        nombres={NOMBRES_CUADRANTE}
      />
      <GraficaDual
        titulo="Sistema de valores (Spranger)"
        labels={[...VALORES]}
        puesto={valPuesto.map((c) => c.grafica)}
        persona={valPersona.map((c) => c.grafica)}
        nombres={NOMBRES_VALOR}
      />
    </div>
  );
}
