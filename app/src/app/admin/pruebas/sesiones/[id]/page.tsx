"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CleaverGraficas } from "@/app/psycotest/cleaver/CleaverGraficas";
import { MabeGraficas } from "@/app/psycotest/mabe/MabeGraficas";
import { MabeCalificacion } from "@/app/psycotest/mabe/MabeCalificacion";
import { PapiGraficas } from "@/app/psycotest/papi/PapiGraficas";
import { HartmanGraficas } from "@/app/psycotest/hartman/HartmanGraficas";
import { HartmanCalificacion } from "@/app/psycotest/hartman/HartmanCalificacion";
import { calificarPapi, type Respuestas } from "@/lib/papi";
import { calificarHartman } from "@/lib/hartman";
import { calificarMabe, type RespuestasMabe, type ResultadoMabe } from "@/lib/mabe";
import { calificarCleaver, type RespuestasCleaver, type ResultadoCleaver } from "@/lib/cleaver";
import { asCleaverPuesto, type ResultadoCleaverJob } from "@/lib/cleaver-job";
import {
  dbSessionToSesion,
  fetchJobProfile,
  fetchJobProfiles,
  fetchSession,
  type JobProfileRow,
} from "@/lib/api-client";
import { actualizarSesionServidor } from "@/lib/persist-server";
import {
  actualizarSesion,
  obtenerSesion,
  type Sesion,
} from "@/lib/storage";
import { InterpretacionPanel } from "@/components/admin/InterpretacionPanel";
import { RespuestasPanel } from "@/components/admin/RespuestasPanel";
import s from "../../../admin.module.css";

