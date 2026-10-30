"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AmbientBackground } from "@/components/AmbientBackground";
import { BackLink } from "@/components/ui/BackLink";
import { PhaseTransition } from "@/components/ui/PhaseTransition";
import { ProgressStrip } from "@/components/ui/ProgressStrip";
import { ConfirmacionPrueba } from "@/components/ConfirmacionPrueba";
import { FormularioSeccion } from "@/components/socioeconomico/Formulario";
import { useApplicantSession } from "@/lib/applicant-client";
import {
  DATOS_RECABADOS,
  SECCIONES_CANDIDATO,
  TRANSFERENCIA,
  textoAviso,
  type ValoresSeccion,
} from "@/data/socioeconomico";
import {
  faltantes,
  respuestasVacias,
  type AvisoAceptado,
  type RespuestasSocioeconomico,
} from "@/lib/socioeconomico";
import { enviarAplicacionServidor } from "@/lib/persist-server";
import { borrarBorrador, cargarBorrador, guardarBorrador, nuevaSesion, type Sesion } from "@/lib/storage";
import s from "./socioeconomico.module.css";

type Fase = "aviso" | "llenando" | "revision" | "fin";
type SesionSE = Sesion<RespuestasSocioeconomico>;

const TOTAL = SECCIONES_CANDIDATO.length;

/**
 * La parte del candidato del Estudio Socioeconómico.
 *
 * Primero el aviso de privacidad —sin aceptarlo no se recaba nada—, luego las
 * secciones una por una con guardado automático en el navegador, y al final
 * una revisión antes de enviar. La visita y la verificación de referencias
 * las hace después el investigador desde el panel.
 */
