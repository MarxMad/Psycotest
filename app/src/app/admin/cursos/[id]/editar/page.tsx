"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardHeader } from "@/components/admin/Card";
import { EmptyState } from "@/components/admin/EmptyState";
import type { Course } from "@/db/schema";
import s from "../../crear/crear.module.css";

type Categoria = { id: string; name: string };

/** El formulario guarda todo como texto; los números se convierten al enviar. */
type Formulario = {
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  categoryId: string;
  precio: string;
  inventoryLimit: string;
  thumbnailUrl: string;
  instructorName: string;
  instructorBio: string;
  level: Course["level"];
  modalidad: Course["modalidad"];
  estandarClave: string;
  durationMinutes: string;
  status: Course["status"];
  sortOrder: string;
  requireQuizPass: boolean;
};

function desdeCurso(c: Course): Formulario {
  return {
    title: c.title,
    slug: c.slug,
    subtitle: c.subtitle ?? "",
    description: c.description,
    categoryId: c.categoryId,
    precio: (c.priceMxn / 100).toString(),
    inventoryLimit: c.inventoryLimit?.toString() ?? "",
    thumbnailUrl: c.thumbnailUrl ?? "",
    instructorName: c.instructorName,
    instructorBio: c.instructorBio ?? "",
    level: c.level,
    modalidad: c.modalidad,
    estandarClave: c.estandarClave ?? "",
    durationMinutes: c.durationMinutes.toString(),
    status: c.status,
    sortOrder: c.sortOrder.toString(),
    requireQuizPass: c.requireQuizPass,
  };
}

function vacioANull(v: string) {
  return v.trim() ? v.trim() : null;
}

