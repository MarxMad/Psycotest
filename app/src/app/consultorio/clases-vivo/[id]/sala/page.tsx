"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { JitsiMeetEmbed, type EstadoSala } from "@/components/live/JitsiMeetEmbed";
import { LiveSessionTools } from "@/components/live/LiveSessionTools";
import styles from "../../clases-vivo.module.css";

export default function AlumnoSalaPage() {
  const { id } = useParams<{ id: string }>();
  const [mainRoomUrl, setMainRoomUrl] = useState<string | null>(null);
  const [activeRoomUrl, setActiveRoomUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("Sala en vivo");
  const [displayName, setDisplayName] = useState("Alumno");
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [estadoSala, setEstadoSala] = useState<EstadoSala>("conectando");
  const [enSala, setEnSala] = useState<number | null>(null);

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
        setMainRoomUrl(data.roomUrl);
        setActiveRoomUrl(data.roomUrl);
        setTitle(data.title || "Sala en vivo");
        if (data.displayName) setDisplayName(data.displayName);
        if (data.attendance?.userId) setUserId(data.attendance.userId);
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

      {loading && <p className={styles.muted}>Conectando…</p>}

      {!loading && error && (
        <div className={styles.empty}>
          <p>{error}</p>
          <Link href="/login?next=/consultorio/clases-vivo" className={styles.cta}>
            Iniciar sesión
          </Link>
        </div>
      )}

      {!loading && activeRoomUrl && (
        <>
          {/* La reunión no arranca hasta que entra el instructor. Decirlo
              evita que el alumno crea que su conexión está fallando. */}
          {estadoSala === "esperando" && (
            <p className={styles.espera}>
              La clase todavía no empieza: estamos esperando a que el instructor abra la reunión.
              No cierres esta pestaña, entrarás en cuanto arranque.
            </p>
          )}

          <JitsiMeetEmbed
            roomUrl={activeRoomUrl}
            displayName={displayName}
            onEstado={setEstadoSala}
            onParticipantes={setEnSala}
          />
          <LiveSessionTools
            liveClassId={id}
            isAdmin={false}
            userId={userId}
            enSala={enSala}
            mainRoomUrl={mainRoomUrl}
            onRoomUrlChange={(url) => setActiveRoomUrl(url || mainRoomUrl)}
          />
        </>
      )}
    </main>
  );
}
