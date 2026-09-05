"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/admin/Card";
import type { LiveClass } from "@/db/schema";
import s from "../clases-vivo.module.css";

export default function LiveClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [liveClass, setLiveClass] = useState<LiveClass | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/live-classes/${id}`);
        if (res.ok) {
          const data = await res.json();
          setLiveClass(data.liveClass);
        }
      } catch (error) {
        console.error(error);
      }
      setLoading(false);
    }
    void load();
  }, [id]);

  if (loading) return <p className={s.muted}>Cargando…</p>;
  if (!liveClass) {
    return (
      <Card>
        <p>Clase no encontrada</p>
        <Link href="/admin/clases-vivo">← Volver</Link>
      </Card>
    );
  }

  return (
    <div className={s.container}>
      <PageHeader
        title={liveClass.title}
        subtitle={`Estado: ${liveClass.status} · Provider: ${liveClass.provider ?? "none"}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Clases en Vivo", href: "/admin/clases-vivo" },
          { label: liveClass.title },
        ]}
        action={
          <Link href={`/admin/clases-vivo/${id}/sala`} className="btn btn-primary">
            Abrir sala
          </Link>
        }
      />

      <div className={s.grid}>
        <Card>
          <h3>Detalles</h3>
          <p>
            <strong>Programada:</strong>{" "}
            {new Date(liveClass.scheduledAt).toLocaleString("es-MX")}
          </p>
          <p>
            <strong>Duración:</strong> {liveClass.durationMinutes} min
          </p>
          <p>
            <strong>Sala:</strong> {liveClass.roomUrl ?? liveClass.dailyRoomUrl ?? "Sin URL aún"}
          </p>
          <p>
            <strong>Grabación:</strong> {liveClass.recordingUrl ?? "Pendiente"}
          </p>
        </Card>

        <Card>
          <h3>Asistencia</h3>
          <p className={s.muted}>
            Stub listo: la tabla <code>live_class_attendances</code> ya existe. Cuando se active
            Jitsi/Daily, aquí se listarán ingresos y tiempo en sala.
          </p>
          <ul className={s.attendanceStub}>
            <li>Sin registros todavía</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
