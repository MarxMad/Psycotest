"use client";

import { useState } from "react";
import s from "./MabeGraficas.module.css";
import {
  CUADRANTES,
  NOMBRES_CUADRANTE,
  NOMBRES_VALOR,
  VALORES,
  type Cuadrante,
  type CurvaCuadrante,
  type CurvaValor,
  type ResultadoMabe,
  type Valor,
} from "@/lib/mabe";

type Vista = "curvas" | "barras" | "radar" | "brecha" | "cerebro";

const VISTAS: { id: Vista; label: string; hint: string }[] = [
  { id: "curvas", label: "Curvas", hint: "Superposición clásica persona vs puesto" },
  { id: "barras", label: "Barras", hint: "Comparación lado a lado por dimensión" },
  { id: "radar", label: "Radar", hint: "Perfil global en una sola figura" },
  { id: "brecha", label: "Brecha", hint: "Ajuste persona − puesto (interpretación)" },
  { id: "cerebro", label: "Cerebro", hint: "Mapa de cuadrantes y combinaciones" },
];

function Leyenda() {
  return (
    <div className={s.legend}>
      <span>
        <i className={s.dotPuesto} /> Puesto
      </span>
      <span>
        <i className={s.dotPersona} /> Persona
      </span>
    </div>
  );
}

function rango(values: number[]) {
  const min = Math.min(...values, 0) - 10;
  const max = Math.max(...values, 80) + 10;
  return { min, max, span: max - min || 1 };
}

