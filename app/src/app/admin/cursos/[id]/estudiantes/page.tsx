"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Users, CheckCircle, Clock } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { Card } from "@/components/admin/Card";
import { EmptyState } from "@/components/admin/EmptyState";
import type { Course } from "@/db/schema";
import s from "../../../usuarios/usuarios.module.css";

type Estudiante = {
  id: string;
  status: "pending" | "active" | "refunded" | "completed" | "cancelled";
  progressPercent: number;
  enrolledAt: string | null;
  completedAt: string | null;
  createdAt: string;
  userId: string;
  nombre: string;
  email: string;
};

const ESTADOS: Record<Estudiante["status"], string> = {
  pending: "Pago pendiente",
  active: "Cursando",
  completed: "Terminado",
  refunded: "Reembolsado",
  cancelled: "Cancelado",
};

export default function EstudiantesCursoPage() {
  const { id } = useParams<{ id: string }>();
  const [curso, setCurso] = useState<Course | null>(null);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [rc, re] = await Promise.all([
          fetch(`/api/courses/${id}`),
          fetch(`/api/courses/${id}/estudiantes`),
        ]);
        if (rc.ok) setCurso((await rc.json()).course);
        if (re.ok) setEstudiantes((await re.json()).estudiantes ?? []);
      } catch (e) {
        console.error(e);
      }
      setCargando(false);
    }
    load();
  }, [id]);

  const cursando = estudiantes.filter((e) => e.status === "active").length;
  const terminados = estudiantes.filter((e) => e.status === "completed").length;
  const titulo = curso?.title ?? "Curso";

  return (
    <div className={s.container}>
      <PageHeader
        title="Estudiantes"
        subtitle={titulo}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Cursos", href: "/admin/cursos" },
          { label: titulo, href: `/admin/cursos/${id}` },
          { label: "Estudiantes" },
        ]}
      />

      <div className={s.statsGrid}>
        <StatCard label="Inscritos" value={estudiantes.length} icon={<Users size={24} />} color="blue" />
        <StatCard label="Cursando" value={cursando} icon={<Clock size={24} />} color="purple" />
        <StatCard label="Terminados" value={terminados} icon={<CheckCircle size={24} />} color="green" />
      </div>

      {cargando ? (
        <Card>
          <div className={s.loading}>
            <div className={s.spinner} />
            <p>Cargando estudiantes...</p>
          </div>
        </Card>
      ) : estudiantes.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users size={48} />}
            title="Sin estudiantes"
            description="Quien compre o sea inscrito en este curso aparecerá aquí"
          />
        </Card>
      ) : (
        <Card padding="none">
          <div className={s.tableShell}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Estado</th>
                  <th>Avance</th>
                  <th>Inscripción</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {estudiantes.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <strong>{e.nombre}</strong>
                      <div className={s.muted}>{e.email}</div>
                    </td>
                    <td>
                      <span className={e.status === "completed" ? s.verified : s.pending}>
                        {ESTADOS[e.status]}
                      </span>
                    </td>
                    <td>{e.progressPercent}%</td>
                    <td className={s.muted}>
                      {new Date(e.enrolledAt ?? e.createdAt).toLocaleDateString("es-MX")}
                    </td>
                    <td>
                      <Link href={`/admin/usuarios/${e.userId}`} className="btn btn-sm">
                        Ver perfil
                      </Link>
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
