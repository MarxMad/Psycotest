"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { MabeGraficas } from "@/app/mabe/MabeGraficas";
import { MabeCalificacion } from "@/app/mabe/MabeCalificacion";
import { PapiGraficas } from "@/app/papi/PapiGraficas";
import { HartmanGraficas } from "@/app/hartman/HartmanGraficas";
import { HartmanCalificacion } from "@/app/hartman/HartmanCalificacion";
import { calificarPapi, type Respuestas } from "@/lib/papi";
import { calificarHartman } from "@/lib/hartman";
import { calificarMabe, type RespuestasMabe, type ResultadoMabe } from "@/lib/mabe";
import { dbSessionToSesion, fetchSession } from "@/lib/api-client";
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

  useEffect(() => {
    let cancel = false;
    async function load() {
      setLoading(true);
      const remota = await fetchSession(id);
      if (cancel) return;
      if (remota) {
        const mapped = dbSessionToSesion(remota);
        setSesion(mapped);
        setNotas(mapped.notasPsicologo ?? "");
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

  const titulo = ses.participante;
  const flags = ses.validityFlags ?? [];

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

        {tab === "calif" && <DetalleCalificacion sesion={ses} />}

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

function DetalleCalificacion({ sesion }: { sesion: Sesion<unknown, unknown> }) {
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

  return null;
}
