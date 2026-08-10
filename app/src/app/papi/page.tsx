"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import items from "@/data/papi-items.json";
import { AmbientBackground } from "@/components/AmbientBackground";
import { BackLink } from "@/components/ui/BackLink";
import { PhaseTransition } from "@/components/ui/PhaseTransition";
import { ProgressStrip } from "@/components/ui/ProgressStrip";
import {
  calificarPapi,
  type Factor,
  type Opcion,
  type Respuestas,
} from "@/lib/papi";
import { CONSIGNAS } from "./consignas";
import { ConfirmacionPrueba } from "@/components/ConfirmacionPrueba";
import { useApplicantSession } from "@/lib/applicant-client";
import { borrarBorrador, cargarBorrador, finalizarSesion, guardarBorrador, nuevaSesion, type Sesion } from "@/lib/storage";
import { interpretarPapi } from "@/lib/informes";
import s from "./papi.module.css";

type Par = { n: number; a: string; b: string };
const PARES = items as Par[];
type Fase = "intro" | "aplicando" | "resultado";

export default function Papi() {
  const [fase, setFase] = useState<Fase>("intro");
  const [participante, setParticipante] = useState("");
  const [puesto, setPuesto] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [sesion, setSesion] = useState<Sesion<Respuestas> | null>(null);
  const [i, setI] = useState(0);
  const [previa, setPrevia] = useState<Sesion<Respuestas> | null>(null);
  const [verInstr, setVerInstr] = useState(false);
  const { session: aplicante } = useApplicantSession();

  useEffect(() => {
    if (aplicante) {
      setParticipante(aplicante.nombre);
      if (aplicante.puesto) setPuesto(aplicante.puesto);
      if (aplicante.empresa) setEmpresa(aplicante.empresa);
    }
  }, [aplicante]);

  useEffect(() => {
    const guardada = cargarBorrador<Respuestas>("papi");
    if (guardada && !guardada.terminada) setPrevia(guardada);
  }, []);

  const respuestas: Respuestas = sesion?.respuestas ?? {};
  const contestadas = Object.keys(respuestas).length;

  const persistir = useCallback((next: Sesion<Respuestas>) => {
    setSesion(next);
    guardarBorrador(next);
  }, []);

  function iniciar(nombre: string) {
    const nueva = nuevaSesion<Respuestas>("papi", nombre || "Sin nombre", {});
    persistir(nueva);
    setI(0);
    setFase("aplicando");
  }

  function retomar(previaSesion: Sesion<Respuestas>) {
    setSesion(previaSesion);
    setParticipante(previaSesion.participante);
    const siguiente = PARES.findIndex((p) => !previaSesion.respuestas[p.n]);
    setI(siguiente === -1 ? PARES.length - 1 : siguiente);
    setFase("aplicando");
  }

  const responder = useCallback(
    (opcion: Opcion) => {
      if (!sesion) return;
      const par = PARES[i];
      const next = { ...sesion, respuestas: { ...sesion.respuestas, [par.n]: opcion } };
      const completo = Object.keys(next.respuestas).length === PARES.length;
      persistir({ ...next, terminada: completo });
      if (i < PARES.length - 1) {
        setTimeout(() => setI((v) => v + 1), 110);
      } else if (completo) {
        setTimeout(() => setFase("resultado"), 160);
      }
    },
    [i, persistir, sesion],
  );

  useEffect(() => {
    if (fase !== "aplicando") return;
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "a" || k === "1" || e.key === "ArrowLeft") { e.preventDefault(); responder("A"); }
      else if (k === "b" || k === "2" || e.key === "ArrowRight") { e.preventDefault(); responder("B"); }
      else if (e.key === "Backspace") { e.preventDefault(); setI((v) => Math.max(0, v - 1)); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fase, responder]);

  /* ---------------------------------------------------------------- */

  if (fase === "intro") {
    return (
      <>
        <AmbientBackground />
        <main className={s.main}>
          <PhaseTransition phaseKey="intro">
            <div className={s.intro}>
              <BackLink />
              <span className="eyebrow">PAPI</span>
          <h1>Inventario de Preferencias de Personalidad</h1>
          <p>
            Lea las instrucciones antes de comenzar. Puede volver a consultarlas en cualquier momento
            durante la aplicación.
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
              Si cree que <em>«Soy trabajador»</em> le describe mejor que{" "}
              <em>«No soy de humor variable»</em>, elija la primera. Si es al contrario, elija la
              segunda.
            </p>
            <div className={s.ejemploPar}>
              <span className={s.ejemploOpt}>
                <i>A</i> Soy trabajador
              </span>
              <span className={s.ejemploOpt}>
                <i>B</i> No soy de humor variable
              </span>
            </div>
          </div>

          {previa && (
            <div className={s.instructions} style={{ borderLeftColor: "var(--mabe)" }}>
              <p>
                Hay una aplicación sin terminar de <strong>{previa.participante}</strong> con{" "}
                {Object.keys(previa.respuestas).length} de 90 respuestas.
              </p>
              <div className={s.row}>
                <button className="btn btn-primary" onClick={() => retomar(previa)}>
                  Retomar donde se quedó
                </button>
                <button
                  className="btn"
                  onClick={() => { borrarBorrador("papi"); setPrevia(null); }}
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

          <div className={s.row}>
            <button className="btn btn-primary" onClick={() => iniciar(participante)}>
              Comenzar la aplicación →
            </button>
            <Link href="/" className="btn">Volver</Link>
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

  const par = PARES[i];
  const elegida = respuestas[par.n];
  const pct = (contestadas / PARES.length) * 100;

  return (
    <main className={s.main}>
      <ProgressStrip pct={pct} accent="var(--papi)">
        <span>{sesion?.participante}</span>
        <button className={s.verInstr} onClick={() => setVerInstr((v) => !v)}>
          {verInstr ? "ocultar instrucciones" : "instrucciones"}
        </button>
        <span className={s.saved}>
          <i className={s.savedDot} /> {contestadas} de 90 guardadas
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

      <PhaseTransition phaseKey={`q-${i}`} className={s.stage}>
        <div className={s.prompt}>
          <span className={s.itemNo}>Par {par.n} de 90</span>
          <h2>¿Cuál describe mejor a la persona?</h2>
        </div>

        <div className={s.choices}>
          <motion.button
            className={s.choice}
            data-sel={elegida === "A"}
            onClick={() => responder("A")}
            whileHover={{ scale: 1.012 }}
            whileTap={{ scale: 0.985 }}
            layout
          >
            <span className={s.key}>A</span>
            <span className={s.text}>{par.a}</span>
          </motion.button>
          <motion.button
            className={s.choice}
            data-sel={elegida === "B"}
            onClick={() => responder("B")}
            whileHover={{ scale: 1.012 }}
            whileTap={{ scale: 0.985 }}
            layout
          >
            <span className={s.key}>B</span>
            <span className={s.text}>{par.b}</span>
          </motion.button>
        </div>
      </PhaseTransition>

      <div className={s.controls}>
        <button className="btn" onClick={() => setI((v) => Math.max(0, v - 1))} disabled={i === 0}>
          ← Anterior
        </button>
        <span className={s.hint}>
          <kbd>A</kbd> / <kbd>B</kbd> para elegir · <kbd>⌫</kbd> para regresar
        </span>
        {contestadas === PARES.length ? (
          <button className="btn btn-primary" onClick={() => setFase("resultado")}>
            Ver calificación →
          </button>
        ) : (
          <button
            className="btn"
            onClick={() => setI((v) => Math.min(PARES.length - 1, v + 1))}
            disabled={i === PARES.length - 1}
          >
            Siguiente →
          </button>
        )}
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */

function Resultado({ sesion }: { sesion: Sesion<Respuestas> }) {
  const guardado = useRef(false);
  const [fin, setFin] = useState<Sesion<Respuestas> | null>(null);

  useEffect(() => {
    if (guardado.current || sesion.terminada) {
      if (sesion.finalizadaEn) setFin(sesion);
      return;
    }
    guardado.current = true;
    const r = calificarPapi(sesion.respuestas);
    const next = finalizarSesion(sesion, r, interpretarPapi(r));
    setFin(next);
  }, [sesion]);

  if (!fin?.finalizadaEn) return null;

  return (
    <ConfirmacionPrueba
      instrumento="papi"
      participante={fin.participante}
      finalizadaEn={fin.finalizadaEn}
    />
  );
}