export default function SocioeconomicoPage() {
  const { session: aplicante } = useApplicantSession();
  const [fase, setFase] = useState<Fase>("aviso");
  const [sesion, setSesion] = useState<SesionSE | null>(null);
  const [previa, setPrevia] = useState<SesionSE | null>(null);
  const [i, setI] = useState(0);
  const [avisoNombre, setAvisoNombre] = useState("");
  const [transferencia, setTransferencia] = useState<AvisoAceptado["transferencia"] | "">("");
  const [aviso, setAviso] = useState("");
  const [faltan, setFaltan] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [finalizadaEn, setFinalizadaEn] = useState<string | null>(null);

  useEffect(() => {
    const guardada = cargarBorrador<RespuestasSocioeconomico>("socioeconomico");
    if (guardada && !guardada.terminada) setPrevia(guardada);
  }, []);

  useEffect(() => {
    if (aplicante && !avisoNombre) setAvisoNombre(aplicante.nombre);
  }, [aplicante, avisoNombre]);

  const persistir = useCallback((next: SesionSE) => {
    setSesion(next);
    guardarBorrador(next);
  }, []);

  function aceptarAviso() {
    if (!avisoNombre.trim() || !transferencia) {
      setAviso("Escribe tu nombre completo y elige una opción sobre la transferencia de tus datos.");
      return;
    }
    const nombre = aplicante?.nombre ?? avisoNombre.trim();
    const r = respuestasVacias();
    r.aviso = { nombre: avisoNombre.trim(), transferencia, fecha: new Date().toISOString() };
    r.candidato.generales = { nombre };
    const nueva = nuevaSesion<RespuestasSocioeconomico>("socioeconomico", nombre, r);
    if (aplicante?.puesto) nueva.puesto = aplicante.puesto;
    if (aplicante?.empresa) nueva.empresa = aplicante.empresa;
    persistir(nueva);
    setI(0);
    setFase("llenando");
  }

  function retomar(p: SesionSE) {
    setSesion(p);
    const siguiente = SECCIONES_CANDIDATO.findIndex((sec) => faltantes(sec, p.respuestas.candidato[sec.id]).length > 0);
    setI(siguiente === -1 ? 0 : siguiente);
    setFase(siguiente === -1 ? "revision" : "llenando");
  }

  function cambiar(valores: ValoresSeccion) {
    if (!sesion) return;
    const sec = SECCIONES_CANDIDATO[i];
    persistir({
      ...sesion,
      actualizada: new Date().toISOString(),
      respuestas: { ...sesion.respuestas, candidato: { ...sesion.respuestas.candidato, [sec.id]: valores } },
    });
    if (faltan.length) setFaltan([]);
  }

  function irA(idx: number) {
    setFaltan([]);
    setI(idx);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function siguiente() {
    if (!sesion) return;
    const f = faltantes(SECCIONES_CANDIDATO[i], sesion.respuestas.candidato[SECCIONES_CANDIDATO[i].id]);
    if (f.length) {
      setFaltan(f);
      return;
    }
    if (i < TOTAL - 1) irA(i + 1);
    else {
      setFase("revision");
      window.scrollTo({ top: 0 });
    }
  }

  async function enviar() {
    if (!sesion) return;
    setEnviando(true);
    setError("");
    const ok = await enviarAplicacionServidor({ ...sesion, terminada: true });
    setEnviando(false);
    if (!ok) {
      setError("No se pudo enviar. Revisa tu conexión e inténtalo de nuevo: tus respuestas siguen guardadas.");
      return;
    }
    // Ya está en el servidor. No se deja copia en este navegador: son datos sensibles
    // y la computadora puede ser compartida.
    borrarBorrador("socioeconomico");
    setFinalizadaEn(new Date().toISOString());
    setFase("fin");
  }

  if (fase === "fin" && sesion && finalizadaEn) {
    return (
      <ConfirmacionPrueba
        instrumento="socioeconomico"
        participante={sesion.participante}
        finalizadaEn={finalizadaEn}
        mensaje="Tu información quedó registrada. El investigador se pondrá en contacto contigo para agendar la visita domiciliaria."
      />
    );
  }

  if (fase === "aviso") {
    const t = textoAviso(aplicante?.empresa);
    return (
      <>
        <AmbientBackground />
        <main className={s.main}>
          <PhaseTransition phaseKey="aviso">
            <div className={s.intro}>
              <BackLink href="/evaluacion/acceso" />
              <span className="eyebrow">Estudio Socioeconómico</span>
              <h1>Antes de empezar</h1>
              <p className={s.lead}>
                Te pediremos datos de tu familia, tu situación económica, tu salud, tu escolaridad y tus
                referencias. Toma unos 40 minutos; puedes cerrar y retomar después en este mismo navegador.
                Después, un investigador te visitará y verificará tus referencias.
              </p>

              {previa && (
                <div className={s.aviso} role="status">
                  <p>
                    Tienes un estudio sin terminar de <strong>{previa.participante}</strong>.
                  </p>
                  <div className={s.acciones}>
                    <button type="button" className="btn btn-primary" onClick={() => retomar(previa)}>
                      Retomar donde me quedé
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => {
                        borrarBorrador("socioeconomico");
                        setPrevia(null);
                      }}
                    >
                      Descartar y empezar de nuevo
                    </button>
                  </div>
                </div>
              )}

              <section className={s.privacidad} aria-labelledby="aviso-titulo">
                <h2 id="aviso-titulo">Aviso de privacidad</h2>
                <p>{t.apertura}</p>
                <ul className={s.datosLista}>
                  {DATOS_RECABADOS.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
                <p>{t.sensibles}</p>
                <p>{t.consentimiento}</p>
                <p>{t.derechos}</p>
                <p>{t.contacto}</p>

                <fieldset className={s.transferencia}>
                  <legend>Transferencia de tus datos</legend>
                  {(Object.keys(TRANSFERENCIA) as (keyof typeof TRANSFERENCIA)[]).map((k) => (
                    <label key={k} className={s.radio}>
                      <input
                        type="radio"
                        name="transferencia"
                        checked={transferencia === k}
                        onChange={() => setTransferencia(k)}
                      />
                      {TRANSFERENCIA[k]}
                    </label>
                  ))}
                </fieldset>

                <label className={s.firma}>
                  Nombre completo (vale como tu firma)
                  <input
                    value={avisoNombre}
                    onChange={(e) => setAvisoNombre(e.target.value)}
                    autoComplete="name"
                    placeholder="Como aparece en tu identificación"
                  />
                </label>
                {aviso && <p className={s.error}>{aviso}</p>}
              </section>

              <div className={s.acciones}>
                <button type="button" className="btn btn-primary" onClick={aceptarAviso}>
                  Acepto el aviso y quiero empezar →
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

  if (!sesion) return null;
  const completas = SECCIONES_CANDIDATO.filter((sec) => faltantes(sec, sesion.respuestas.candidato[sec.id]).length === 0).length;

  if (fase === "revision") {
    const pendientes = SECCIONES_CANDIDATO.map((sec, idx) => ({
      sec,
      idx,
      f: faltantes(sec, sesion.respuestas.candidato[sec.id]),
    }));
    const listo = pendientes.every((p) => p.f.length === 0);
    return (
      <main className={s.main}>
        <ProgressStrip pct={(completas / TOTAL) * 100} accent="var(--socioeconomico)">
          <span>{sesion.participante}</span>
          <span>Revisión final</span>
        </ProgressStrip>
        <div className={s.contenido}>
          <span className="eyebrow">Revisión</span>
          <h1>¿Todo en orden?</h1>
          <p className={s.lead}>Revisa cada sección antes de enviar. Después ya no podrás modificarla.</p>
          <ol className={s.indice}>
            {pendientes.map(({ sec, idx, f }) => (
              <li key={sec.id} data-ok={f.length === 0 || undefined}>
                <button
                  type="button"
                  onClick={() => {
                    setFase("llenando");
                    irA(idx);
                  }}
                >
                  <span>{sec.titulo}</span>
                  <small>{f.length === 0 ? "Completa" : `Falta: ${f.slice(0, 3).join(", ")}${f.length > 3 ? "…" : ""}`}</small>
                </button>
              </li>
            ))}
          </ol>
          {error && <p className={s.error}>{error}</p>}
          <div className={s.acciones}>
            <button type="button" className="btn btn-primary" onClick={enviar} disabled={!listo || enviando}>
              {enviando ? "Enviando…" : "Enviar mi información"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  const sec = SECCIONES_CANDIDATO[i];

  return (
    <main className={s.main}>
      <ProgressStrip pct={(completas / TOTAL) * 100} accent="var(--socioeconomico)">
        <span>{sesion.participante}</span>
        <span className={s.guardado}>
          <i className={s.punto} /> Guardado en este navegador
        </span>
      </ProgressStrip>

      <PhaseTransition phaseKey={`sec-${i}`} className={s.contenido}>
        <span className="eyebrow">
          Sección {i + 1} de {TOTAL}
        </span>
        <h1>{sec.titulo}</h1>
        {sec.descripcion && <p className={s.lead}>{sec.descripcion}</p>}

        <FormularioSeccion seccion={sec} valores={sesion.respuestas.candidato[sec.id] ?? {}} onChange={cambiar} />

        {faltan.length > 0 && (
          <div className={s.faltan} role="alert">
            <strong>Para continuar, completa:</strong>
            <ul>
              {faltan.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        )}
      </PhaseTransition>

      <div className={s.controles}>
        <button type="button" className="btn" onClick={() => irA(Math.max(0, i - 1))} disabled={i === 0}>
          ← Anterior
        </button>
        <span className={s.pista}>Los campos con * son obligatorios</span>
        <button type="button" className="btn btn-primary" onClick={siguiente}>
          {i === TOTAL - 1 ? "Revisar y enviar →" : "Siguiente →"}
        </button>
      </div>
    </main>
  );
}