export default function AdminDetallePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [sesion, setSesion] = useState<Sesion<unknown, unknown> | null>(null);
  const [notas, setNotas] = useState("");
  const [tab, setTab] = useState<"calif" | "resp" | "interp">("calif");
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<JobProfileRow[]>([]);
  const [puestoActivo, setPuestoActivo] = useState<JobProfileRow | null>(null);
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    let cancel = false;
    async function load() {
      setLoading(true);
      const [remota, jobs] = await Promise.all([fetchSession(id), fetchJobProfiles()]);
      if (cancel) return;
      setProfiles(jobs.filter((p) => asCleaverPuesto(p.cleaverPuesto)?.resultado?.completo));
      if (remota) {
        const mapped = dbSessionToSesion(remota);
        setSesion(mapped);
        setNotas(mapped.notasPsicologo ?? "");
        if (mapped.jobProfileId) {
          const jp =
            jobs.find((p) => p.id === mapped.jobProfileId) ??
            (await fetchJobProfile(mapped.jobProfileId));
          if (!cancel) setPuestoActivo(jp);
        } else {
          setPuestoActivo(null);
        }
        setLoading(false);
        return;
      }
      const local = obtenerSesion(id);
      setSesion(local);
      setNotas(local?.notasPsicologo ?? "");
      setLoading(false);
    }
    load();
    return () => {
      cancel = true;
    };
  }, [id]);

  if (loading) {
    return (
      <main className={s.main}>
        <div className={s.wrap}>
          <p className={s.muted}>Cargando sesión…</p>
        </div>
      </main>
    );
  }

  if (!sesion) {
    return (
      <main className={s.main}>
        <div className={s.wrap}>
          <p>Sesión no encontrada.</p>
          <Link href="/admin" className="btn">
            Volver al panel
          </Link>
        </div>
      </main>
    );
  }

  const ses = sesion;

  async function guardarNotas() {
    await actualizarSesionServidor(ses.id, { notasPsicologo: notas, aprobada: false });
    const next = actualizarSesion(ses.id, { notasPsicologo: notas, aprobada: false });
    if (next) setSesion(next);
  }

  async function aprobar() {
    await actualizarSesionServidor(ses.id, { notasPsicologo: notas, aprobada: true });
    const next = actualizarSesion(ses.id, { notasPsicologo: notas, aprobada: true });
    if (next) setSesion(next);
  }

  async function vincularPuesto(jobProfileId: string | null) {
    setLinking(true);
    const ok = await actualizarSesionServidor(ses.id, { jobProfileId });
    setLinking(false);
    if (!ok) return;
    const next = actualizarSesion(ses.id, { jobProfileId: jobProfileId ?? undefined });
    if (next) setSesion({ ...next, jobProfileId: jobProfileId ?? undefined });
    else setSesion({ ...ses, jobProfileId: jobProfileId ?? undefined });
    if (jobProfileId) {
      const jp =
        profiles.find((p) => p.id === jobProfileId) ?? (await fetchJobProfile(jobProfileId));
      setPuestoActivo(jp);
    } else {
      setPuestoActivo(null);
    }
  }

  const titulo = ses.participante;
  const flags = ses.validityFlags ?? [];
  const cleaverPuesto = asCleaverPuesto(puestoActivo?.cleaverPuesto ?? null);

  return (
    <main className={s.main}>
      <div className={s.wrap}>
        <nav className={s.crumb}>
          <Link href="/admin">Panel</Link>
          <span>/</span>
          <span>{titulo}</span>
        </nav>

        <header className={s.detailHead}>
          <div>
            <span className={s.badge} data-i={ses.instrumento}>
              {ses.instrumento.toUpperCase()}
            </span>
            <h1>{titulo}</h1>
            <p className={s.muted}>
              {[ses.puesto, ses.empresa].filter(Boolean).join(" · ")}
              {ses.aprobada && <span className={s.approved}> · Informe validado</span>}
            </p>
          </div>
          <button type="button" className="btn" onClick={() => router.back()}>
            Volver
          </button>
        </header>

        {ses.instrumento === "cleaver" && (
          <div className={s.jobLinkBox}>
            <label>
              Factor Humano (Análisis del Trabajo)
              <select
                value={ses.jobProfileId ?? ""}
                disabled={linking}
                onChange={(e) => void vincularPuesto(e.target.value || null)}
              >
                <option value="">Sin perfil de puesto</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.titulo}
                    {p.empresa ? ` · ${p.empresa}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <Link href="/admin/pruebas/perfiles" className="btn btn-sm">
              Gestionar perfiles
            </Link>
          </div>
        )}

        {flags.length > 0 && (
          <div className={s.alertBox} role="alert">
            <strong>Alertas de validez</strong>
            <ul>
              {flags.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        )}

        <div className={s.tabs}>
          {(
            [
              ["calif", "Calificación"],
              ["resp", "Respuestas"],
              ["interp", "Interpretación"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              className={tab === k ? s.tabOn : s.tab}
              onClick={() => setTab(k)}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "calif" && (
          <DetalleCalificacion
            sesion={ses}
            puestoResultado={cleaverPuesto?.resultado}
            puestoTitulo={puestoActivo?.titulo}
          />
        )}

        {tab === "resp" && (
          <div className={s.respBox}>
            <RespuestasPanel sesion={ses} />
          </div>
        )}

        {tab === "interp" && (
          <InterpretacionPanel
            sesion={ses}
            notas={notas}
            setNotas={setNotas}
            onGuardar={guardarNotas}
            onAprobar={aprobar}
          />
        )}
      </div>
    </main>
  );
}

function DetalleCalificacion({
  sesion,
  puestoResultado,
  puestoTitulo,
}: {
  sesion: Sesion<unknown, unknown>;
  puestoResultado?: ResultadoCleaverJob;
  puestoTitulo?: string;
}) {
  if (sesion.instrumento === "papi") {
    const resp = sesion.respuestas as Respuestas;
    const cal = sesion.calificacion
      ? (sesion.calificacion as ReturnType<typeof calificarPapi>)
      : calificarPapi(resp);
    return (
      <div>
        <PapiGraficas
          cal={cal}
          nombre={sesion.participante}
          puesto={sesion.puesto}
          empresa={sesion.empresa}
        />
      </div>
    );
  }

  if (sesion.instrumento === "hartman") {
    const resp = sesion.respuestas as { parteI: number[]; parteII: number[] };
    const cal = sesion.calificacion
      ? (sesion.calificacion as ReturnType<typeof calificarHartman>)
      : calificarHartman(resp.parteI, resp.parteII);
    return (
      <div>
        <HartmanCalificacion cal={cal} />
        <HartmanGraficas cal={cal} />
      </div>
    );
  }

  if (sesion.instrumento === "mabe") {
    const resp = sesion.respuestas as RespuestasMabe;
    const cal = (sesion.calificacion as ResultadoMabe) ?? calificarMabe(resp);
    return (
      <div className={s.mabeCalif}>
        <MabeGraficas
          procPuesto={cal.procPuesto.cuadrantes}
          procPersona={cal.procPersona.cuadrantes}
          valPuesto={cal.valPuesto.valores}
          valPersona={cal.valPersona.valores}
          brechas={cal.brechas}
          combinaciones={cal.combinaciones}
        />
        <MabeCalificacion resultado={cal} />
      </div>
    );
  }

  if (sesion.instrumento === "cleaver") {
    const resp = sesion.respuestas as RespuestasCleaver;
    const cal =
      (sesion.calificacion as ResultadoCleaver) ?? calificarCleaver(resp);
    return (
      <div>
        <CleaverGraficas
          cal={cal}
          puesto={puestoResultado}
          puestoTitulo={puestoTitulo}
        />
      </div>
    );
  }

  return null;
}
