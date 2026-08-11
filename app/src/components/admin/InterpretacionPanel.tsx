"use client";

import { MabeInterpretacion } from "@/app/mabe/MabeInterpretacion";
import { calificarMabe, type RespuestasMabe, type ResultadoMabe } from "@/lib/mabe";
import { calificarPapi, DIADAS, banda, type Respuestas } from "@/lib/papi";
import { calificarHartman } from "@/lib/hartman";
import {
  interpretarHartman,
  interpretarMabe,
  interpretarPapi,
} from "@/lib/informes";
import type { Sesion } from "@/lib/storage";
import { ExportarPdfButton } from "./ExportarPdfButton";
import s from "./InterpretacionPanel.module.css";

export function InterpretacionPanel({
  sesion,
  notas,
  setNotas,
  onGuardar,
  onAprobar,
}: {
  sesion: Sesion<unknown, unknown>;
  notas: string;
  setNotas: (v: string) => void;
  onGuardar: () => void;
  onAprobar: () => void;
}) {
  const texto =
    sesion.interpretacion ??
    (sesion.instrumento === "papi"
      ? interpretarPapi(
          sesion.calificacion
            ? (sesion.calificacion as ReturnType<typeof calificarPapi>)
            : calificarPapi(sesion.respuestas as Respuestas),
        )
      : sesion.instrumento === "hartman"
        ? interpretarHartman(
            sesion.calificacion
              ? (sesion.calificacion as ReturnType<typeof calificarHartman>)
              : calificarHartman(
                  (sesion.respuestas as { parteI: number[]; parteII: number[] }).parteI,
                  (sesion.respuestas as { parteI: number[]; parteII: number[] }).parteII,
                ),
          )
        : sesion.instrumento === "mabe"
          ? interpretarMabe(
              (sesion.calificacion as ResultadoMabe) ??
                calificarMabe(sesion.respuestas as RespuestasMabe),
              sesion.participante,
              sesion.puesto,
            )
          : "Sin interpretación generada.");

  return (
    <div className={s.wrap}>
      {sesion.instrumento === "mabe" && (
        <MabeInterpretacion
          resultado={
            (sesion.calificacion as ResultadoMabe) ??
            calificarMabe(sesion.respuestas as RespuestasMabe)
          }
          participante={sesion.participante}
          puesto={sesion.puesto}
          textoBorrador={texto}
        />
      )}

      {sesion.instrumento === "papi" && (
        <PapiInterpretacionResumen
          cal={
            sesion.calificacion
              ? (sesion.calificacion as ReturnType<typeof calificarPapi>)
              : calificarPapi(sesion.respuestas as Respuestas)
          }
          texto={texto}
        />
      )}

      {sesion.instrumento === "hartman" && (
        <HartmanInterpretacionResumen
          cal={
            sesion.calificacion
              ? (sesion.calificacion as ReturnType<typeof calificarHartman>)
              : calificarHartman(
                  (sesion.respuestas as { parteI: number[]; parteII: number[] }).parteI,
                  (sesion.respuestas as { parteI: number[]; parteII: number[] }).parteII,
                )
          }
          texto={texto}
        />
      )}

      <section className={s.notasBlock}>
        <label className={s.notasLabel}>
          Notas del psicólogo
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={6}
            placeholder="Observaciones clínicas, ajustes al informe…"
          />
        </label>
        <div className={s.row}>
          <button type="button" className="btn" onClick={onGuardar}>
            Guardar borrador
          </button>
          <button type="button" className="btn btn-primary" onClick={onAprobar}>
            Validar informe
          </button>
        </div>
        {sesion.aprobada && (
          <p className={s.validated}>
            Informe validado. Ya puedes exportar el PDF personalizado del participante.
          </p>
        )}
        <ExportarPdfButton
          sessionId={sesion.id}
          participante={sesion.participante}
          aprobada={sesion.aprobada}
        />
      </section>
    </div>
  );
}

function PapiInterpretacionResumen({
  cal,
  texto,
}: {
  cal: ReturnType<typeof calificarPapi>;
  texto: string;
}) {
  const altos = DIADAS.filter((d) => cal.puntajes[d.rol] >= 7 || cal.puntajes[d.necesidad] >= 7);

  return (
    <div className={s.resumen}>
      <header className={s.hero}>
        <span className={s.eyebrow}>PAPI — borrador clínico</span>
        <p>
          Control sumas: roles <strong>{cal.totalRoles}/45</strong> · necesidades{" "}
          <strong>{cal.totalNecesidades}/45</strong>
          {cal.controlOk ? " ✓" : " ⚠ revisar"}
        </p>
      </header>
      {altos.length > 0 && (
        <section className={s.card}>
          <h3>Factores elevados (≥ 7)</h3>
          <ul>
            {altos.map((d) => (
              <li key={d.rol}>
                {d.rol} ({cal.puntajes[d.rol]}, {banda(cal.puntajes[d.rol])}) ↔ {d.necesidad} (
                {cal.puntajes[d.necesidad]}, {banda(cal.puntajes[d.necesidad])})
              </li>
            ))}
          </ul>
        </section>
      )}
      <pre className={s.pre}>{texto}</pre>
    </div>
  );
}

function HartmanInterpretacionResumen({
  cal,
  texto,
}: {
  cal: ReturnType<typeof calificarHartman>;
  texto: string;
}) {
  return (
    <div className={s.resumen}>
      <header className={s.hero}>
        <span className={s.eyebrow}>Hartman — borrador clínico</span>
        <p>
          Interpretable: <strong>{cal.interpretable ? "Sí" : "No"}</strong>
          {!cal.interpretable && cal.motivo && <> — {cal.motivo}</>}
        </p>
        <p className={s.sub}>
          V.Q. DIS {cal.VQ.DIS} · S.Q. DIS {cal.SQ.DIS}
        </p>
      </header>
      <pre className={s.pre}>{texto}</pre>
    </div>
  );
}
