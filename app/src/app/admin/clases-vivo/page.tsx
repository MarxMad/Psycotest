"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Video, Plus, Calendar, Archive } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/admin/Card";
import { EmptyState } from "@/components/admin/EmptyState";
import type { LiveClass } from "@/db/schema";
import s from "./clases-vivo.module.css";

function fmt(iso: string) {
  return new Date(iso).toLocaleString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ClasesVivoPage() {
  const [clases, setClases] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/live-classes");
        if (res.ok) {
          const data = await res.json();
          setClases(data.classes || []);
        }
      } catch (error) {
        console.error("Error al cargar clases:", error);
      }
      setLoading(false);
    }
    load();
  }, []);

  const stats = {
    programadas: clases.filter((c) => c.status === "scheduled").length,
    enVivo: clases.filter((c) => c.status === "live").length,
    completadas: clases.filter((c) => c.status === "completed").length,
  };

  return (
    <div className={s.container}>
      <PageHeader
        title="Clases en Vivo"
        subtitle="Sistema de videoclases con transmisión en tiempo real"
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Clases en Vivo" }]}
        action={
          <div className={s.actions}>
            <Link href="/admin/clases-vivo/grabaciones" className="btn">
              <Archive size={16} />
              Grabaciones
            </Link>
            <Link href="/admin/clases-vivo/programar" className="btn btn-primary">
              <Plus size={16} />
              Programar Clase
            </Link>
          </div>
        }
      />

      <div className={s.stats}>
        <div className={s.stat}>
          <Calendar size={18} />
          <span className={s.statN}>{stats.programadas}</span>
          <span>Programadas</span>
        </div>
        {stats.enVivo > 0 && (
          <div className={`${s.stat} ${s.statLive}`}>
            <div className={s.liveDot} />
            <span className={s.statN}>{stats.enVivo}</span>
            <span>En Vivo Ahora</span>
          </div>
        )}
        <div className={s.stat}>
          <span className={s.statN}>{stats.completadas}</span>
          <span>Completadas</span>
        </div>
      </div>

      {loading ? (
        <Card>
          <div className={s.loading}>
            <div className={s.spinner} />
            <p>Cargando clases...</p>
          </div>
        </Card>
      ) : clases.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Video size={48} />}
            title="Sin clases programadas"
            description="Programa tu primera clase en vivo para comenzar a impartir sesiones online"
            action={
              <Link href="/admin/clases-vivo/programar" className="btn btn-primary btn-lg">
                <Plus size={18} />
                Programar Primera Clase
              </Link>
            }
          />
        </Card>
      ) : (
        <Card padding="none">
          <div className={s.tableShell}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Fecha y hora</th>
                  <th>Duración</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {clases.map((clase) => (
                  <tr key={clase.id}>
                    <td>
                      <strong>{clase.title}</strong>
                    </td>
                    <td className={s.muted}>{fmt(clase.scheduledAt)}</td>
                    <td className={s.muted}>{clase.durationMinutes} min</td>
                    <td>
                      {clase.status === "scheduled" && (
                        <span className={s.badge}>Programada</span>
                      )}
                      {clase.status === "live" && (
                        <span className={`${s.badge} ${s.badgeLive}`}>
                          <span className={s.liveDot} />
                          En Vivo
                        </span>
                      )}
                      {clase.status === "completed" && (
                        <span className={`${s.badge} ${s.badgeCompleted}`}>Completada</span>
                      )}
                      {clase.status === "cancelled" && (
                        <span className={`${s.badge} ${s.badgeCancelled}`}>Cancelada</span>
                      )}
                    </td>
                    <td>
                      {clase.status === "live" ? (
                        <Link
                          href={`/admin/clases-vivo/${clase.id}/sala`}
                          className={`btn btn-sm ${s.btnLive}`}
                        >
                          Entrar a la Sala →
                        </Link>
                      ) : (
                        <Link href={`/admin/clases-vivo/${clase.id}`} className="btn btn-sm">
                          Ver Detalles
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
