"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/admin/Card";
import type { LiveClass } from "@/db/schema";
import s from "../clases-vivo.module.css";

type AttendanceRow = {
  id: string;
  userId: string;
  joinedAt: string;
  leftAt: string | null;
  durationSeconds: number | null;
  connectedSeconds?: number | null;
  presencePercent?: number | null;
  nombre: string | null;
  email: string | null;
};

/** Una fila por persona: las clases antiguas guardaban una por cada entrada. */
function porPersona(filas: AttendanceRow[]): AttendanceRow[] {
  const mapa = new Map<string, AttendanceRow>();
  for (const f of filas) {
    const previa = mapa.get(f.userId);
    if (!previa) {
      mapa.set(f.userId, { ...f });
      continue;
    }
    previa.joinedAt = f.joinedAt < previa.joinedAt ? f.joinedAt : previa.joinedAt;
    previa.leftAt = !previa.leftAt || !f.leftAt ? null : f.leftAt > previa.leftAt ? f.leftAt : previa.leftAt;
    previa.connectedSeconds = (previa.connectedSeconds ?? 0) + (f.connectedSeconds ?? 0);
    previa.presencePercent = Math.min(100, (previa.presencePercent ?? 0) + (f.presencePercent ?? 0));
    previa.durationSeconds = null;
  }
  return [...mapa.values()].sort((a, b) => (b.presencePercent ?? 0) - (a.presencePercent ?? 0));
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LiveClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [liveClass, setLiveClass] = useState<LiveClass | null>(null);
  const [attendances, setAttendances] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/live-classes/${id}`);
      if (!res.ok) {
        setError("No se pudo cargar la clase");
        setLiveClass(null);
        return;
      }
      const data = await res.json();
      setLiveClass(data.liveClass);
      setAttendances(porPersona(data.attendances || []));
      setError(null);
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(status: "completed" | "cancelled") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/live-classes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "No se pudo actualizar el estado");
        return;
      }
      const data = await res.json();
      setLiveClass(data.liveClass);
    } finally {
      setBusy(false);
    }
  }

  const ESTADO: Record<LiveClass["status"], string> = {
    scheduled: "Programada",
    live: "En curso",
    completed: "Terminada",
    cancelled: "Cancelada",
  };

  if (loading) return <p className={s.muted}>Cargando…</p>;
  if (!liveClass) {
    return (
      <Card>
        <p>{error || "Clase no encontrada"}</p>
        <Link href="/admin/clases-vivo">← Volver</Link>
      </Card>
    );
  }

  const abierta = liveClass.status === "scheduled" || liveClass.status === "live";

  return (
    <div className={s.container}>
      <PageHeader
        title={liveClass.title}
        subtitle={`${ESTADO[liveClass.status]} · ${fmt(liveClass.scheduledAt)}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Clases en Vivo", href: "/admin/clases-vivo" },
          { label: liveClass.title },
        ]}
        action={
          <div className={s.actions}>
            {liveClass.status === "scheduled" && (
              <button
                type="button"
                className="btn"
                disabled={busy}
                onClick={() => void setStatus("cancelled")}
              >
                Cancelar clase
              </button>
            )}
            {liveClass.status === "live" && (
              <button
                type="button"
                className="btn"
                disabled={busy}
                onClick={() => void setStatus("completed")}
                title="Cierra la sala para todos, también las salas de división"
              >
                Terminar para todos
              </button>
            )}
            {abierta && (
              <Link href={`/admin/clases-vivo/${id}/sala`} className="btn btn-primary">
                {liveClass.status === "live" ? "Volver a la sala" : "Abrir la sala"}
              </Link>
            )}
          </div>
        }
      />

      {error && (
        <Card>
          <p>{error}</p>
        </Card>
      )}

      <div className={s.grid}>
        <Card>
          <h3>Detalles</h3>
          <p>
            <strong>Programada:</strong> {fmt(liveClass.scheduledAt)}
          </p>
          <p>
            <strong>Duración:</strong> {liveClass.durationMinutes} min
          </p>
          <p>
            <strong>Curso:</strong> {liveClass.courseId || "Sin curso asociado"}
          </p>
          <p>
            <strong>Sala:</strong> sala propia de la plataforma. Los alumnos inscritos entran desde
            Mi cuenta → En vivo, 15 minutos antes de la hora.
          </p>
          <p>
            <strong>Grabación:</strong>{" "}
            {liveClass.recordingUrl ? (
              <a href={liveClass.recordingUrl} target="_blank" rel="noreferrer">
                Ver grabación
              </a>
            ) : (
              "Sin grabación"
            )}
          </p>
        </Card>

        <Card>
          <h3>Asistencia ({attendances.length})</h3>
          <p className={s.muted}>
            La presencia es el tiempo conectado a la sala frente a la duración de la clase; es lo
            que se reporta para CONOCER.
          </p>
          {attendances.length === 0 ? (
            <p className={s.muted}>Aún no hay ingresos a la sala.</p>
          ) : (
            <ul className={s.attendanceList}>
              {attendances.map((row) => (
                <li key={row.id}>
                  <strong>{row.nombre || row.email || row.userId}</strong>
                  <span className={s.muted}>
                    {" "}
                    · entró {fmt(row.joinedAt)}
                    {row.leftAt ? ` · salió ${fmt(row.leftAt)}` : " · en sala"}
                    {row.durationSeconds != null
                      ? ` · ${Math.round(row.durationSeconds / 60)} min`
                      : ""}
                    {row.connectedSeconds != null
                      ? ` · conectado ${Math.round(row.connectedSeconds / 60)} min`
                      : ""}
                    {row.presencePercent != null ? ` · presencia ${row.presencePercent}%` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
