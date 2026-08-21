"use client";

import { useState } from "react";
import {
  etiquetaNivel,
  nivel,
  type ResultadoHartman,
  type ResultadoParte,
} from "@/lib/hartman";
import { ChartTabs, ChartLegend } from "@/components/admin/ChartTabs";
import cs from "@/components/admin/admin-charts.module.css";
import s from "./HartmanGraficas.module.css";

const TABS = [
  { id: "ejes", label: "Ejes I/E/S", hint: "DIM e INT por eje axiológico" },
  { id: "radar", label: "Radar", hint: "Perfil de los tres ejes en V.Q. y S.Q." },
  { id: "items", label: "Ítems", hint: "Norma vs respuesta por reactivo" },
  { id: "indices", label: "Índices", hint: "Q₁, Q₂ y compuestos interpretables" },
];

const EJES = ["I", "E", "S"] as const;

function EjesChart({ parte, titulo }: { parte: ResultadoParte; titulo: string }) {
  return (
    <div className={cs.chartBlock}>
      <h3>{titulo}</h3>
      <ChartLegend
        items={[
          { color: "#4a7fb8", label: "DIM (balance)" },
          { color: "#c45c4a", label: "INT" },
        ]}
      />
      <div className={s.ejeGrid}>
        {EJES.map((e) => (
          <div key={e} className={s.ejeCol}>
            <span className={s.ejeKey}>{e}</span>
            <div className={s.ejeBars}>
              <div
                className={s.ejeDim}
                style={{
                  height: `${Math.min(100, (Math.abs(parte.ejes[e].balance) / 42) * 100)}%`,
                }}
                title={`DIM balance: ${parte.ejes[e].balance}`}
              />
              <div
                className={s.ejeInt}
                style={{
                  height: `${Math.min(100, (Math.abs(parte.ejes[e].INT) / 33) * 100)}%`,
                }}
                title={`INT: ${parte.ejes[e].INT}`}
              />
            </div>
            <small>DIM {parte.ejes[e].balance}</small>
            <small>INT {parte.ejes[e].INT}</small>
          </div>
        ))}
      </div>
      <p className={s.meta}>
        DIS {parte.DIS} · DIF {parte.DIF} · Q₁ {parte.Q1} · Q₂ {parte.Q2}
      </p>
    </div>
  );
}

function RadarParte({ parte, titulo }: { parte: ResultadoParte; titulo: string }) {
  const cx = 140;
  const cy = 130;
  const r = 85;
  const vals = EJES.map((e) => Math.abs(parte.ejes[e].balance));
  const max = Math.max(...vals, 1);

  const pt = (i: number, v: number) => {
    const angle = (Math.PI * 2 * i) / 3 - Math.PI / 2;
    const rad = (v / max) * r;
    return { x: cx + Math.cos(angle) * rad, y: cy + Math.sin(angle) * rad };
  };

  const poly = vals.map((v, i) => `${pt(i, v).x},${pt(i, v).y}`).join(" ");

  return (
    <div className={cs.chartBlock}>
      <h3>{titulo}</h3>
      <svg viewBox="0 0 280 260" className={cs.svgChart} role="img">
        {[0.33, 0.66, 1].map((t) => (
          <circle key={t} cx={cx} cy={cy} r={r * t} className={s.ring} />
        ))}
        {EJES.map((e, i) => {
          const outer = pt(i, max);
          return (
            <g key={e}>
              <line x1={cx} y1={cy} x2={outer.x} y2={outer.y} className={s.spoke} />
              <text x={outer.x} y={outer.y} textAnchor="middle" className={s.label}>
                {e}
              </text>
            </g>
          );
        })}
        <polygon points={poly} className={s.poly} />
      </svg>
    </div>
  );
}

