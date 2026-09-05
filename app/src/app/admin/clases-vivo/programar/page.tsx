"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/admin/Card";
import type { Course } from "@/db/schema";
import s from "./programar.module.css";

function ProgramarClaseForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState({
    title: "",
    scheduledAt: "",
    durationMinutes: "60",
    courseId: searchParams.get("courseId") || "",
  });

  useEffect(() => {
    const prefill = searchParams.get("courseId");
    if (prefill) {
      setForm((f) => ({ ...f, courseId: prefill }));
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadCourses() {
      try {
        const res = await fetch("/api/courses");
        if (res.ok) {
          const data = await res.json();
          setCourses(data.courses || []);
        }
      } catch (error) {
        console.error(error);
      }
    }
    void loadCourses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/live-classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          scheduledAt: form.scheduledAt,
          durationMinutes: parseInt(form.durationMinutes, 10),
          courseId: form.courseId || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/admin/clases-vivo/${data.liveClass.id}`);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Error al programar la clase");
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
        subtitle="Crea la sesión y prepara el aula virtual en BigBlueButton"
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
              Curso asociado
            </label>
            <select
              id="courseId"
              value={form.courseId}
              onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}
              className={s.input}
            >
              <option value="">Sin curso asociado</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
            <small className={s.hint}>
              Los alumnos inscritos en este curso podrán entrar a la sala desde el consultorio.
            </small>
          </div>

          <div className={s.actions}>
            <Link href="/admin/clases-vivo" className="btn">
              Cancelar
            </Link>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? "Creando sala…" : "Programar y crear sala"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function ProgramarClasePage() {
  return (
    <Suspense fallback={<p className={s.hint}>Cargando formulario…</p>}>
      <ProgramarClaseForm />
    </Suspense>
  );
}