export default function EditarCursoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState<Formulario | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [rc, rcat] = await Promise.all([
          fetch(`/api/courses/${id}`),
          fetch("/api/course-categories"),
        ]);
        if (rc.ok) setForm(desdeCurso((await rc.json()).course));
        if (rcat.ok) setCategorias((await rcat.json()).categories ?? []);
      } catch (e) {
        console.error(e);
      }
      setCargando(false);
    }
    load();
  }, [id]);

  const set = <K extends keyof Formulario>(campo: K, valor: Formulario[K]) =>
    setForm((f) => (f ? { ...f, [campo]: valor } : f));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setGuardando(true);
    setError("");

    try {
      const res = await fetch(`/api/courses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          slug: form.slug.trim(),
          subtitle: vacioANull(form.subtitle),
          description: form.description.trim(),
          categoryId: form.categoryId,
          priceMxn: Math.round(parseFloat(form.precio || "0") * 100),
          inventoryLimit: form.inventoryLimit ? parseInt(form.inventoryLimit) : null,
          thumbnailUrl: vacioANull(form.thumbnailUrl),
          instructorName: form.instructorName.trim() || "Instructor",
          instructorBio: vacioANull(form.instructorBio),
          level: form.level,
          modalidad: form.modalidad,
          estandarClave: vacioANull(form.estandarClave),
          durationMinutes: parseInt(form.durationMinutes || "0"),
          status: form.status,
          sortOrder: parseInt(form.sortOrder || "0"),
          requireQuizPass: form.requireQuizPass,
        }),
      });

      if (res.ok) {
        router.push(`/admin/cursos/${id}`);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "No se pudo guardar el curso");
      }
    } catch (e) {
      console.error(e);
      setError("No se pudo guardar el curso");
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <Card>
        <p className={s.hint}>Cargando curso...</p>
      </Card>
    );
  }

  if (!form) {
    return (
      <Card>
        <EmptyState title="Curso no encontrado" description="El curso que buscas no existe" />
      </Card>
    );
  }

  return (
    <div className={s.container}>
      <PageHeader
        title="Editar Curso"
        subtitle={form.title}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Cursos", href: "/admin/cursos" },
          { label: form.title, href: `/admin/cursos/${id}` },
          { label: "Editar" },
        ]}
      />

      <form onSubmit={handleSubmit} className={s.form}>
        <Card>
          <CardHeader title="Publicación" subtitle="Solo los cursos publicados aparecen en el catálogo y se pueden comprar." />
          <div className={s.row}>
            <div className={s.field}>
              <label htmlFor="status" className={s.label}>Estado</label>
              <select
                id="status"
                value={form.status}
                onChange={(e) => set("status", e.target.value as Formulario["status"])}
                className={s.input}
              >
                <option value="draft">Borrador</option>
                <option value="published">Publicado</option>
                <option value="archived">Archivado</option>
              </select>
            </div>
            <div className={s.field}>
              <label htmlFor="sortOrder" className={s.label}>Orden en el catálogo</label>
              <input
                id="sortOrder"
                type="number"
                value={form.sortOrder}
                onChange={(e) => set("sortOrder", e.target.value)}
                className={s.input}
              />
              <small className={s.hint}>Los números menores aparecen primero</small>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Contenido" />
          <div className={s.form}>
            <div className={s.field}>
              <label htmlFor="title" className={s.label}>Título *</label>
              <input
                id="title"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                required
                className={s.input}
              />
            </div>
            <div className={s.field}>
              <label htmlFor="slug" className={s.label}>Slug (URL) *</label>
              <input
                id="slug"
                value={form.slug}
                onChange={(e) => set("slug", e.target.value)}
                required
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                className={s.input}
              />
              <small className={s.hint}>Cambiarlo rompe los enlaces ya compartidos del curso.</small>
            </div>
            <div className={s.field}>
              <label htmlFor="subtitle" className={s.label}>Subtítulo</label>
              <input
                id="subtitle"
                value={form.subtitle}
                onChange={(e) => set("subtitle", e.target.value)}
                className={s.input}
              />
            </div>
            <div className={s.field}>
              <label htmlFor="description" className={s.label}>Descripción</label>
              <textarea
                id="description"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={6}
                className={s.textarea}
              />
            </div>
            <div className={s.field}>
              <label htmlFor="thumbnailUrl" className={s.label}>Imagen de portada (URL)</label>
              <input
                id="thumbnailUrl"
                type="url"
                value={form.thumbnailUrl}
                onChange={(e) => set("thumbnailUrl", e.target.value)}
                className={s.input}
                placeholder="https://..."
              />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Clasificación" />
          <div className={s.form}>
            <div className={s.row}>
              <div className={s.field}>
                <label htmlFor="categoryId" className={s.label}>Categoría</label>
                <select
                  id="categoryId"
                  value={form.categoryId}
                  onChange={(e) => set("categoryId", e.target.value)}
                  className={s.input}
                >
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className={s.field}>
                <label htmlFor="level" className={s.label}>Nivel</label>
                <select
                  id="level"
                  value={form.level}
                  onChange={(e) => set("level", e.target.value as Formulario["level"])}
                  className={s.input}
                >
                  <option value="basico">Básico</option>
                  <option value="intermedio">Intermedio</option>
                  <option value="avanzado">Avanzado</option>
                </select>
              </div>
            </div>
            <div className={s.row}>
              <div className={s.field}>
                <label htmlFor="modalidad" className={s.label}>Modalidad</label>
                <select
                  id="modalidad"
                  value={form.modalidad}
                  onChange={(e) => set("modalidad", e.target.value as Formulario["modalidad"])}
                  className={s.input}
                >
                  <option value="online">En línea</option>
                  <option value="presencial">Presencial</option>
                  <option value="mixta">Mixta</option>
                </select>
              </div>
              <div className={s.field}>
                <label htmlFor="estandarClave" className={s.label}>Estándar CONOCER</label>
                <input
                  id="estandarClave"
                  value={form.estandarClave}
                  onChange={(e) => set("estandarClave", e.target.value.toUpperCase())}
                  className={s.input}
                  placeholder="EC0217"
                />
              </div>
            </div>
            <div className={s.field}>
              <label htmlFor="durationMinutes" className={s.label}>Duración (minutos)</label>
              <input
                id="durationMinutes"
                type="number"
                min="0"
                value={form.durationMinutes}
                onChange={(e) => set("durationMinutes", e.target.value)}
                className={s.input}
              />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Venta" />
          <div className={s.row}>
            <div className={s.field}>
              <label htmlFor="precio" className={s.label}>Precio (MXN) *</label>
              <input
                id="precio"
                type="number"
                step="0.01"
                min="0"
                value={form.precio}
                onChange={(e) => set("precio", e.target.value)}
                required
                className={s.input}
              />
            </div>
            <div className={s.field}>
              <label htmlFor="inventoryLimit" className={s.label}>Límite de cupos</label>
              <input
                id="inventoryLimit"
                type="number"
                min="1"
                value={form.inventoryLimit}
                onChange={(e) => set("inventoryLimit", e.target.value)}
                className={s.input}
                placeholder="Sin límite"
              />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Instructor y evaluación" />
          <div className={s.form}>
            <div className={s.field}>
              <label htmlFor="instructorName" className={s.label}>Nombre del instructor</label>
              <input
                id="instructorName"
                value={form.instructorName}
                onChange={(e) => set("instructorName", e.target.value)}
                className={s.input}
              />
            </div>
            <div className={s.field}>
              <label htmlFor="instructorBio" className={s.label}>Semblanza</label>
              <textarea
                id="instructorBio"
                value={form.instructorBio}
                onChange={(e) => set("instructorBio", e.target.value)}
                rows={3}
                className={s.textarea}
              />
            </div>
            <label className={s.label} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <input
                type="checkbox"
                checked={form.requireQuizPass}
                onChange={(e) => set("requireQuizPass", e.target.checked)}
              />
              Exigir aprobar el quiz para desbloquear la siguiente lección
            </label>
          </div>
        </Card>

        {error && (
          <p role="alert" style={{ color: "var(--admin-danger, #c0392b)" }}>
            {error}
          </p>
        )}

        <div className={s.actions}>
          <Link href={`/admin/cursos/${id}`} className="btn">Cancelar</Link>
          <button type="submit" disabled={guardando} className="btn btn-primary">
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
