"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/admin/Card";
import { JitsiMeetEmbed, type EstadoSala } from "@/components/live/JitsiMeetEmbed";
import { LiveSessionTools } from "@/components/live/LiveSessionTools";
import s from "../../clases-vivo.module.css";

export default function AdminLiveRoomPage() {
  const { id } = useParams<{ id: string }>();
  const [mainRoomUrl, setMainRoomUrl] = useState<string | null>(null);
  const [activeRoomUrl, setActiveRoomUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("Sala en vivo");
  const [displayName, setDisplayName] = useState("Instructor");
  const [userId, setUserId] = useState<string | null>(null);
  const [estadoClase, setEstadoClase] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [estadoSala, setEstadoSala] = useState<EstadoSala>("conectando");
  const [enSala, setEnSala] = useState<number | null>(null);
  const [arrancada, setArrancada] = useState(false);
  const marcada = useRef(false);

  useEffect(() => {
    async function boot() {
      try {
        const me = await fetch("/api/auth/me");
        if (me.ok) {
          const data = await me.json();
          if (data.user?.nombre) setDisplayName(data.user.nombre);
          if (data.user?.id) setUserId(data.user.id);
        }

        const join = await fetch(`/api/live-classes/${id}/join`, { method: "POST" });
        if (!join.ok) {
          const data = await join.json().catch(() => ({}));
          setError(data.error || "No se pudo abrir la sala");
          return;
        }
        const data = await join.json();
        setMainRoomUrl(data.roomUrl);
        setActiveRoomUrl(data.roomUrl);
        setTitle(data.title || "Sala en vivo");
        setEstadoClase(data.status ?? null);
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

  /**
   * Cuando la conferencia arranca de verdad, la clase pasa a «en curso».
   *
   * Hasta ahora había que acordarse de pulsarlo en la pantalla anterior, y si
   * se olvidaba, los alumnos chocaban con «la sala aún no está disponible».
   */
  const marcarEnCurso = useCallback(async () => {
    if (marcada.current || estadoClase !== "scheduled") return;
    marcada.current = true;
    try {
      const res = await fetch(`/api/live-classes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "live", ensureRoom: true }),
      });
      if (res.ok) {
        setEstadoClase("live");
        setArrancada(true);
      }
    } catch {
      marcada.current = false;
    }
  }, [id, estadoClase]);

  const alCambiarEstado = useCallback(
    (estado: EstadoSala) => {
      setEstadoSala(estado);
      if (estado === "dentro") void marcarEnCurso();
    },
    [marcarEnCurso],
  );

  const esperandoAnfitrion = estadoSala === "esperando";

  return (
    <div className={s.container}>
      <PageHeader
        title={title}
        subtitle="Jitsi + pizarra, salas de división y presencia CONOCER"
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

      {!loading && activeRoomUrl && (
        <>
          {/* meet.jit.si no arranca la reunión hasta que entra un moderador, y
              autenticarse no funciona dentro del iframe: hay que hacerlo en
              una pestaña de verdad. Esto lo explica en el momento en que pasa. */}
          {esperandoAnfitrion && (
            <Card>
              <h3 className={s.anfitrionTitulo}>La reunión todavía no arranca</h3>
              <p className={s.anfitrionTexto}>
                Jitsi espera a que entre un anfitrión, y la identificación no se puede hacer desde
                aquí dentro. Abre la sala en una pestaña, inicia sesión en Jitsi con tu cuenta y la
                reunión arrancará: esta pantalla entrará sola y podrás volver a ella.
              </p>
              <div className={s.anfitrionAcciones}>
                <a
                  className="btn btn-primary"
                  href={activeRoomUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Entrar como anfitrión ↗
                </a>
                <button
                  type="button"
                  className="btn"
                  onClick={() => window.location.reload()}
                >
                  Ya inicié sesión · reconectar
                </button>
              </div>
              <p className={s.muted}>
                Solo hace falta la primera vez de cada reunión. Mientras tanto, la pizarra y las
                dinámicas de abajo ya funcionan.
              </p>
            </Card>
          )}

          {arrancada && (
            <p className={s.avisoOk}>Reunión iniciada · la clase quedó marcada como en curso.</p>
          )}

          <JitsiMeetEmbed
            roomUrl={activeRoomUrl}
            displayName={displayName}
            onEstado={alCambiarEstado}
            onParticipantes={setEnSala}
          />

          <LiveSessionTools
            liveClassId={id}
            isAdmin
            userId={userId}
            enSala={enSala}
            mainRoomUrl={mainRoomUrl}
            onRoomUrlChange={(url) => setActiveRoomUrl(url || mainRoomUrl)}
          />
        </>
      )}
    </div>
  );
}
