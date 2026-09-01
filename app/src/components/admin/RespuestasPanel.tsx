"use client";

import itemsJson from "@/data/papi-items.json";
import hartmanJson from "@/data/hartman-items.json";
import { CLAVE, NOMBRES, type Respuestas } from "@/lib/papi";
import { MabeRespuestas } from "@/app/psycotest/mabe/MabeRespuestas";
import type { RespuestasMabe } from "@/lib/mabe";
import type { Sesion } from "@/lib/storage";
import s from "./RespuestasPanel.module.css";

type ParPapi = { n: number; a: string; b: string };
const PARES = itemsJson as ParPapi[];

const HARTMAN = hartmanJson as {
  parteI: { id: string; texto: string }[];
  parteII: { id: string; texto: string }[];
};

export function RespuestasPanel({ sesion }: { sesion: Sesion<unknown, unknown> }) {
  if (sesion.instrumento === "mabe") {
    return <MabeRespuestas respuestas={sesion.respuestas as RespuestasMabe} />;
  }

  if (sesion.instrumento === "papi") {
    const resp = sesion.respuestas as Respuestas;
    return (
      <div className={s.wrap}>
        <p className={s.meta}>
          {Object.keys(resp).length}/90 ítems · Control roles/necesidades según calificación
        </p>
        <table className={s.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Opción A</th>
              <th>Opción B</th>
              <th>Eligió</th>
              <th>Factor</th>
            </tr>
          </thead>
          <tbody>
            {PARES.map((par) => {
              const clave = CLAVE.items.find((i) => i.n === par.n);
              const eleccion = resp[par.n];
              const factor = clave && eleccion ? (eleccion === "A" ? clave.a : clave.b) : null;
              return (
                <tr key={par.n} className={!eleccion ? s.faltante : undefined}>
                  <td className={s.num}>{par.n}</td>
                  <td className={eleccion === "A" ? s.elegida : undefined}>{par.a}</td>
                  <td className={eleccion === "B" ? s.elegida : undefined}>{par.b}</td>
                  <td className={s.mono}>{eleccion ?? "—"}</td>
                  <td className={s.mono}>
                    {factor ? `${factor} · ${NOMBRES[factor]}` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  if (sesion.instrumento === "hartman") {
    const resp = sesion.respuestas as { parteI: number[]; parteII: number[] };
    return (
      <div className={s.wrap}>
        {(["parteI", "parteII"] as const).map((parte, idx) => (
          <section key={parte} className={s.block}>
            <h2>{idx === 0 ? "Parte I — V.Q." : "Parte II — S.Q."}</h2>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Ítem</th>
                  <th>Enunciado</th>
                  <th>Ranking</th>
                </tr>
              </thead>
              <tbody>
                {HARTMAN[parte].map((item, i) => (
                  <tr key={item.id}>
                    <td className={s.mono}>{item.id}</td>
                    <td>{item.texto}</td>
                    <td className={s.num}>{resp[parte][i] ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    );
  }

  return (
    <pre className={s.raw}>{JSON.stringify(sesion.respuestas, null, 2)}</pre>
  );
}
