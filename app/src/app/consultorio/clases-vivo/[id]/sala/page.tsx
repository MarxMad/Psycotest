"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BbbMeetEmbed } from "@/components/live/BbbMeetEmbed";
import styles from "../../clases-vivo.module.css";

export default function AlumnoSalaPage() {
  const { id } = useParams<{ id: string }>();
  const [joinUrl, setJoinUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("Sala en vivo");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function boot() {
      try {
        const join = await fetch(`/api/live-classes/${id}/join`, { method: "POST" });
        if (!active) return;
        if (join.status === 401) {
          setError("Inicia sesión para entrar a la sala.");
          return;
        }
        if (!join.ok) {
          const data = await join.json().catch(() => ({}));
          setError(data.error || "No se pudo entrar a la sala.");
          return;
        }
        const data = await join.json();
        setJoinUrl(data.joinUrl || data.roomUrl);
        setTitle(data.title || "Sala en vivo");
      } catch {
        if (active) setError("Error de red al unirse.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void boot();

    return () => {
      active = false;
      void fetch(`/api/live-classes/${id}/leave`, { method: "POST" });
    };
  }, [id]);

  return (
    <main className={styles.roomPage}>
      <div className={styles.roomTop}>
        <div>
          <Link href="/consultorio/clases-vivo" className={styles.back}>
            ← Mis clases
          </Link>
          <h1>{title}</h1>
        </div>
      </div>

      {loading && <p className={styles.muted}>Conectando a BigBlueButton…</p>}

      {!loading && error && (
        <div className={styles.empty}>
          <p>{error}</p>
          <Link href="/login?next=/consultorio/clases-vivo" className={styles.cta}>
            Iniciar sesión
          </Link>
        </div>
      )}

      {!loading && joinUrl && <BbbMeetEmbed joinUrl={joinUrl} title={title} />}
    </main>
  );
}
