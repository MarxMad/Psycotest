"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/admin/Card";
import s from "./programar.module.css";

export default function ProgramarClasePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    scheduledAt: "",
    durationMinutes: "60",
    courseId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/live-classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          durationMinutes: parseInt(form.durationMinutes),
          courseId: form.courseId || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/admin/clases-vivo/${data.liveClass.id}`);
      } else {
        alert("Error al programar la clase");
      }
    } catch (error) {
      console.error(error);
      alert("Error al programar la clase");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.container}>
      <PageHeader
        title="Programar Clase en Vivo"
        subtitle="Configura una nueva sesión de videoclase"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Clases en Vivo", href: "/admin/clases-vivo" },
          { label: "Programar" },
        ]}
      />

      <Card>
        <form onSubmit={handleSubmit} className={s.form}>
          <div className={s.field}>
            <label htmlFor="title" className={s.label}>
              Título de la clase *
            </label>
            <input
              id="title"
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
              className={s.input}
              placeholder="Ej: Sesión 1 - Introducción"
            />
          </div>

          <div className={s.row}>
            <div className={s.field}>
              <label htmlFor="scheduledAt" className={s.label}>
                Fecha y hora *
              </label>
              <input
                id="scheduledAt"
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                required
                className={s.input}
              />
            </div>

            <div className={s.field}>
              <label htmlFor="durationMinutes" className={s.label}>
                Duración (minutos) *
              </label>
              <input
                id="durationMinutes"
                type="number"
                min="15"
                step="5"
                value={form.durationMinutes}
                onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
                required
                className={s.input}
              />
            </div>
          </div>

          <div className={s.field}>
            <label htmlFor="courseId" className={s.label}>
              Curso asociado (opcional)
            </label>
            <select
              id="courseId"
              value={form.courseId}
              onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}
              className={s.input}
            >
              <option value="">Sin curso asociado</option>
            </select>
            <small className={s.hint}>
              Puedes asociar esta clase a un curso específico
            </small>
          </div>

          <div className={s.actions}>
            <Link href="/admin/clases-vivo" className="btn">
              Cancelar
            </Link>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? "Programando..." : "Programar Clase"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
