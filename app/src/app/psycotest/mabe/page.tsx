"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AmbientBackground } from "@/components/AmbientBackground";
import { BackLink } from "@/components/ui/BackLink";
import { PhaseTransition } from "@/components/ui/PhaseTransition";
import { ProgressStrip } from "@/components/ui/ProgressStrip";
import {
  GRUPOS_MABE,
  MABE_ESCALA,
  calificarMabe,
  respuestasVaciasMabe,
  type RespuestasMabe,
} from "@/lib/mabe";
import { interpretarMabe } from "@/lib/informes";
import {
  borrarBorrador,
  cargarBorrador,
  finalizarSesion,
  guardarBorrador,
  nuevaSesion,
  type Sesion,
} from "@/lib/storage";
import { ConfirmacionPrueba } from "@/components/ConfirmacionPrueba";
import { useApplicantSession } from "@/lib/applicant-client";
import s from "./mabe.module.css";

type Fase = "intro" | "captura" | "resultado";

export default function MabePage() {
  const [fase, setFase] = useState<Fase>("intro");
  const [participante, setParticipante] = useState("");
  const [puesto, setPuesto] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [sesion, setSesion] = useState<Sesion<RespuestasMabe> | null>(null);
  const [grupoIdx, setGrupoIdx] = useState(0);
  const [previa, setPrevia] = useState<Sesion<RespuestasMabe> | null>(null);
  const { session: aplicante, loading: cargandoAcceso } = useApplicantSession();

  useEffect(() => {
    if (aplicante) {
      setParticipante(aplicante.nombre);
      if (aplicante.puesto) setPuesto(aplicante.puesto);
      if (aplicante.empresa) setEmpresa(aplicante.empresa);
    }
  }, [aplicante]);

  useEffect(() => {
    const g = cargarBorrador<RespuestasMabe>("mabe");
    if (g && !g.terminada) setPrevia(g);
  }, []);

  const respuestas = sesion?.respuestas ?? respuestasVaciasMabe();
  const grupo = GRUPOS_MABE[grupoIdx];
  const contestados = Object.values(respuestas).filter((v) => v >= 1 && v <= 5).length;
  const totalItems = GRUPOS_MABE.reduce((a, g) => a + g.items.length, 0);

  const persistir = useCallback((next: Sesion<RespuestasMabe>) => {
    setSesion(next);
    guardarBorrador(next);
  }, []);

  function iniciar() {
    const nueva = nuevaSesion<RespuestasMabe>(
      "mabe",
      participante || "Sin nombre",
      respuestasVaciasMabe(),
      { puesto, empresa },
    );
    persistir(nueva);
    setGrupoIdx(0);
    setFase("captura");
  }

  function retomar(prev: Sesion<RespuestasMabe>) {
    setSesion(prev);
    setParticipante(prev.participante);
    setPuesto(prev.puesto ?? "");
    setEmpresa(prev.empresa ?? "");
    setFase("captura");
  }

  function setValor(id: string, v: number) {
    if (!sesion) return;
    persistir({ ...sesion, respuestas: { ...sesion.respuestas, [id]: v } });
  }

  function terminar() {
    if (!sesion) return;
    const cal = calificarMabe(sesion.respuestas);
    if (!cal.completo) return;
    const interp = interpretarMabe(cal, sesion.participante, sesion.puesto);
    const fin = finalizarSesion(sesion, cal, interp);
    setSesion(fin);
    setFase("resultado");
  }

  if (fase === "intro") {
    return (
      <>
        <AmbientBackground />
        <main className={s.main}>
          <PhaseTransition phaseKey="intro">
            <div className={s.intro}>
              <BackLink />
              <span className="eyebrow">MABE</span>
              <h1>Managerial Behavior Evaluation</h1>
              <p className={s.lede}>
                Cuatro formularios como en el cuadernillo: <strong>puesto</strong> (proceso + valores) y{" "}
                <strong>persona</strong> (proceso + valores). La lectura clínica es la brecha entre ambos
                perfiles.
              </p>

              <div className={s.instructions}>
                <p>
                  <strong>Las 4 hojas del instrumento:</strong>
                </p>
                <ol className={s.hojaList}>
                  {GRUPOS_MABE.map((g, i) => (
                    <li key={g.id}>
                      <strong>{i + 1}.</strong> {g.title} — {g.items.length} reactivos
                    </li>
                  ))}
                </ol>
                <p>Escala común <strong>1–5</strong> por reactivo. Al terminar: <strong>calificación</strong> (fórmulas del manual) y después <strong>interpretación</strong> clínica.</p>
              </div>

              <div className={s.form}>
                <label>
                  Nombre del evaluado
                  <input
                    value={participante}
                    onChange={(e) => setParticipante(e.target.value)}
                    placeholder="Nombre completo"
                    readOnly={!!aplicante}
                  />
                </label>
                <label>
                  Puesto evaluado
                  <input
                    value={puesto}
                    onChange={(e) => setPuesto(e.target.value)}
                    placeholder="Ej. Gerente de ventas"
                  />
                </label>
                <label>
                  Empresa
                  <input
                    value={empresa}
                    onChange={(e) => setEmpresa(e.target.value)}
                    placeholder="Opcional"
                  />
                </label>
              </div>

              {previa && (
                <div className={s.resume}>
                  <p>
                    Hay una aplicación en curso de <strong>{previa.participante}</strong> (
                    {Object.values(previa.respuestas).filter((v) => v >= 1).length}/{totalItems} ítems).
                  </p>
                  <button type="button" className="btn btn-primary" onClick={() => retomar(previa)}>
                    Retomar
                  </button>
                </div>
              )}

              <div className={s.row}>
                <Link href="/psycotest" className="btn">
                  Volver
                </Link>
                <button type="button" className="btn btn-primary" onClick={iniciar}>
                  Iniciar captura
                </button>
              </div>
            </div>
          </PhaseTransition>
        </main>
      </>
    );
  }

  if (fase === "captura" && sesion && grupo) {
    const progGrupo = grupo.items.filter((it) => respuestas[it.id] >= 1).length;

    return (
      <main className={s.main}>
        <ProgressStrip pct={(contestados / totalItems) * 100} accent="var(--mabe)">
          <span>
            Hoja {grupoIdx + 1}/{GRUPOS_MABE.length} · {sesion.participante}
          </span>
          <span>
            {contestados} / {totalItems} reactivos
          </span>
        </ProgressStrip>
        <div className={s.capture}>
          <header className={s.captureHead}>
            <div>
              <span className="eyebrow">
                Hoja {grupoIdx + 1} de {GRUPOS_MABE.length}
              </span>
              <h1>{grupo.title}</h1>
              <p>{grupo.subtitle}</p>
            </div>
            <div className={s.meta}>
              <strong>{sesion.participante}</strong>
              {sesion.puesto && <span>{sesion.puesto}</span>}
            </div>
          </header>

          <div className={s.instrBlock}>
            {grupo.instrucciones.map((p) => (
              <p key={p}>{p}</p>
            ))}
            <div className={s.escala}>
              <span className={s.escalaTitulo}>Escala de importancia</span>
              <ul>
                {MABE_ESCALA.map((e) => (
                  <li key={e.valor}>
                    <strong>{e.valor}</strong> — {e.etiqueta}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className={s.progressWrap}>
            <div className={s.progressBar}>
              <div
                className={s.progressFill}
                style={{ width: `${(progGrupo / grupo.items.length) * 100}%` }}
              />
            </div>
            <span className={s.progressLabel}>
              {progGrupo} / {grupo.items.length} en esta hoja
            </span>
          </div>

          <div className={s.tabs}>
            {GRUPOS_MABE.map((g, i) => (
              <button
                key={g.id}
                type="button"
                className={i === grupoIdx ? s.tabActive : s.tab}
                onClick={() => setGrupoIdx(i)}
              >
                {i + 1}. {g.title.split(" ").slice(0, 2).join(" ")}
              </button>
            ))}
          </div>

          {grupo.secciones.map((sec) => (
            <section key={sec.id} className={s.seccion}>
              {grupo.secciones.length > 1 && <h2 className={s.seccionTitulo}>{sec.titulo}</h2>}
              <div className={s.grid}>
                {sec.items.map((item) => (
                  <div key={item.id} className={s.item}>
                    <div className={s.itemHead}>
                      <span className={s.itemN}>{item.numero}</span>
                      <p className={s.itemTexto}>{item.texto}</p>
                    </div>
                    <div className={s.scale} role="group" aria-label={`Calificar: ${item.texto}`}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          className={respuestas[item.id] === n ? s.scaleOn : s.scaleBtn}
                          onClick={() => setValor(item.id, n)}
                          aria-pressed={respuestas[item.id] === n}
                          title={MABE_ESCALA.find((e) => e.valor === n)?.etiqueta}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          <footer className={s.captureFoot}>
            <span>
              Esta hoja: {progGrupo}/{grupo.items.length}
            </span>
            <div className={s.row}>
              <button
                type="button"
                className="btn"
                disabled={grupoIdx === 0}
                onClick={() => setGrupoIdx((v) => v - 1)}
              >
                ← Hoja anterior
              </button>
              {grupoIdx < GRUPOS_MABE.length - 1 ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setGrupoIdx((v) => v + 1)}
                >
                  Siguiente hoja →
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={terminar}
                  disabled={contestados < totalItems}
                >
                  Enviar prueba →
                </button>
              )}
            </div>
          </footer>
        </div>
      </main>
    );
  }

  if (fase === "resultado" && sesion?.finalizadaEn) {
    return (
      <ConfirmacionPrueba
        instrumento="mabe"
        participante={sesion.participante}
        finalizadaEn={sesion.finalizadaEn}
      />
    );
  }

  return null;
}