function ItemsChart({ parte, titulo }: { parte: ResultadoParte; titulo: string }) {
  return (
    <div className={cs.chartBlock}>
      <h3>{titulo}</h3>
      <div className={s.itemChart}>
        {parte.items.map((it) => {
          const max = 18;
          return (
            <div key={it.id} className={s.itemRow} title={`Norma ${it.norma} · Resp. ${it.respuesta}`}>
              <span className={s.itemId}>{it.id}</span>
              <div className={s.itemTrack}>
                <div
                  className={s.itemNorma}
                  style={{ width: `${(it.norma / max) * 100}%` }}
                />
                <div
                  className={s.itemResp}
                  style={{ width: `${(it.respuesta / max) * 100}%` }}
                />
              </div>
              <span className={it.disimilitud ? s.dis : s.ok}>
                {it.disimilitud ? "DIS" : "—"}
              </span>
            </div>
          );
        })}
      </div>
      <ChartLegend
        items={[
          { color: "#4a7fb8", label: "Norma" },
          { color: "#c45c4a", label: "Respuesta" },
        ]}
      />
    </div>
  );
}

function IndicesChart({ cal }: { cal: ResultadoHartman }) {
  const filas = [
    { parte: "V.Q.", q1: cal.VQ.Q1, q2: cal.VQ.Q2, dis: cal.VQ.DIS },
    { parte: "S.Q.", q1: cal.SQ.Q1, q2: cal.SQ.Q2, dis: cal.SQ.DIS },
  ];

  return (
    <div className={cs.chartGrid}>
      <div className={cs.chartBlock}>
        <h3>Componentes Q₁ y Q₂</h3>
        {!cal.interpretable && (
          <p className={s.alert}>Protocolo no interpretable — índices con reserva.</p>
        )}
        <table className={s.table}>
          <thead>
            <tr>
              <th>Parte</th>
              <th>Q₁</th>
              <th>Nivel</th>
              <th>Q₂</th>
              <th>Nivel</th>
              <th>DIS</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.parte}>
                <td>{f.parte}</td>
                <td>{f.q1}</td>
                <td>{cal.interpretable ? etiquetaNivel(nivel("Q1", f.q1)) : "—"}</td>
                <td>{f.q2}</td>
                <td>{cal.interpretable ? etiquetaNivel(nivel("Q2", f.q2)) : "—"}</td>
                <td>{f.dis}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {cal.compuestos.length > 0 && (
        <div className={cs.chartBlock}>
          <h3>Índices compuestos</h3>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Comp.</th>
                <th>BQr</th>
                <th>BQa</th>
                <th>CQ</th>
              </tr>
            </thead>
            <tbody>
              {cal.compuestos.map((c) => (
                <tr key={c.componente}>
                  <td>{c.componente}</td>
                  <td>{c.BQr.toFixed(2)}</td>
                  <td>{c.BQa.toFixed(1)}</td>
                  <td>{c.CQ.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function HartmanGraficas({ cal }: { cal: ResultadoHartman }) {
  const [vista, setVista] = useState("ejes");

  return (
    <section className={s.section}>
      <ChartTabs tabs={TABS} active={vista} onChange={setVista} title="Gráficas de interpretación" />

      {vista === "ejes" && (
        <div className={`${cs.chartGrid} ${cs.chartGrid2}`}>
          <EjesChart parte={cal.VQ} titulo="Parte I — V.Q." />
          <EjesChart parte={cal.SQ} titulo="Parte II — S.Q." />
        </div>
      )}
      {vista === "radar" && (
        <div className={`${cs.chartGrid} ${cs.chartGrid2}`}>
          <RadarParte parte={cal.VQ} titulo="Radar V.Q." />
          <RadarParte parte={cal.SQ} titulo="Radar S.Q." />
        </div>
      )}
      {vista === "items" && (
        <div className={`${cs.chartGrid} ${cs.chartGrid2}`}>
          <ItemsChart parte={cal.VQ} titulo="Ítems V.Q." />
          <ItemsChart parte={cal.SQ} titulo="Ítems S.Q." />
        </div>
      )}
      {vista === "indices" && <IndicesChart cal={cal} />}
    </section>
  );
}
