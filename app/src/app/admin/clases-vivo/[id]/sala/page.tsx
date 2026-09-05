"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/admin/Card";
import { JitsiMeetEmbed } from "@/components/live/JitsiMeetEmbed";
import s from "../../clases-vivo.module.css";

export default function AdminLiveRoomPage() {
  const { id } = useParams<{ id: string }>();
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("Sala en vivo");
  const [displayName, setDisplayName] = useState("Instructor");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function boot() {
      try {
        const me = await fetch("/api/auth/me");
        if (me.ok) {
          const data = await me.json();
          if (data.user?.nombre) setDisplayName(data.user.nombre);
        }

        const join = await fetch(`/api/live-classes/${id}/join`, { method: "POST" });
        if (!join.ok) {
          const data = await join.json().catch(() => ({}));
          setError(data.error || "No se pudo abrir la sala");
          return;
        }
        const data = await join.json();
        setRoomUrl(data.roomUrl);
        setTitle(data.title || "Sala en vivo");
        if (data.displayName) setDisplayName(data.displayName);
      } catch {
        setError("Error de red al abrir la sala");
      } finally {
        setLoading(false);
      }
    }
    void boot();

    return () => {
      void fetch(`/api/live-classes/${id}/leave`, { method: "POST" });
    };
  }, [id]);

  return (
    <div className={s.container}>
      <PageHeader
        title={title}
        subtitle="Transmisión embebida (Jitsi)"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Clases en Vivo", href: "/admin/clases-vivo" },
          { label: "Detalle", href: `/admin/clases-vivo/${id}` },
          { label: "Sala" },
        ]}
        action={
          <Link href={`/admin/clases-vivo/${id}`} className="btn">
            ← Volver al detalle
          </Link>
        }
      />

      {loading && (
        <Card>
          <p className={s.muted}>Conectando a la sala…</p>
        </Card>
      )}

      {!loading && error && (
        <Card>
          <p>{error}</p>
          <Link href={`/admin/clases-vivo/${id}`} className="btn">
            Volver
          </Link>
        </Card>
      )}

      {!loading && roomUrl && <JitsiMeetEmbed roomUrl={roomUrl} displayName={displayName} />}
    </div>
  );
}
