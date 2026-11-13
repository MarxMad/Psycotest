"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AmbientBackground } from "@/components/AmbientBackground";
import { BackLink } from "@/components/ui/BackLink";
import { PhaseTransition } from "@/components/ui/PhaseTransition";
import { ProgressStrip } from "@/components/ui/ProgressStrip";
import { ConfirmacionPrueba } from "@/components/ConfirmacionPrueba";
import { useApplicantSession } from "@/lib/applicant-client";
import { EJEMPLO_LIFO } from "@/data/lifo";
import { GRUPOS_LIFO, calificarLifo, grupoValido, type RespuestasLifo } from "@/lib/lifo";
import { interpretarLifo } from "@/lib/informes";
import { NOMBRE_INSTRUMENTO } from "@/lib/instrumentos";
import {
  borrarBorrador,
  cargarBorrador,
  finalizarSesion,
  guardarBorrador,
  nuevaSesion,
  type Sesion,
} from "@/lib/storage";
import s from "./lifo.module.css";

type Fase = "intro" | "aplicando" | "resultado";

const TOTAL = GRUPOS_LIFO.length;
const VACIO = [0, 0, 0, 0];

const CONSIGNAS = [
  {
    titulo: "Qué es",
    cuerpo: [
      "No es un examen con respuestas correctas o incorrectas: es un cuestionario para descubrir sus fortalezas y estilos personales, tanto en situaciones productivas como en situaciones de presión, conflicto o estrés.",
    ],
  },
  {
    titulo: "Cómo responder",
    cuerpo: [
      "Verá 18 enunciados, cada uno seguido de cuatro frases. Ordénelas de acuerdo con qué tanto se parecen a usted.",
      "Toque primero la frase que MÁS se le asemeja (recibe un 4), luego la siguiente (3) y la siguiente (2). La que quede recibe el 1: la que MENOS se le asemeja.",
    ],
  },
  {
    titulo: "Reglas",
    cuerpo: [
      "Cada frase recibe un número distinto: 4, 3, 2 y 1, sin repetir.",
      "Si dos frases le parecen igual de parecidas —o igual de distintas— a usted, ordénelas de todos modos, aunque le resulte difícil.",
      "Para corregir, toque una frase ya numerada y se libera ese número.",
    ],
  },
  {
    titulo: "Tiempo",
    cuerpo: ["No hay límite de tiempo. Por término medio se tarda de 20 a 30 minutos."],
  },
];

/** El siguiente número a asignar: el más alto que aún no se usa. */
function siguienteValor(valores: number[]): number {
  return [4, 3, 2, 1].find((v) => !valores.includes(v)) ?? 0;
}

/** Toca una frase: si tiene número lo libera; si no, le da el siguiente. */
function tocar(valores: number[], idx: number): number[] {
  const next = [...valores];
  if (next[idx]) {
    next[idx] = 0;
    return next;
  }
  next[idx] = siguienteValor(next);
  // Con tres asignadas, la que queda recibe el 1 sola.
  const libres = next.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
  if (libres.length === 1) next[libres[0]] = 1;
  return next;
}

function contar(r: RespuestasLifo): number {
  return GRUPOS_LIFO.filter((g) => grupoValido(r[g.id])).length;
}

function Ordenador({
  terminos,
  valores,
  onTocar,
  prefijo,
}: {
  terminos: readonly string[];
  valores: number[];
  onTocar: (idx: number) => void;
  prefijo: string;
}) {
  const sig = siguienteValor(valores);
  return (
    <div className={s.grid}>
      {terminos.map((t, idx) => (
        <button
          key={`${prefijo}-${idx}`}
          type="button"
          className={s.row}
          data-valor={valores[idx] || undefined}
          onClick={() => onTocar(idx)}
          aria-label={
            valores[idx]
              ? `${t} — número ${valores[idx]}. Toque para quitarlo.`
              : `${t} — asignar ${sig}`
          }
        >
          <span className={s.num} aria-hidden>
            {valores[idx] || ""}
          </span>
          <span className={s.texto}>{t}</span>
        </button>
      ))}
    </div>
  );
}

function estado(valores: number[]): string {
  const sig = siguienteValor(valores);
  if (grupoValido(valores)) return "Grupo guardado";
  if (sig === 4) return "Toque la frase que MÁS se parece a usted (4)";
  return `Ahora la que sigue: ${sig}`;
}

