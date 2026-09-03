"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap, Plus, FolderOpen, Settings } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/admin/Card";
import { EmptyState } from "@/components/admin/EmptyState";
import type { Course } from "@/db/schema";
import s from "./cursos.module.css";

export default function CursosPage() {
  const [cursos, setCursos] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/courses");
        if (res.ok) {
          const data = await res.json();
          setCursos(data.courses || []);
        }
      } catch (error) {
        console.error("Error al cargar cursos:", error);
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className={s.container}>
      <PageHeader
        title="Cursos"
        subtitle="Gestiona tu plataforma de educación online"
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Cursos" }]}
        action={
          <div className={s.actions}>
            <Link href="/admin/cursos/categorias" className="btn">
              <FolderOpen size={16} />
              Categorías
            </Link>
            <Link href="/admin/cursos/inventario" className="btn">
              <Settings size={16} />
              Inventario
            </Link>
            <Link href="/admin/cursos/crear" className="btn btn-primary">
              <Plus size={16} />
              Crear Curso
            </Link>
          </div>
        }
      />

      {loading ? (
        <Card>
          <div className={s.loading}>
            <div className={s.spinner} />
            <p>Cargando cursos...</p>
          </div>
        </Card>
      ) : cursos.length === 0 ? (
        <Card>
          <EmptyState
            icon={<GraduationCap size={48} />}
            title="Sin cursos aún"
            description="Crea tu primer curso para empezar a vender contenido educativo"
            action={
              <Link href="/admin/cursos/crear" className="btn btn-primary btn-lg">
                <Plus size={18} />
                Crear Primer Curso
              </Link>
            }
          />
        </Card>
      ) : (
        <div className={s.grid}>
          {cursos.map((curso) => (
            <Card key={curso.id} padding="none" className={s.cursoCard}>
              <div className={s.cardImage}>
                {curso.thumbnailUrl ? (
                  <img src={curso.thumbnailUrl} alt={curso.title} />
                ) : (
                  <div className={s.cardPlaceholder}>
                    <GraduationCap size={32} />
                  </div>
                )}
              </div>
              <div className={s.cardContent}>
                <div className={s.cardHeader}>
                  <h3 className={s.cardTitle}>{curso.title}</h3>
                  <span className={`${s.badge} ${s[`badge-${curso.status}`]}`}>
                    {curso.status === "draft"
                      ? "Borrador"
                      : curso.status === "published"
                        ? "Publicado"
                        : "Archivado"}
                  </span>
                </div>
                {curso.description && (
                  <p className={s.cardDescription}>
                    {curso.description.length > 120
                      ? curso.description.slice(0, 120) + "..."
                      : curso.description}
                  </p>
                )}
                <div className={s.cardFooter}>
                  <div className={s.cardPrice}>
                    ${(curso.priceMxn / 100).toLocaleString("es-MX")} MXN
                  </div>
                  <div className={s.cardStats}>
                    <span>{curso.soldCount} vendidos</span>
                    {curso.inventoryLimit && (
                      <span>
                        {curso.inventoryLimit - curso.soldCount} disponibles
                      </span>
                    )}
                  </div>
                </div>
                <div className={s.cardActions}>
                  <Link href={`/admin/cursos/${curso.id}`} className="btn btn-sm">
                    Ver Curso
                  </Link>
                  <Link href={`/admin/cursos/${curso.id}/editar`} className="btn btn-sm">
                    Editar
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
