"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/admin/Card";
import s from "./crear.module.css";

export default function CrearCursoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    price: "",
    inventoryLimit: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: Math.round(parseFloat(form.price) * 100),
          inventoryLimit: form.inventoryLimit ? parseInt(form.inventoryLimit) : null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/admin/cursos/${data.course.id}`);
      } else {
        alert("Error al crear el curso");
      }
    } catch (error) {
      console.error(error);
      alert("Error al crear el curso");
    } finally {
      setLoading(false);
    }
  };

  const autoGenerateSlug = () => {
    const slug = form.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setForm((f) => ({ ...f, slug }));
  };

  return (
    <div className={s.container}>
      <PageHeader
        title="Crear Curso"
        subtitle="Configura un nuevo curso para tu plataforma"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Cursos", href: "/admin/cursos" },
          { label: "Crear" },
        ]}
      />

      <Card>
        <form onSubmit={handleSubmit} className={s.form}>
          <div className={s.field}>
            <label htmlFor="title" className={s.label}>
              Título del curso *
            </label>
            <input
              id="title"
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              onBlur={autoGenerateSlug}
              required
              className={s.input}
              placeholder="Ej: Introducción a la Psicología Organizacional"
            />
          </div>

          <div className={s.field}>
            <label htmlFor="slug" className={s.label}>
              Slug (URL) *
            </label>
            <input
              id="slug"
              type="text"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              required
              className={s.input}
              placeholder="introduccion-psicologia-organizacional"
            />
            <small className={s.hint}>
              URL amigable para el curso. Se genera automáticamente desde el título.
            </small>
          </div>

          <div className={s.field}>
            <label htmlFor="description" className={s.label}>
              Descripción
            </label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className={s.textarea}
              rows={5}
              placeholder="Describe de qué trata el curso..."
            />
          </div>

          <div className={s.row}>
            <div className={s.field}>
              <label htmlFor="price" className={s.label}>
                Precio (MXN) *
              </label>
              <input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                required
                className={s.input}
                placeholder="499.00"
              />
            </div>

            <div className={s.field}>
              <label htmlFor="inventoryLimit" className={s.label}>
                Límite de cupos
              </label>
              <input
                id="inventoryLimit"
                type="number"
                min="1"
                value={form.inventoryLimit}
                onChange={(e) => setForm((f) => ({ ...f, inventoryLimit: e.target.value }))}
                className={s.input}
                placeholder="Sin límite"
              />
              <small className={s.hint}>Dejar vacío para cupos ilimitados</small>
            </div>
          </div>

          <div className={s.actions}>
            <Link href="/admin/cursos" className="btn">
              Cancelar
            </Link>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? "Creando..." : "Crear Curso"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
