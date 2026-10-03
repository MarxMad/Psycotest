"use client";

import { useState } from "react";
import { PerfilPapi } from "./PerfilPapi";
import {
  DIADAS,
  GRUPOS,
  NOMBRES,
  ORDEN_PERFIL,
  banda,
  type Factor,
  type ResultadoPapi,
} from "@/lib/papi";
import { ChartTabs, ChartLegend } from "@/components/admin/ChartTabs";
import cs from "@/components/admin/admin-charts.module.css";
import s from "./PapiGraficas.module.css";
import papiStyles from "./papi.module.css";

const TABS = [
  { id: "perfil", label: "Perfil radial", hint: "Hoja de perfil clásica del PAPI" },
  { id: "barras", label: "Barras", hint: "Los 20 factores en escala 0–9" },
  { id: "dimensiones", label: "Dimensiones", hint: "Siete bloques interpretativos del manual" },
  { id: "diadas", label: "Díadas", hint: "Rol vs necesidad — núcleo clínico" },
  { id: "bandas", label: "Bandas", hint: "Bajo · medio · alto por factor" },
];

function BarrasFactores({ puntajes }: { puntajes: Record<Factor, number> }) {
  return (
    <div className={cs.chartBlock}>
      <h3>Perfil por factor (0–9)</h3>
      <div className={s.barList}>
        {ORDEN_PERFIL.map((f) => (
          <div key={f} className={s.barRow}>
            <span className={s.factorKey}>{f}</span>
            <div className={s.barTrack}>
              <div className={s.barFill} style={{ width: `${(puntajes[f] / 9) * 100}%` }} />
            </div>
            <span className={s.barVal}>{puntajes[f]}</span>
            <span className={s.barName}>{NOMBRES[f]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Dimensiones({ puntajes }: { puntajes: Record<Factor, number> }) {
  return (
    <div className={cs.chartGrid}>
      {GRUPOS.map((g) => (
        <div key={g.nombre} className={cs.chartBlock}>
          <h3>{g.nombre}</h3>
          <div className={s.dimBars}>
            {g.factores.map((f) => (
              <div key={f} className={s.dimCol}>
                <div
                  className={s.dimBar}
                  style={{ height: `${(puntajes[f] / 9) * 100}%` }}
                  title={`${f}: ${puntajes[f]}`}
                />
                <span>{f}</span>
                <small>{puntajes[f]}</small>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Diadas({ puntajes }: { puntajes: Record<Factor, number> }) {
  return (
    <div className={cs.chartBlock}>
      <h3>Díadas rol – necesidad</h3>
      <ChartLegend
        items={[
          { color: "#4a7fb8", label: "Rol" },
          { color: "#c45c4a", label: "Necesidad" },
        ]}
      />
      <div className={s.diadaList}>
        {DIADAS.map((d) => (
          <div key={d.rol} className={s.diadaRow}>
            <div className={s.diadaSide}>
              <span className={s.diadaKey}>{d.rol}</span>
              <span className={s.diadaName}>{NOMBRES[d.rol]}</span>
              <div className={s.diadaTrack}>
                <div
                  className={s.diadaRol}
                  style={{ width: `${(puntajes[d.rol] / 9) * 100}%` }}
                />
              </div>
              <strong>{puntajes[d.rol]}</strong>
            </div>
            <div className={s.diadaSide}>
              <span className={s.diadaKey}>{d.necesidad}</span>
              <span className={s.diadaName}>{NOMBRES[d.necesidad]}</span>
              <div className={s.diadaTrack}>
                <div
                  className={s.diadaNeed}
                  style={{ width: `${(puntajes[d.necesidad] / 9) * 100}%` }}
                />
              </div>
              <strong>{puntajes[d.necesidad]}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Bandas({ puntajes }: { puntajes: Record<Factor, number> }) {
  const bandaClass = (p: number) =>
    banda(p) === "alto" ? s.alto : banda(p) === "medio" ? s.medio : s.bajo;

  return (
    <div className={cs.chartBlock}>
      <h3>Bandas de interpretación</h3>
      <p className={s.bandaHint}>Bajo 0–2 · Medio 3–6 · Alto 7–9</p>
      <div className={s.bandaGrid}>
        {ORDEN_PERFIL.map((f) => (
          <div key={f} className={`${s.bandaCell} ${bandaClass(puntajes[f])}`}>
            <span className={s.bandaKey}>{f}</span>
            <strong>{puntajes[f]}</strong>
            <small>{banda(puntajes[f])}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PapiGraficas({
  cal,
  nombre,
  puesto,
  empresa,
}: {
  cal: ResultadoPapi;
  nombre?: string;
  puesto?: string;
  empresa?: string;
}) {
  const [vista, setVista] = useState("perfil");

  return (
    <section className={s.section}>
      <ChartTabs tabs={TABS} active={vista} onChange={setVista} title="Gráficas de interpretación" />

      {vista === "perfil" && (
        <div className={`${papiStyles.perfilCard} ${s.perfilWrap}`}>
          <PerfilPapi
            puntajes={cal.puntajes}
            nombre={nombre}
            puesto={puesto}
            empresa={empresa}
          />
        </div>
      )}
      {vista === "barras" && <BarrasFactores puntajes={cal.puntajes} />}
      {vista === "dimensiones" && <Dimensiones puntajes={cal.puntajes} />}
      {vista === "diadas" && <Diadas puntajes={cal.puntajes} />}
      {vista === "bandas" && <Bandas puntajes={cal.puntajes} />}
    </section>
  );
}
