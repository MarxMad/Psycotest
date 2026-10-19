"use client";

import { useState } from "react";
import { GRUPOS_MABE, MABE_ESCALA, type RespuestasMabe } from "@/lib/mabe";
import s from "./MabeRespuestas.module.css";

export function MabeRespuestas({ respuestas }: { respuestas: RespuestasMabe }) {
  const [grupoIdx, setGrupoIdx] = useState(0);
  const grupo = GRUPOS_MABE[grupoIdx];
  const escalaMap = Object.fromEntries(MABE_ESCALA.map((e) => [e.valor, e.etiqueta]));

  const respondidos = grupo.items.filter((it) => {
    const v = respuestas[it.id];
    return v >= 1 && v <= 5;
  }).length;

  return (
    <div className={s.wrap}>
      <div className={s.tabs}>
        {GRUPOS_MABE.map((g, i) => (
          <button
            key={g.id}
            type="button"
            className={i === grupoIdx ? s.tabOn : s.tab}
            onClick={() => setGrupoIdx(i)}
          >
            {g.title.replace(/^Hoja \d+ — /, "")}
          </button>
        ))}
      </div>

      <header className={s.head}>
        <div>
          <h2>{grupo.title}</h2>
          <p>{grupo.subtitle}</p>
        </div>
        <span className={s.count}>
          {respondidos}/{grupo.items.length} ítems
        </span>
      </header>

      {grupo.instrucciones.length > 0 && (
        <ul className={s.instr}>
          {grupo.instrucciones.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}

      {grupo.secciones.map((sec) => (
        <section key={sec.id} className={s.seccion}>
          <h3>{sec.titulo}</h3>
          <table className={s.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Enunciado</th>
                <th>Resp.</th>
                <th>Escala</th>
              </tr>
            </thead>
            <tbody>
              {sec.items.map((item) => {
                const v = respuestas[item.id];
                const ok = v >= 1 && v <= 5;
                return (
                  <tr key={item.id} className={!ok ? s.faltante : undefined}>
                    <td className={s.num}>{item.numero}</td>
                    <td>{item.texto}</td>
                    <td className={s.val}>{ok ? v : "—"}</td>
                    <td className={s.escala}>{ok ? escalaMap[v] : "Sin responder"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}
