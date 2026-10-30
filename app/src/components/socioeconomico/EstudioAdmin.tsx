"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import {
  SECCIONES_CANDIDATO,
  SECCIONES_INVESTIGADOR,
  TRANSFERENCIA,
  type Fila,
  type ValoresSeccion,
} from "@/data/socioeconomico";
import {
  comoRespuestas,
  faltantes,
  filasDe,
  pesos,
  resumirSocioeconomico,
  texto,
  type RespuestasSocioeconomico,
} from "@/lib/socioeconomico";
import { dbSessionToSesion, fetchSession } from "@/lib/api-client";
import type { Sesion } from "@/lib/storage";
import { ExportarPdfButton } from "@/components/admin/ExportarPdfButton";
import { FormularioSeccion, LecturaSeccion } from "./Formulario";
import a from "@/app/admin/admin.module.css";
import s from "./estudio-admin.module.css";

type Pestana = "resumen" | "candidato" | "investigacion" | "dictamen";

/**
 * El Estudio Socioeconómico en el panel. El candidato ya mandó su parte; aquí
 * el investigador la lee, captura la visita, la vivienda y la verificación de
 * referencias, y cierra con su dictamen.
 */
export function EstudioAdmin({
  sesion,
  onCambio,
}: {
  sesion: Sesion<unknown, unknown>;
  onCambio: (s: Sesion<unknown, unknown>) => void;
}) {
  const r = useMemo(() => comoRespuestas(sesion.respuestas), [sesion.respuestas]);
  const [pestana, setPestana] = useState<Pestana>("resumen");
  const [inv, setInv] = useState<Record<string, ValoresSeccion>>(() => conPrellenado(r, sesion));
  const [notas, setNotas] = useState(sesion.notasPsicologo ?? "");
  const [sucio, setSucio] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  // El resumen se ve al día mientras se captura, sin esperar a guardar.
  const vivo = useMemo(() => resumirSocioeconomico({ ...r, investigador: inv }), [r, inv]);

  async function guardar(cambios: { investigacion?: unknown; notasPsicologo?: string; aprobada?: boolean }) {
    setGuardando(true);
    setMensaje(null);
    try {
      const res = await fetch(`/api/sessions/${sesion.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cambios),
      });
      const d = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(d.error ?? "No se pudo guardar.");
      const fila = await fetchSession(sesion.id);
      if (fila) onCambio(dbSessionToSesion(fila));
      setSucio(false);
      setMensaje({ tipo: "ok", texto: cambios.aprobada ? "Estudio validado." : "Guardado." });
    } catch (e) {
      setMensaje({ tipo: "error", texto: (e as Error).message });
    } finally {
      setGuardando(false);
    }
  }

  const barraGuardar = (
    <div className={s.barra}>
      {mensaje && (
        <span className={mensaje.tipo === "ok" ? s.ok : s.error} role="status">
          {mensaje.texto}
        </span>
      )}
      {sucio && !mensaje && <span className={s.pendiente}>Cambios sin guardar</span>}
      <button
        type="button"
        className="btn btn-primary"
        disabled={guardando}
        onClick={() => guardar({ investigacion: inv, notasPsicologo: notas, aprobada: false })}
      >
        {guardando ? "Guardando…" : "Guardar investigación"}
      </button>
    </div>
  );

  return (
    <div className={s.wrap} style={{ "--accent": "var(--socioeconomico)" } as React.CSSProperties}>
      <div className={a.tabs}>
        {(
          [
            ["resumen", "Resumen"],
            ["candidato", "Datos del candidato"],
            ["investigacion", "Investigación"],
            ["dictamen", "Dictamen"],
          ] as const
        ).map(([k, label]) => (
          <button key={k} type="button" className={pestana === k ? a.tabOn : a.tab} onClick={() => setPestana(k)}>
            {label}
          </button>
        ))}
      </div>

      {pestana === "resumen" && (
        <div className={s.resumen}>
          <div className={s.cifras}>
            <Cifra etiqueta="Ingresos mensuales" valor={pesos(vivo.ingresos)} />
            <Cifra etiqueta="Egresos mensuales" valor={pesos(vivo.egresos)} />
            <Cifra
              etiqueta="Diferencia"
              valor={pesos(vivo.diferencia)}
              tono={vivo.diferencia < 0 ? "alerta" : undefined}
            />
            <Cifra
              etiqueta="Referencias laborales"
              valor={vivo.promedioReferencias != null ? `${vivo.promedioReferencias} / 10` : "—"}
            />
            <Cifra etiqueta="Dictamen" valor={vivo.dictamen ?? "Pendiente"} />
          </div>

          <div className={s.columnas}>
            <Avance titulo="Parte del candidato" items={vivo.avanceCandidato} />
            <Avance titulo="Parte del investigador" items={vivo.avanceInvestigador} />
          </div>

          <section className={s.tarjeta}>
            <h3>Aviso de privacidad</h3>
            {r.aviso ? (
              <>
                <p>
                  Firmado por <strong>{r.aviso.nombre}</strong> el{" "}
                  {new Date(r.aviso.fecha).toLocaleString("es-MX", { dateStyle: "long", timeStyle: "short" })}
                </p>
                <p className={r.aviso.transferencia === "noAcepta" ? s.alerta : undefined}>
                  {TRANSFERENCIA[r.aviso.transferencia]}.
                </p>
              </>
            ) : (
              <p className={s.alerta}>Sin aviso de privacidad firmado.</p>
            )}
          </section>

          {vivo.verificaciones.length > 0 && (
            <section className={s.tarjeta}>
              <h3>Verificación laboral</h3>
              <ul className={s.verificaciones}>
                {vivo.verificaciones.map((v, i) => (
                  <li key={i}>
                    <strong>{v.empresa || `Empleo ${i + 1}`}</strong>
                    <span>{v.promedio != null ? `${v.promedio} / 10` : "sin calificar"}</span>
                    <span>{v.recomienda ? `Lo recomendaría: ${v.recomienda}` : "—"}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {pestana === "candidato" &&
        SECCIONES_CANDIDATO.map((sec) => (
          <section key={sec.id} className={s.tarjeta}>
            <h3>{sec.titulo}</h3>
            <LecturaSeccion seccion={sec} valores={r.candidato[sec.id]} />
          </section>
        ))}

      {pestana === "investigacion" && (
        <>
          {SECCIONES_INVESTIGADOR.map((sec) => {
            const f = faltantes(sec, inv[sec.id]);
            return (
              <details key={sec.id} className={s.bloque} open={sec.id === "solicitud" || undefined}>
                <summary>
                  {f.length === 0 ? (
                    <CheckCircle2 size={18} className={s.hecho} aria-label="Completa" />
                  ) : (
                    <Circle size={18} className={s.falta} aria-label="Incompleta" />
                  )}
                  <span>{sec.titulo}</span>
                  {f.length > 0 && <small>Falta: {f.slice(0, 2).join(", ")}{f.length > 2 ? "…" : ""}</small>}
                </summary>
                {sec.descripcion && <p className={a.muted}>{sec.descripcion}</p>}
                <FormularioSeccion
                  seccion={sec}
                  prefijo="inv-"
                  valores={inv[sec.id] ?? {}}
                  onChange={(v) => {
                    setInv((prev) => ({ ...prev, [sec.id]: v }));
                    setSucio(true);
                    setMensaje(null);
                  }}
                />
              </details>
            );
          })}
          {barraGuardar}
        </>
      )}

      {pestana === "dictamen" && (
        <section className={s.tarjeta}>
          <h3>Borrador del informe</h3>
          <p className={s.texto}>{sesion.interpretacion ?? "Se genera al guardar la investigación."}</p>
          <label className={s.notas}>
            Observaciones para el informe
            <textarea
              value={notas}
              rows={6}
              onChange={(e) => {
                setNotas(e.target.value);
                setSucio(true);
              }}
              placeholder="Lo que deba leer el cliente además del dictamen…"
            />
          </label>
          <div className={s.barra}>
            {mensaje && (
              <span className={mensaje.tipo === "ok" ? s.ok : s.error} role="status">
                {mensaje.texto}
              </span>
            )}
            <button
              type="button"
              className="btn"
              disabled={guardando}
              onClick={() => guardar({ investigacion: inv, notasPsicologo: notas, aprobada: false })}
            >
              Guardar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={guardando || vivo.pendientesValidar.length > 0}
              onClick={() => guardar({ investigacion: inv, notasPsicologo: notas, aprobada: true })}
            >
              Validar estudio
            </button>
          </div>
          {vivo.pendientesValidar.length > 0 && (
            <p className={a.muted}>Para validar, completa en Investigación: {vivo.pendientesValidar.join(", ")}.</p>
          )}
          <ExportarPdfButton sessionId={sesion.id} participante={sesion.participante} aprobada={sesion.aprobada} />
        </section>
      )}
    </div>
  );
}

/**
 * Lo que el investigador ya sabe antes de empezar: la empresa y el puesto del
 * código, y los nombres de las referencias que dio el candidato. Sólo llena
 * lo que está vacío; lo capturado nunca se pisa.
 */
function conPrellenado(r: RespuestasSocioeconomico, sesion: Sesion<unknown, unknown>) {
  const inv: Record<string, ValoresSeccion> = structuredClone(r.investigador);

  const sol = { ...(inv.solicitud ?? {}) };
  if (!texto(sol.empresa) && sesion.empresa) sol.empresa = sesion.empresa;
  if (!texto(sol.puesto) && sesion.puesto) sol.puesto = sesion.puesto;
  inv.solicitud = sol;

  const opinion = SECCIONES_INVESTIGADOR.find((x) => x.id === "opinionReferencias")!;
  if (!filasDe(inv.opinionReferencias, opinion).length) {
    const refs = filasDe(r.candidato.refPersonales, SECCIONES_CANDIDATO.find((x) => x.id === "refPersonales")!);
    if (refs.length) inv.opinionReferencias = { opiniones: refs.map((f) => ({ referencia: texto(f.nombre) })) };
  }

  const patron = SECCIONES_INVESTIGADOR.find((x) => x.id === "patronReferencias")!;
  if (!filasDe(inv.patronReferencias, patron).length) {
    const empleos = filasDe(r.candidato.refLaborales, SECCIONES_CANDIDATO.find((x) => x.id === "refLaborales")!);
    if (empleos.length) {
      inv.patronReferencias = {
        verificaciones: empleos.map(
          (f): Fila => ({
            empresa: texto(f.empresa),
            jefe: texto(f.jefe),
            jefePuesto: texto(f.jefePuesto),
            puesto: texto(f.ultimoPuesto),
            duracion: texto(f.antiguedad),
          }),
        ),
      };
    }
  }

  const fam = r.candidato.generales;
  const domicilio = [texto(fam?.domicilio), texto(fam?.colonia), texto(fam?.ciudad)].filter(Boolean).join(", ");
  const visita = { ...(inv.visita ?? {}) };
  if (!texto(visita.domicilio) && domicilio) visita.domicilio = domicilio;
  inv.visita = visita;

  return inv;
}

function Cifra({ etiqueta, valor, tono }: { etiqueta: string; valor: string; tono?: "alerta" }) {
  return (
    <div className={s.cifra} data-tono={tono}>
      <span>{etiqueta}</span>
      <strong>{valor}</strong>
    </div>
  );
}

function Avance({ titulo, items }: { titulo: string; items: { id: string; titulo: string; completa: boolean }[] }) {
  const n = items.filter((x) => x.completa).length;
  return (
    <section className={s.tarjeta}>
      <h3>
        {titulo} · {n} de {items.length}
      </h3>
      <ul className={s.avance}>
        {items.map((x) => (
          <li key={x.id} data-ok={x.completa || undefined}>
            {x.completa ? <CheckCircle2 size={16} aria-hidden /> : <Circle size={16} aria-hidden />}
            {x.titulo}
          </li>
        ))}
      </ul>
    </section>
  );
}
