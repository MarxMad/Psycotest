"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AmbientBackground } from "@/components/AmbientBackground";
import { BackLink } from "@/components/ui/BackLink";
import { PhaseTransition } from "@/components/ui/PhaseTransition";
import { ProgressStrip } from "@/components/ui/ProgressStrip";
import { ConfirmacionPrueba } from "@/components/ConfirmacionPrueba";
import { useApplicantSession } from "@/lib/applicant-client";
import {
  SERIES_CLEAVER,
  calificarCleaver,
  type RespuestasCleaver,
} from "@/lib/cleaver";
import { interpretarCleaver } from "@/lib/informes";
import {
  borrarBorrador,
  cargarBorrador,
  finalizarSesion,
  guardarBorrador,
  nuevaSesion,
  type Sesion,
} from "@/lib/storage";
import { CONSIGNAS } from "./consignas";
import s from "./cleaver.module.css";

type Fase = "intro" | "aplicando" | "resultado";
type DraftSerie = { mas: number | null; menos: number | null };

const TOTAL = SERIES_CLEAVER.length;

function serieCompleta(r: RespuestasCleaver[number] | undefined) {
  return !!r && r.mas !== r.menos;
}

export default function CleaverPage() {
  const [fase, setFase] = useState<Fase>("intro");
  const [participante, setParticipante] = useState("");
  const [puesto, setPuesto] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [sesion, setSesion] = useState<Sesion<RespuestasCleaver> | null>(null);
  const [i, setI] = useState(0);
  const [previa, setPrevia] = useState<Sesion<RespuestasCleaver> | null>(null);
  const [verInstr, setVerInstr] = useState(false);
  const [draft, setDraft] = useState<DraftSerie>({ mas: null, menos: null });
  const { session: aplicante } = useApplicantSession();

  useEffect(() => {
    if (aplicante) {
      setParticipante(aplicante.nombre);
      if (aplicante.puesto) setPuesto(aplicante.puesto);
      if (aplicante.empresa) setEmpresa(aplicante.empresa);
    }
  }, [aplicante]);

  useEffect(() => {
    const guardada = cargarBorrador<RespuestasCleaver>("cleaver");
    if (guardada && !guardada.terminada) setPrevia(guardada);
  }, []);

  const respuestas: RespuestasCleaver = sesion?.respuestas ?? {};
  const contestadas = Object.values(respuestas).filter(serieCompleta).length;

  const persistir = useCallback((next: Sesion<RespuestasCleaver>) => {
    setSesion(next);
    guardarBorrador(next);
  }, []);

  function syncDraftFromSesion(s0: Sesion<RespuestasCleaver>, idx: number) {
    const r = s0.respuestas[SERIES_CLEAVER[idx].id];
    setDraft(r ? { mas: r.mas, menos: r.menos } : { mas: null, menos: null });
  }

  function iniciar(nombre: string) {
    const nueva = nuevaSesion<RespuestasCleaver>("cleaver", nombre || "Sin nombre", {});
    if (puesto) nueva.puesto = puesto;
    if (empresa) nueva.empresa = empresa;
    persistir(nueva);
    setI(0);
    setDraft({ mas: null, menos: null });
    setFase("aplicando");
  }

  function retomar(previaSesion: Sesion<RespuestasCleaver>) {
    setSesion(previaSesion);
    setParticipante(previaSesion.participante);
    const siguiente = SERIES_CLEAVER.findIndex((ser) => !serieCompleta(previaSesion.respuestas[ser.id]));
    const idx = siguiente === -1 ? TOTAL - 1 : siguiente;
    setI(idx);
    syncDraftFromSesion(previaSesion, idx);
    setFase("aplicando");
  }

  const guardarSerie = useCallback(
    (mas: number, menos: number) => {
      if (!sesion || mas === menos) return;
      const id = SERIES_CLEAVER[i].id;
      const nextResp = { ...sesion.respuestas, [id]: { mas, menos } };
      const completo = SERIES_CLEAVER.every((ser) => serieCompleta(nextResp[ser.id]));
      const next = { ...sesion, respuestas: nextResp, terminada: completo };
      persistir(next);
      if (i < TOTAL - 1) {
        const ni = i + 1;
        setTimeout(() => {
          setI(ni);
          const r = nextResp[SERIES_CLEAVER[ni].id];
          setDraft(r ? { mas: r.mas, menos: r.menos } : { mas: null, menos: null });
        }, 120);
      } else if (completo) {
        setTimeout(() => setFase("resultado"), 160);
      }
    },
    [i, persistir, sesion],
  );

  function elegir(kind: "mas" | "menos", idx: number) {
    const next: DraftSerie = {
      mas: kind === "mas" ? (draft.mas === idx ? null : idx) : draft.mas,
      menos: kind === "menos" ? (draft.menos === idx ? null : idx) : draft.menos,
    };
    if (kind === "mas" && next.mas === next.menos) next.menos = null;
    if (kind === "menos" && next.mas === next.menos) next.mas = null;
    setDraft(next);
    if (next.mas !== null && next.menos !== null && next.mas !== next.menos) {
      guardarSerie(next.mas, next.menos);
    }
  }

  function irA(idx: number) {
    if (!sesion) return;
    setI(idx);
    syncDraftFromSesion(sesion, idx);
  }

  if (fase === "intro") {
    return (
      <>
        <AmbientBackground />
        <main className={s.main}>
          <PhaseTransition phaseKey="intro">
            <div className={s.intro}>
              <BackLink />
              <span className="eyebrow">Cleaver · DISC</span>
              <h1>Autodescripción</h1>
              <p>
                Lea las instrucciones antes de comenzar. En cada serie elija la palabra que más lo
                describe y la que menos lo describe.
              </p>

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
                <span className="eyebrow">Ejemplo</span>
                <p>
                  Si en una serie de cuatro adjetivos <em>PERSUASIVO</em> lo describe mejor y{" "}
                  <em>HUMILDE</em> lo describe menos, marque MÁS en el primero y MENOS en el segundo.
                </p>
              </div>

              {previa && (
                <div className={s.instructions}>
                  <p>
                    Hay una aplicación sin terminar de <strong>{previa.participante}</strong> con{" "}
                    {Object.values(previa.respuestas).filter(serieCompleta).length} de {TOTAL} series.
                  </p>
                  <div className={s.actions}>
                    <button type="button" className="btn btn-primary" onClick={() => retomar(previa)}>
                      Retomar donde se quedó
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => {
                        borrarBorrador("cleaver");
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
                  <input
                    id="pu"
                    value={puesto}
                    onChange={(e) => setPuesto(e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className={s.field}>
                  <label htmlFor="em">Empresa</label>
                  <input
                    id="em"
                    value={empresa}
                    onChange={(e) => setEmpresa(e.target.value)}
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className={s.actions}>
                <button type="button" className="btn btn-primary" onClick={() => iniciar(participante)}>
                  Comenzar la aplicación →
                </button>
                <Link href="/psycotest" className="btn">
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

  const serie = SERIES_CLEAVER[i];
  const pct = (contestadas / TOTAL) * 100;
  const lista = draft.mas !== null && draft.menos !== null && draft.mas === draft.menos;

  return (
    <main className={s.main}>
      <ProgressStrip pct={pct} accent="var(--cleaver)">
        <span>{sesion?.participante}</span>
        <button type="button" className={s.verInstr} onClick={() => setVerInstr((v) => !v)}>
          {verInstr ? "ocultar instrucciones" : "instrucciones"}
        </button>
        <span className={s.saved}>
          <i className={s.savedDot} /> {contestadas} de {TOTAL} guardadas
        </span>
      </ProgressStrip>

      {verInstr && (
        <div className={s.panel}>
          <div className={s.panelIn}>
            {CONSIGNAS.map((c) => (
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

      <PhaseTransition phaseKey={`s-${i}`} className={s.stage}>
        <div className={s.prompt}>
          <span className={s.itemNo}>
            Serie {serie.id} de {TOTAL}
          </span>
          <h2>Elija la que MÁS lo describe y la que MENOS lo describe</h2>
        </div>

        <div className={s.grid}>
          {serie.adjetivos.map((adj, idx) => (
            <div
              key={`${serie.id}-${idx}`}
              className={s.row}
              data-mas={draft.mas === idx}
              data-menos={draft.menos === idx}
            >
              <span className={s.adj}>{adj.texto}</span>
              <div className={s.pickers}>
                <button
                  type="button"
                  className={s.pick}
                  data-on={draft.mas === idx}
                  onClick={() => elegir("mas", idx)}
                  disabled={draft.menos === idx}
                >
                  MÁS
                </button>
                <button
                  type="button"
                  className={`${s.pick} ${s.pickMenos}`}
                  data-on={draft.menos === idx}
                  onClick={() => elegir("menos", idx)}
                  disabled={draft.mas === idx}
                >
                  MENOS
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className={`${s.status} ${lista ? s.statusWarn : ""}`}>
          {lista
            ? "MÁS y MENOS no pueden ser el mismo adjetivo"
            : draft.mas === null || draft.menos === null
              ? "Seleccione MÁS y MENOS para avanzar"
              : "Serie guardada"}
        </p>
      </PhaseTransition>

      <div className={s.controls}>
        <button type="button" className="btn" onClick={() => irA(Math.max(0, i - 1))} disabled={i === 0}>
          ← Anterior
        </button>
        <span className={s.hint}>Una MÁS y una MENOS por serie</span>
        {contestadas === TOTAL ? (
          <button type="button" className="btn btn-primary" onClick={() => setFase("resultado")}>
            Ver calificación →
          </button>
        ) : (
          <button
            type="button"
            className="btn"
            onClick={() => irA(Math.min(TOTAL - 1, i + 1))}
            disabled={i === TOTAL - 1 || !serieCompleta(respuestas[serie.id])}
          >
            Siguiente →
          </button>
        )}
      </div>
    </main>
  );
}

function Resultado({ sesion }: { sesion: Sesion<RespuestasCleaver> }) {
  const guardado = useRef(false);
  const [fin, setFin] = useState<Sesion<RespuestasCleaver> | null>(null);

  useEffect(() => {
    if (guardado.current || sesion.terminada) {
      if (sesion.finalizadaEn) setFin(sesion);
      return;
    }
    guardado.current = true;
    const r = calificarCleaver(sesion.respuestas);
    const next = finalizarSesion(sesion, r, interpretarCleaver(r));
    setFin(next);
  }, [sesion]);

  if (!fin?.finalizadaEn) return null;

  return (
    <ConfirmacionPrueba
      instrumento="cleaver"
      participante={fin.participante}
      finalizadaEn={fin.finalizadaEn}
    />
  );
}
