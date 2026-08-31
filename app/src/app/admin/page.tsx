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
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { Card, CardHeader } from "@/components/admin/Card";
import { EmptyState } from "@/components/admin/EmptyState";
import s from "./dashboard.module.css";

interface DashboardStats {
  pruebas: { total: number; pendientes: number };
  cursos: { total: number; estudiantes: number };
  clasesVivo: { programadas: number; hoy: number };
  ingresos: { mes: number; total: number };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulando carga de estadísticas
    // TODO: Reemplazar con llamada real a API
    setTimeout(() => {
      setStats({
        pruebas: { total: 45, pendientes: 8 },
        cursos: { total: 0, estudiantes: 0 },
        clasesVivo: { programadas: 0, hoy: 0 },
        ingresos: { mes: 0, total: 0 },
      });
      setLoading(false);
    }, 500);
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
      <PageHeader
        title="Dashboard"
        subtitle="Vista general de tu plataforma"
        breadcrumbs={[{ label: "Dashboard" }]}
      />

      {/* Stats Grid */}
      <div className={s.statsGrid}>
        <StatCard
          label="Pruebas Psicométricas"
          value={stats?.pruebas.total || 0}
          icon={<FlaskConical size={24} />}
          color="blue"
          trend={{
            value: 12,
            isPositive: true,
          }}
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
          trend={{
            value: 8,
            isPositive: true,
          }}
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

      {/* Activity Feed */}
      <Card>
        <CardHeader title="Actividad Reciente" subtitle="Últimas acciones en la plataforma" />
        <EmptyState
          icon={<TrendingUp size={32} />}
          title="Sin actividad reciente"
          description="La actividad aparecerá aquí cuando empieces a usar la plataforma"
        />
      </Card>
    </div>
  );
}
