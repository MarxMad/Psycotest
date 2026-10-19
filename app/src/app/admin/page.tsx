"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  FlaskConical,
  GraduationCap,
  Video,
  TrendingUp,
  Users,
  DollarSign,
  ArrowRight,
  Download,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { Card, CardHeader } from "@/components/admin/Card";
import { EmptyState } from "@/components/admin/EmptyState";
import { MANUAL_GUIA_PSICOLOGO } from "@/lib/manuales";
import { haceCuanto } from "@/lib/formato";
import s from "./dashboard.module.css";

interface DashboardStats {
  pruebas: { total: number; pendientes: number };
  cursos: { total: number; estudiantes: number };
  clasesVivo: { programadas: number; hoy: number };
  ingresos: { mes: number; total: number };
  usuarios: { total: number };
}

interface ActividadItem {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  createdAt: string;
  userNombre: string | null;
}

const ACCION_LABEL: Record<string, string> = {
  create: "creó",
  update: "actualizó",
  delete: "eliminó",
  login: "inició sesión en",
  approve: "aprobó",
};

const ENTIDAD_LABEL: Record<string, string> = {
  channel_page: "una página pública",
  course: "un curso",
  access_code: "un código de acceso",
  session: "una sesión de evaluación",
  user: "un usuario",
  coupon: "un cupón",
  live_class: "una clase en vivo",
  expediente: "un expediente",
  job_profile: "un perfil de puesto",
};

function describirActividad(a: ActividadItem): string {
  const quien = a.userNombre ?? "Alguien";
  const verbo = ACCION_LABEL[a.action] ?? a.action;
  const que = ENTIDAD_LABEL[a.entity] ?? a.entity;
  return `${quien} ${verbo} ${que}`;
}



export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [actividad, setActividad] = useState<ActividadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    fetch("/api/admin/stats")
      .then(async (r) => {
        if (!r.ok) throw new Error("No se pudieron cargar las estadísticas");
        return r.json();
      })
      .then((data) => {
        if (!vivo) return;
        setStats(data.stats);
        setActividad(data.actividad ?? []);
      })
      .catch((e: Error) => vivo && setError(e.message))
      .finally(() => vivo && setLoading(false));
    return () => {
      vivo = false;
    };
  }, []);

  if (loading) {
    return (
      <div className={s.loading}>
        <div className={s.spinner} />
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className={s.dashboard}>
      {error && <div className={s.errorBanner}>{error}</div>}
      <PageHeader
        title="Dashboard"
        subtitle="Vista general de tu plataforma"
        breadcrumbs={[{ label: "Dashboard" }]}
        action={
          <a
            href={MANUAL_GUIA_PSICOLOGO.apiHref}
            className="btn"
            download={MANUAL_GUIA_PSICOLOGO.filename}
          >
            <Download size={16} />
            Descargar manual
          </a>
        }
      />

      {/* Stats Grid */}
      <div className={s.statsGrid}>
        <StatCard
          label="Pruebas Psicométricas"
          value={stats?.pruebas.total || 0}
          icon={<FlaskConical size={24} />}
          color="blue"
        />
        <StatCard
          label="Estudiantes Activos"
          value={stats?.cursos.estudiantes || 0}
          icon={<Users size={24} />}
          color="green"
        />
        <StatCard
          label="Clases Programadas"
          value={stats?.clasesVivo.programadas || 0}
          icon={<Video size={24} />}
          color="purple"
        />
        <StatCard
          label="Ingresos del Mes"
          value={`$${((stats?.ingresos.mes || 0) / 100).toLocaleString()}`}
          icon={<DollarSign size={24} />}
          color="orange"
        />
      </div>

      {/* Quick Actions */}
      <div className={s.sectionsGrid}>
        <Card>
          <CardHeader
            title="Pruebas Psicométricas"
            subtitle="Gestiona evaluaciones y resultados"
            action={
              <Link href="/admin/pruebas" className="btn btn-sm">
                Ver todas
                <ArrowRight size={16} />
              </Link>
            }
          />
          <div className={s.sectionContent}>
            {stats?.pruebas.pendientes ? (
              <div className={s.statRow}>
                <div className={s.statLabel}>
                  <FlaskConical size={16} />
                  Pendientes de revisión
                </div>
                <div className={s.statValue}>{stats.pruebas.pendientes}</div>
              </div>
            ) : (
              <p className={s.noData}>No hay pruebas pendientes</p>
            )}
            <Link href="/admin/pruebas/codigos" className={s.linkAction}>
              Gestionar códigos de acceso →
            </Link>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Cursos"
            subtitle="Plataforma de educación online"
            action={
              <Link href="/admin/cursos" className="btn btn-sm">
                Ver todos
                <ArrowRight size={16} />
              </Link>
            }
          />
          <div className={s.sectionContent}>
            {stats?.cursos.total === 0 ? (
              <EmptyState
                icon={<GraduationCap size={32} />}
                title="Sin cursos aún"
                description="Crea tu primer curso para empezar"
                action={
                  <Link href="/admin/cursos/crear" className="btn btn-primary">
                    Crear Curso
                  </Link>
                }
              />
            ) : (
              <div className={s.statRow}>
                <div className={s.statLabel}>
                  <GraduationCap size={16} />
                  Cursos publicados
                </div>
                <div className={s.statValue}>{stats?.cursos.total || 0}</div>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Clases en Vivo"
            subtitle="Sistema de videoclases"
            action={
              <Link href="/admin/clases-vivo" className="btn btn-sm">
                Ver todas
                <ArrowRight size={16} />
              </Link>
            }
          />
          <div className={s.sectionContent}>
            {stats?.clasesVivo.programadas === 0 ? (
              <EmptyState
                icon={<Video size={32} />}
                title="Sin clases programadas"
                description="Programa tu primera clase en vivo"
                action={
                  <Link href="/admin/clases-vivo/programar" className="btn btn-primary">
                    Programar Clase
                  </Link>
                }
              />
            ) : (
              <>
                <div className={s.statRow}>
                  <div className={s.statLabel}>
                    <Video size={16} />
                    Programadas
                  </div>
                  <div className={s.statValue}>{stats?.clasesVivo.programadas || 0}</div>
                </div>
                {stats?.clasesVivo.hoy && stats.clasesVivo.hoy > 0 && (
                  <div className={s.highlight}>
                    <span className={s.highlightDot} />
                    {stats.clasesVivo.hoy} clase{stats.clasesVivo.hoy > 1 ? "s" : ""} hoy
                  </div>
                )}
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Actividad reciente — registro de auditoría */}
      <Card>
        <CardHeader title="Actividad Reciente" subtitle="Últimas acciones en la plataforma" />
        {actividad.length === 0 ? (
          <EmptyState
            icon={<TrendingUp size={32} />}
            title="Sin actividad reciente"
            description="La actividad aparecerá aquí cuando empieces a usar la plataforma"
          />
        ) : (
          <ul className={s.activityList}>
            {actividad.map((a) => (
              <li key={a.id} className={s.activityItem}>
                <span className={s.activityDot} aria-hidden />
                <span className={s.activityText}>{describirActividad(a)}</span>
                <time className={s.activityTime} dateTime={a.createdAt}>
                  {haceCuanto(a.createdAt)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
