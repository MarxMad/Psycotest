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
  nombre: string | null;
  email: string | null;
};

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
      setAttendances(data.attendances || []);
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

  async function setStatus(status: "live" | "completed" | "cancelled") {
    setBusy(true);
    try {
      const res = await fetch(`/api/live-classes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ensureRoom: status === "live" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "No se pudo actualizar el estado");
        return;
      }
      const data = await res.json();
      setLiveClass(data.liveClass);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className={s.muted}>Cargando…</p>;
  if (!liveClass) {
    return (
      <Card>
        <p>{error || "Clase no encontrada"}</p>
        <Link href="/admin/clases-vivo">← Volver</Link>
      </Card>
    );
  }

  const roomUrl = liveClass.roomUrl || liveClass.dailyRoomUrl;

  return (
    <div className={s.container}>
      <PageHeader
        title={liveClass.title}
        subtitle={`Estado: ${liveClass.status} · Provider: ${liveClass.provider ?? "jitsi"}`}
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
                className="btn btn-primary"
                disabled={busy}
                onClick={() => void setStatus("live")}
              >
                Iniciar sesión
              </button>
            )}
            {liveClass.status === "live" && (
              <button
                type="button"
                className="btn"
                disabled={busy}
                onClick={() => void setStatus("completed")}
              >
                Finalizar
              </button>
            )}
            <Link href={`/admin/clases-vivo/${id}/sala`} className="btn btn-primary">
              Abrir sala
            </Link>
          </div>
        }
      />

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
            <strong>Sala:</strong>{" "}
            {roomUrl ? (
              <a href={roomUrl} target="_blank" rel="noreferrer">
                {roomUrl}
              </a>
            ) : (
              "Sin URL aún"
            )}
          </p>
          <p>
            <strong>Grabación:</strong> {liveClass.recordingUrl ?? "Pendiente"}
          </p>
        </Card>

        <Card>
          <h3>Asistencia ({attendances.length})</h3>
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