function fmt(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function GraficaBarras({
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
  const { min, span } = rango([...puesto, ...persona]);

  return (
    <div className={s.chartBlock}>
      <h3>{titulo}</h3>
      <Leyenda />
      <div className={s.chart}>
        {labels.map((k, i) => (
          <div key={k} className={s.col}>
            <div className={s.track}>
              <div
                className={s.barPuesto}
                style={{ height: `${((puesto[i] - min) / span) * 100}%` }}
                title={`Puesto: ${puesto[i]}`}
              />
              <div
                className={s.barPersona}
                style={{ height: `${((persona[i] - min) / span) * 100}%` }}
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

function GraficaCurvas({
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
  const { min, span } = rango([...puesto, ...persona]);
  const w = 360;
  const h = 200;
  const padX = 36;
  const padY = 24;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;

  const toX = (i: number) => padX + (i / Math.max(labels.length - 1, 1)) * innerW;
  const toY = (v: number) => padY + innerH - ((v - min) / span) * innerH;

  const line = (vals: number[]) =>
    vals.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");

  return (
    <div className={s.chartBlock}>
      <h3>{titulo}</h3>
      <Leyenda />
      <svg viewBox={`0 0 ${w} ${h + 28}`} className={s.svgChart} role="img" aria-label={titulo}>
        {[0.25, 0.5, 0.75].map((t) => {
          const y = padY + innerH * (1 - t);
          return (
            <line
              key={t}
              x1={padX}
              y1={y}
              x2={w - padX}
              y2={y}
              className={s.gridLine}
            />
          );
        })}
        <polyline points={line(puesto)} className={s.linePuesto} />
        <polyline points={line(persona)} className={s.linePersona} />
        {labels.map((k, i) => (
          <g key={k}>
            <circle cx={toX(i)} cy={toY(puesto[i])} r={4} className={s.dotPuestoSvg} />
            <circle cx={toX(i)} cy={toY(persona[i])} r={4} className={s.dotPersonaSvg} />
            <text x={toX(i)} y={h + 16} textAnchor="middle" className={s.axisLabel}>
              {k}
            </text>
            <title>
              {nombres[k]} — Puesto {puesto[i]} · Persona {persona[i]}
            </title>
          </g>
        ))}
      </svg>
    </div>
  );
}

function GraficaRadar({
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
  const { min, span } = rango([...puesto, ...persona]);
  const cx = 160;
  const cy = 150;
  const radius = 95;
  const n = labels.length;

  const point = (i: number, v: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const r = ((v - min) / span) * radius;
    return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
  };

  const polygon = (vals: number[]) =>
    vals
      .map((v, i) => {
        const p = point(i, v);
        return `${p.x},${p.y}`;
      })
      .join(" ");

  return (
    <div className={s.chartBlock}>
      <h3>{titulo}</h3>
      <Leyenda />
      <svg viewBox="0 0 320 320" className={s.svgChart} role="img" aria-label={titulo}>
        {[0.33, 0.66, 1].map((t) => (
          <circle
            key={t}
            cx={cx}
            cy={cy}
            r={radius * t}
            className={s.radarRing}
          />
        ))}
        {labels.map((k, i) => {
          const outer = point(i, maxFrom(min, span));
          return (
            <line
              key={k}
              x1={cx}
              y1={cy}
              x2={outer.x}
              y2={outer.y}
              className={s.radarSpoke}
            />
          );
        })}
        <polygon points={polygon(puesto)} className={s.radarPuesto} />
        <polygon points={polygon(persona)} className={s.radarPersona} />
        {labels.map((k, i) => {
          const labelPt = point(i, maxFrom(min, span) + 14);
          return (
            <text
              key={k}
              x={labelPt.x}
              y={labelPt.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className={s.radarLabel}
            >
              {k}
              <title>{nombres[k]}</title>
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function maxFrom(min: number, span: number) {
  return min + span * 0.92;
}

function GraficaBrecha({
  titulo,
  labels,
  brechas,
  nombres,
}: {
  titulo: string;
  labels: string[];
  brechas: number[];
  nombres: Record<string, string>;
}) {
  const maxAbs = Math.max(...brechas.map(Math.abs), 8);

  return (
    <div className={s.chartBlock}>
      <h3>{titulo}</h3>
      <p className={s.brechaHint}>
        Positivo = persona por encima del puesto · Negativo = persona por debajo
      </p>
      <div className={s.brechaList}>
        {labels.map((k, i) => {
          const b = brechas[i];
          const pct = (Math.abs(b) / maxAbs) * 50;
          const pos = b >= 0;
          return (
            <div key={k} className={s.brechaRow}>
              <span className={s.brechaKey} title={nombres[k]}>
                {k}
              </span>
              <div className={s.brechaTrack}>
                <div className={s.brechaCenter} />
                <div
                  className={pos ? s.brechaPos : s.brechaNeg}
                  style={{
                    width: `${pct}%`,
                    ...(pos ? { left: "50%" } : { right: "50%" }),
                  }}
                  title={`${nombres[k]}: ${b > 0 ? "+" : ""}${fmt(b)}`}
                />
              </div>
              <span className={b >= 0 ? s.brechaValPos : s.brechaValNeg}>
                {b > 0 ? "+" : ""}
                {fmt(b)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MapaCerebro({
  procPuesto,
  procPersona,
  combinaciones,
}: {
  procPuesto: CurvaCuadrante[];
  procPersona: CurvaCuadrante[];
  combinaciones: ResultadoMabe["combinaciones"];
}) {
  const puestoMap = Object.fromEntries(procPuesto.map((c) => [c.cuadrante, c.grafica])) as Record<
    Cuadrante,
    number
  >;
  const personaMap = Object.fromEntries(procPersona.map((c) => [c.cuadrante, c.grafica])) as Record<
    Cuadrante,
    number
  >;
  const all = [...procPuesto, ...procPersona].map((c) => c.grafica);
  const { min, span } = rango(all);

  const cells: { q: Cuadrante; row: number; col: number }[] = [
    { q: "A", row: 0, col: 0 },
    { q: "V", row: 0, col: 1 },
    { q: "L", row: 1, col: 0 },
    { q: "I", row: 1, col: 1 },
  ];

  const intensidad = (v: number) => Math.min(100, Math.max(8, ((v - min) / span) * 100));

  return (
    <div className={s.chartBlockWide}>
      <h3>Mapa cerebral — proceso pensante</h3>
      <Leyenda />
      <div className={s.brainGrid}>
        {cells.map(({ q, row, col }) => (
          <div
            key={q}
            className={s.brainCell}
            style={{ gridRow: row + 1, gridColumn: col + 1 }}
          >
            <strong>{q}</strong>
            <span>{NOMBRES_CUADRANTE[q]}</span>
            <div className={s.brainBars}>
              <div
                className={s.brainPuesto}
                style={{ width: `${intensidad(puestoMap[q])}%` }}
                title={`Puesto: ${puestoMap[q]}`}
              />
              <div
                className={s.brainPersona}
                style={{ width: `${intensidad(personaMap[q])}%` }}
                title={`Persona: ${personaMap[q]}`}
              />
            </div>
            <span className={s.brainGap}>
              Δ {fmt(personaMap[q] - puestoMap[q])}
            </span>
          </div>
        ))}
      </div>
      <div className={s.comboGrid}>
        <h4>Combinaciones de cuadrantes (puesto)</h4>
        <div className={s.comboCards}>
          {(
            [
              ["L", "Izquierdo (A+L)", combinaciones.L],
              ["R", "Derecho (I+V)", combinaciones.R],
              ["C", "Cortical (A+V)", combinaciones.C],
              ["S", "Límbico (L+I)", combinaciones.S],
            ] as const
          ).map(([key, label, val]) => (
            <div key={key} className={s.comboCard}>
              <span className={s.comboKey}>{key}</span>
              <span className={s.comboLabel}>{label}</span>
              <strong>{val}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MabeGraficas({
  procPuesto,
  procPersona,
  valPuesto,
  valPersona,
  brechas,
  combinaciones,
}: {
  procPuesto: CurvaCuadrante[];
  procPersona: CurvaCuadrante[];
  valPuesto: CurvaValor[];
  valPersona: CurvaValor[];
  brechas: ResultadoMabe["brechas"];
  combinaciones: ResultadoMabe["combinaciones"];
}) {
  const [vista, setVista] = useState<Vista>("curvas");

  const procP = procPuesto.map((c) => c.grafica);
  const procPer = procPersona.map((c) => c.grafica);
  const valP = valPuesto.map((c) => c.grafica);
  const valPer = valPersona.map((c) => c.grafica);
  const brechaProc = CUADRANTES.map((q) => brechas.proceso[q]);
  const brechaVal = VALORES.map((v) => brechas.valores[v as Valor]);

  const vistaActual = VISTAS.find((v) => v.id === vista)!;

  const renderPar = (
    titulo: string,
    labels: string[],
    puesto: number[],
    persona: number[],
    brechaVals: number[],
    nombres: Record<string, string>,
  ) => {
    switch (vista) {
      case "barras":
        return (
          <GraficaBarras
            titulo={titulo}
            labels={labels}
            puesto={puesto}
            persona={persona}
            nombres={nombres}
          />
        );
      case "radar":
        return (
          <GraficaRadar
            titulo={titulo}
            labels={labels}
            puesto={puesto}
            persona={persona}
            nombres={nombres}
          />
        );
      case "brecha":
        return (
          <GraficaBrecha
            titulo={`Brecha — ${titulo}`}
            labels={labels}
            brechas={brechaVals}
            nombres={nombres}
          />
        );
      default:
        return (
          <GraficaCurvas
            titulo={titulo}
            labels={labels}
            puesto={puesto}
            persona={persona}
            nombres={nombres}
          />
        );
    }
  };

  return (
    <section className={s.section}>
      <div className={s.toolbar}>
        <div>
          <h2 className={s.sectionTitle}>Gráficas de interpretación</h2>
          <p className={s.sectionHint}>{vistaActual.hint}</p>
        </div>
        <div className={s.tabs} role="tablist" aria-label="Tipo de gráfica MABE">
          {VISTAS.map((v) => (
            <button
              key={v.id}
              type="button"
              role="tab"
              aria-selected={vista === v.id}
              className={vista === v.id ? s.tabActive : s.tab}
              onClick={() => setVista(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {vista === "cerebro" ? (
        <MapaCerebro
          procPuesto={procPuesto}
          procPersona={procPersona}
          combinaciones={combinaciones}
        />
      ) : (
        <div className={s.wrap}>
          {renderPar(
            "Proceso pensante preferido",
            [...CUADRANTES],
            procP,
            procPer,
            brechaProc,
            NOMBRES_CUADRANTE,
          )}
          {renderPar(
            "Sistema de valores (Spranger)",
            [...VALORES],
            valP,
            valPer,
            brechaVal,
            NOMBRES_VALOR,
          )}
        </div>
      )}
    </section>
  );
}
