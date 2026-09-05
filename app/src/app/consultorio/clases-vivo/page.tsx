"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { LiveClass } from "@/db/schema";
import styles from "./clases-vivo.module.css";

function fmt(iso: string) {
  return new Date(iso).toLocaleString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status: LiveClass["status"]) {
  if (status === "live") return "En vivo";
  if (status === "scheduled") return "Programada";
  if (status === "completed") return "Finalizada";
  return "Cancelada";
}

export default function AlumnoClasesVivoPage() {
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/live-classes?mine=1");
        if (res.status === 401) {
          setError("Inicia sesión para ver tus clases en vivo.");
          return;
        }
        if (!res.ok) {
          setError("No se pudieron cargar las clases.");
          return;
        }
        const data = await res.json();
        setClasses(data.classes || []);
      } catch {
        setError("Error de red.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Consultorio</p>
        <h1>Clases en vivo</h1>
        <p className={styles.lead}>
          Sesiones de tus cursos inscritos. Entra a la sala cuando la clase esté disponible.
        </p>
      </header>

      {loading && <p className={styles.muted}>Cargando sesiones…</p>}
      {!loading && error && (
        <div className={styles.empty}>
          <p>{error}</p>
          <Link href="/login?next=/consultorio/clases-vivo" className={styles.cta}>
            Iniciar sesión
          </Link>
        </div>
      )}
      {!loading && !error && classes.length === 0 && (
        <div className={styles.empty}>
          <p>No tienes clases en vivo próximas. Inscríbete a un curso para verlas aquí.</p>
          <Link href="/consultorio/cursos" className={styles.cta}>
            Ver cursos
          </Link>
        </div>
      )}

      {!loading && !error && classes.length > 0 && (
        <ul className={styles.list}>
          {classes.map((clase) => {
            const canJoin = clase.status === "live" || clase.status === "scheduled";
            return (
              <li key={clase.id} className={styles.item}>
                <div>
                  <p className={styles.status} data-status={clase.status}>
                    {statusLabel(clase.status)}
                  </p>
                  <h2>{clase.title}</h2>
                  <p className={styles.meta}>
                    {fmt(clase.scheduledAt)} · {clase.durationMinutes} min
                  </p>
                </div>
                {canJoin ? (
                  <Link href={`/consultorio/clases-vivo/${clase.id}/sala`} className={styles.cta}>
                    {clase.status === "live" ? "Entrar ahora" : "Abrir sala"}
                  </Link>
                ) : (
                  <span className={styles.muted}>No disponible</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