export default function LifoPage() {
  const [fase, setFase] = useState<Fase>("intro");
  const [participante, setParticipante] = useState("");
  const [puesto, setPuesto] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [sesion, setSesion] = useState<Sesion<RespuestasLifo> | null>(null);
  const [i, setI] = useState(0);
  const [previa, setPrevia] = useState<Sesion<RespuestasLifo> | null>(null);
  const [verInstr, setVerInstr] = useState(false);
  const [draft, setDraft] = useState<number[]>(VACIO);
  const [practica, setPractica] = useState<number[]>(VACIO);
  const { session: aplicante } = useApplicantSession();

  useEffect(() => {
    if (aplicante) {
      setParticipante(aplicante.nombre);
      if (aplicante.puesto) setPuesto(aplicante.puesto);
      if (aplicante.empresa) setEmpresa(aplicante.empresa);
    }
  }, [aplicante]);

  useEffect(() => {
    const guardada = cargarBorrador<RespuestasLifo>("lifo");
    if (guardada && !guardada.finalizadaEn) setPrevia(guardada);
  }, []);

  const respuestas: RespuestasLifo = sesion?.respuestas ?? {};
  const contestadas = contar(respuestas);

  const persistir = useCallback((next: Sesion<RespuestasLifo>) => {
    setSesion(next);
    guardarBorrador(next);
  }, []);

  function cargarGrupo(r: RespuestasLifo, idx: number) {
    const v = r[GRUPOS_LIFO[idx].id];
    setDraft(grupoValido(v) ? [...v] : VACIO);
  }

  function iniciar(nombre: string) {
    const nueva = nuevaSesion<RespuestasLifo>("lifo", nombre || "Sin nombre", {});
    if (puesto) nueva.puesto = puesto;
    if (empresa) nueva.empresa = empresa;
    persistir(nueva);
    setI(0);
    setDraft(VACIO);
    setFase("aplicando");
  }

  function retomar(p: Sesion<RespuestasLifo>) {
    setSesion(p);
    setParticipante(p.participante);
    const sig = GRUPOS_LIFO.findIndex((g) => !grupoValido(p.respuestas[g.id]));
    const idx = sig === -1 ? TOTAL - 1 : sig;
    setI(idx);
    cargarGrupo(p.respuestas, idx);
    setFase("aplicando");
  }

  function elegir(idx: number) {
    if (!sesion) return;
    const valores = tocar(draft, idx);
    setDraft(valores);
    const id = GRUPOS_LIFO[i].id;
    const nextResp = { ...sesion.respuestas };
    if (grupoValido(valores)) nextResp[id] = valores;
    else delete nextResp[id];
    const completo = contar(nextResp) === TOTAL;
    persistir({ ...sesion, respuestas: nextResp, terminada: false });

    if (!grupoValido(valores)) return;
    if (i < TOTAL - 1 && !grupoValido(sesion.respuestas[id])) {
      // Primera vez que se completa: avanza solo. Al corregir, se queda.
      const ni = i + 1;
      setTimeout(() => {
        setI(ni);
        cargarGrupo(nextResp, ni);
      }, 260);
    } else if (completo && i === TOTAL - 1) {
      setTimeout(() => setFase("resultado"), 300);
    }
  }

  function irA(idx: number) {
    if (!sesion) return;
    setI(idx);
    cargarGrupo(sesion.respuestas, idx);
  }

  if (fase === "intro") {
    return (
      <>
        <AmbientBackground />
        <main className={s.main}>
          <PhaseTransition phaseKey="intro">
            <div className={s.intro}>
              <BackLink />
              <span className="eyebrow">{NOMBRE_INSTRUMENTO.lifo}</span>
              <h1>Orientaciones de vida</h1>
              <p>Lea las instrucciones y haga el ejemplo antes de comenzar.</p>

              <ol className={s.consignas}>
                {CONSIGNAS.map((c, n) => (
                  <li key={c.titulo}>
                    <span className={s.cn}>{n + 1}</span>
                    <div>
                      <h2>{c.titulo}</h2>
                      {c.cuerpo.map((p) => (
                        <p key={p}>{p}</p>
                      ))}
                    </div>
                  </li>
                ))}
              </ol>

              <div className={s.ejemplo}>
                <span className="eyebrow">Ejemplo — no cuenta</span>
                <p className={s.enunciadoEj}>{EJEMPLO_LIFO.enunciado}</p>
                <Ordenador
                  terminos={EJEMPLO_LIFO.terminos}
                  valores={practica}
                  onTocar={(idx) => setPractica((v) => tocar(v, idx))}
                  prefijo="ej"
                />
                <p className={s.status}>
                  {grupoValido(practica) ? "¡Así se hace! Ya puede comenzar." : estado(practica)}
                </p>
              </div>

              {previa && (
                <div className={s.instructions}>
                  <p>
                    Hay una aplicación sin terminar de <strong>{previa.participante}</strong> con{" "}
                    {contar(previa.respuestas)} de {TOTAL} grupos.
                  </p>
                  <div className={s.actions}>
                    <button type="button" className="btn btn-primary" onClick={() => retomar(previa)}>
                      Retomar donde se quedó
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => {
                        borrarBorrador("lifo");
                        setPrevia(null);
                      }}
                    >
                      Descartar y empezar de nuevo
                    </button>
                  </div>
                </div>
              )}

              <div className={s.datos}>
                <div className={`${s.field} ${s.ancho}`}>
                  <label htmlFor="p">Nombre</label>
                  <input
                    id="p"
                    value={participante}
                    onChange={(e) => setParticipante(e.target.value)}
                    placeholder="Nombre y apellidos"
                    autoComplete="off"
                    readOnly={!!aplicante}
                  />
                </div>
                <div className={s.field}>
                  <label htmlFor="pu">Puesto</label>
                  <input id="pu" value={puesto} onChange={(e) => setPuesto(e.target.value)} autoComplete="off" />
                </div>
                <div className={s.field}>
                  <label htmlFor="em">Empresa</label>
                  <input id="em" value={empresa} onChange={(e) => setEmpresa(e.target.value)} autoComplete="off" />
                </div>
              </div>

              <div className={s.actions}>
                <button type="button" className="btn btn-primary" onClick={() => iniciar(participante)}>
                  Comenzar la aplicación →
                </button>
                <Link href="/evaluacion/acceso" className="btn">
                  Volver
                </Link>
              </div>
            </div>
          </PhaseTransition>
        </main>
      </>
    );
  }

  if (fase === "resultado" && sesion) {
    return <Resultado sesion={sesion} />;
  }

  const grupo = GRUPOS_LIFO[i];
  const pct = (contestadas / TOTAL) * 100;

  return (
    <main className={s.main}>
      <ProgressStrip pct={pct} accent="var(--lifo)">
        <span>{sesion?.participante}</span>
        <button type="button" className={s.verInstr} onClick={() => setVerInstr((v) => !v)}>
          {verInstr ? "ocultar instrucciones" : "instrucciones"}
        </button>
        <span className={s.saved}>
          <i className={s.savedDot} /> {contestadas} de {TOTAL} guardados
        </span>
      </ProgressStrip>

      {verInstr && (
        <div className={s.panel}>
          <div className={s.panelIn}>
            {CONSIGNAS.slice(1).map((c) => (
              <div key={c.titulo}>
                <h3>{c.titulo}</h3>
                {c.cuerpo.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <PhaseTransition phaseKey={`g-${i}`} className={s.stage}>
        <div className={s.prompt}>
          <span className={s.itemNo}>
            Grupo {grupo.id} de {TOTAL}
          </span>
          <h2>{grupo.enunciado}</h2>
        </div>

        <Ordenador terminos={grupo.terminos} valores={draft} onTocar={elegir} prefijo={`g${grupo.id}`} />

        <p className={s.status}>{estado(draft)}</p>
      </PhaseTransition>

      <div className={s.controls}>
        <button type="button" className="btn" onClick={() => irA(Math.max(0, i - 1))} disabled={i === 0}>
          ← Anterior
        </button>
        <span className={s.hint}>4 = más se parece · 1 = menos</span>
        {contestadas === TOTAL ? (
          <button type="button" className="btn btn-primary" onClick={() => setFase("resultado")}>
            Terminar →
          </button>
        ) : (
          <button
            type="button"
            className="btn"
            onClick={() => irA(Math.min(TOTAL - 1, i + 1))}
            disabled={i === TOTAL - 1 || !grupoValido(respuestas[grupo.id])}
          >
            Siguiente →
          </button>
        )}
      </div>
    </main>
  );
}

function Resultado({ sesion }: { sesion: Sesion<RespuestasLifo> }) {
  const guardado = useRef(false);
  const [fin, setFin] = useState<Sesion<RespuestasLifo> | null>(null);

  useEffect(() => {
    // «terminada» ya viene en true al contestar lo último; lo que indica que
    // se calificó y se envió es la fecha de finalización.
    if (guardado.current || sesion.finalizadaEn) {
      if (sesion.finalizadaEn) setFin(sesion);
      return;
    }
    guardado.current = true;
    const r = calificarLifo(sesion.respuestas);
    setFin(finalizarSesion(sesion, r, interpretarLifo(r)));
  }, [sesion]);

  if (!fin?.finalizadaEn) return null;

  return (
    <ConfirmacionPrueba sesionId={fin.id} instrumento="lifo" participante={fin.participante} finalizadaEn={fin.finalizadaEn} />
  );
}
