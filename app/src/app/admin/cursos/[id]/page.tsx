"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Edit, Users, BookOpen, Settings } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardHeader } from "@/components/admin/Card";
import { EmptyState } from "@/components/admin/EmptyState";
import type { Course } from "@/db/schema";
import s from "./curso-detalle.module.css";

export default function CursoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const [curso, setCurso] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/courses/${id}`);
        if (res.ok) {
          const data = await res.json();
          setCurso(data.course);
        }
      } catch (error) {
        console.error(error);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <Card>
        <div className={s.loading}>
          <div className={s.spinner} />
          <p>Cargando curso...</p>
        </div>
      </Card>
    );
  }

  if (!curso) {
    return (
      <Card>
        <EmptyState title="Curso no encontrado" description="El curso que buscas no existe" />
      </Card>
    );
  }

  return (
    <div className={s.container}>
      <PageHeader
        title={curso.title}
        subtitle={`Creado el ${new Date(curso.createdAt).toLocaleDateString("es-MX")}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Cursos", href: "/admin/cursos" },
          { label: curso.title },
        ]}
        action={
          <Link href={`/admin/cursos/${id}/editar`} className="btn btn-primary">
            <Edit size={16} />
            Editar Curso
          </Link>
        }
      />

      <div className={s.grid}>
        <Card>
          <CardHeader title="Detalles del Curso" />
          <div className={s.details}>
            <div className={s.detail}>
              <span className={s.detailLabel}>Estado:</span>
              <span className={`${s.badge} ${s[`badge-${curso.status}`]}`}>
                {curso.status === "draft"
                  ? "Borrador"
                  : curso.status === "published"
                    ? "Publicado"
                    : "Archivado"}
              </span>
            </div>
            <div className={s.detail}>
              <span className={s.detailLabel}>Precio:</span>
              <span className={s.detailValue}>
                ${(curso.priceMxn / 100).toLocaleString("es-MX")} MXN
              </span>
            </div>
            <div className={s.detail}>
              <span className={s.detailLabel}>Vendidos:</span>
              <span className={s.detailValue}>{curso.soldCount}</span>
            </div>
            {curso.inventoryLimit && (
              <div className={s.detail}>
                <span className={s.detailLabel}>Disponibles:</span>
                <span className={s.detailValue}>
                  {curso.inventoryLimit - curso.soldCount} / {curso.inventoryLimit}
                </span>
              </div>
            )}
            {curso.description && (
              <div className={s.detail}>
                <span className={s.detailLabel}>Descripción:</span>
                <p className={s.description}>{curso.description}</p>
              </div>
            )}
          </div>
        </Card>

        <div className={s.actions}>
          <Link href={`/admin/cursos/${id}/lecciones`} className={s.actionCard}>
            <BookOpen size={24} />
            <span>Gestionar Lecciones</span>
          </Link>
          <Link href={`/admin/cursos/${id}/estudiantes`} className={s.actionCard}>
            <Users size={24} />
            <span>Ver Estudiantes</span>
          </Link>
          <Link href={`/admin/cursos/${id}/editar`} className={s.actionCard}>
            <Settings size={24} />
            <span>Configuración</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
