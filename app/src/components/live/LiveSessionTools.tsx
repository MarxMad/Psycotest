"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./LiveSessionTools.module.css";

const LiveWhiteboard = dynamic(
  () => import("./LiveWhiteboard").then((m) => m.LiveWhiteboard),
  {
    ssr: false,
    loading: () => <p className={styles.muted}>Cargando pizarra…</p>,
  },
);

type Breakout = {
  id: string;
  name: string;
  roomUrl: string;
  status: string;
  assignments: Array<{ userId: string; nombre: string | null }>;
};

type IceSession = {
  id: string;
  type: string;
  prompt: string;
  status: string;
  stateJson?: { responses?: Array<{ userId: string; nombre: string; text: string }> };
};

type Props = {
  liveClassId: string;
  isAdmin: boolean;
  mainRoomUrl: string | null;
  onRoomUrlChange?: (url: string | null) => void;
};

export function LiveSessionTools({ liveClassId, isAdmin, mainRoomUrl, onRoomUrlChange }: Props) {
  const [tab, setTab] = useState<"meet" | "pizarra" | "breakouts" | "dinamicas">("meet");
  const [presence, setPresence] = useState<{ connectedSeconds: number; presencePercent: number } | null>(
    null,
  );
  const [breakouts, setBreakouts] = useState<Breakout[]>([]);
  const [mine, setMine] = useState<Breakout | null>(null);
  const [ice, setIce] = useState<IceSession | null>(null);
  const [iceText, setIceText] = useState("");
  const [breakoutCount, setBreakoutCount] = useState(2);
  const [msg, setMsg] = useState<string | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshBreakouts = useCallback(async () => {
    const res = await fetch(`/api/live-classes/${liveClassId}/breakouts`);
    if (!res.ok) return;
    const data = await res.json();
    setBreakouts(data.breakouts || []);
    setMine(data.mine || null);
  }, [liveClassId]);

  const refreshIce = useCallback(async () => {
    const res = await fetch(`/api/live-classes/${liveClassId}/icebreakers`);
    if (!res.ok) return;
    const data = await res.json();
    setIce(data.active || null);
  }, [liveClassId]);

  useEffect(() => {
    async function beat() {
      const res = await fetch(`/api/live-classes/${liveClassId}/heartbeat`, { method: "POST" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.attendance) {
        setPresence({
          connectedSeconds: data.attendance.connectedSeconds || 0,
          presencePercent: data.attendance.presencePercent || 0,
        });
      }
    }
    void beat();
    heartbeatRef.current = setInterval(() => void beat(), 30_000);
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [liveClassId]);

  useEffect(() => {
    void refreshBreakouts();
    void refreshIce();
    const t = setInterval(() => {
      void refreshBreakouts();
      void refreshIce();
    }, 12_000);
    return () => clearInterval(t);
  }, [refreshBreakouts, refreshIce]);

  async function createBreakouts() {
    setMsg(null);
    const res = await fetch(`/api/live-classes/${liveClassId}/breakouts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count: breakoutCount, autoAssign: true }),
    });
    if (!res.ok) {
      setMsg("No se pudieron crear las salas");
      return;
    }
    const data = await res.json();
    setBreakouts(data.breakouts || []);
    setMsg(`Se crearon ${data.breakouts?.length || 0} salas de división`);
  }

  async function closeBreakouts() {
    const res = await fetch(`/api/live-classes/${liveClassId}/breakouts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "close" }),
    });
    if (res.ok) {
      const data = await res.json();
      setBreakouts(data.breakouts || []);
      setMine(null);
      onRoomUrlChange?.(mainRoomUrl);
      setMsg("Breakouts cerrados — vuelve a la sala principal");
    }
  }

  async function startIce(type: string) {
    const res = await fetch(`/api/live-classes/${liveClassId}/icebreakers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    if (res.ok) {
      const data = await res.json();
      setIce(data.session);
    }
  }

  async function respondIce() {
    if (!ice || !iceText.trim()) return;
    const res = await fetch(`/api/live-classes/${liveClassId}/icebreakers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "respond", sessionId: ice.id, text: iceText.trim() }),
    });
    if (res.ok) {
      const data = await res.json();
      setIce(data.session);
      setIceText("");
    }
  }

  const minutes = presence ? Math.floor(presence.connectedSeconds / 60) : 0;
  const seconds = presence ? presence.connectedSeconds % 60 : 0;

  return (
    <div className={styles.wrap}>
      <div className={styles.presenceBar}>
        <span>
          Tiempo conectado: {minutes}m {seconds.toString().padStart(2, "0")}s
        </span>
        <span>Presencia: {presence?.presencePercent ?? 0}%</span>
      </div>

      <div className={styles.tabs} role="tablist">
        {(
          [
            ["meet", "Videollamada"],
            ["pizarra", "Pizarra"],
            ["breakouts", "División"],
            ["dinamicas", "Dinámicas"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            className={tab === key ? styles.tabActive : styles.tab}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {msg && <p className={styles.msg}>{msg}</p>}

      {tab === "meet" && (
        <p className={styles.hint}>
          La videollamada está arriba. Usa las pestañas para pizarra, salas de división y juegos de
          integración.
          {mine && mine.status === "open" ? (
            <>
              {" "}
              Tienes asignación a <strong>{mine.name}</strong>.{" "}
              <button
                type="button"
                className={styles.linkBtn}
                onClick={() => {
                  onRoomUrlChange?.(mine.roomUrl);
                  setTab("meet");
                }}
              >
                Ir a mi breakout
              </button>
              {" · "}
              <button
                type="button"
                className={styles.linkBtn}
                onClick={() => onRoomUrlChange?.(mainRoomUrl)}
              >
                Sala principal
              </button>
            </>
          ) : null}
        </p>
      )}

      {tab === "pizarra" && (
        <div className={styles.panel}>
          <LiveWhiteboard liveClassId={liveClassId} isAdmin={isAdmin} />
        </div>
      )}

      {tab === "breakouts" && (
        <div className={styles.panel}>
          {isAdmin && (
            <div className={styles.adminRow}>
              <label>
                Salas{" "}
                <input
                  type="number"
                  min={2}
                  max={8}
                  value={breakoutCount}
                  onChange={(e) => setBreakoutCount(Number(e.target.value) || 2)}
                />
              </label>
              <button type="button" className={styles.primary} onClick={() => void createBreakouts()}>
                Crear y asignar
              </button>
              <button type="button" className={styles.ghost} onClick={() => void closeBreakouts()}>
                Cerrar todas
              </button>
            </div>
          )}
          <ul className={styles.list}>
            {breakouts.map((b) => (
              <li key={b.id}>
                <div>
                  <strong>{b.name}</strong>{" "}
                  <span className={styles.muted}>({b.status})</span>
                  <div className={styles.muted}>
                    {b.assignments.map((a) => a.nombre || a.userId).join(", ") || "Sin asignados"}
                  </div>
                </div>
                {b.status === "open" && (
                  <button
                    type="button"
                    className={styles.ghost}
                    onClick={() => {
                      onRoomUrlChange?.(b.roomUrl);
                      setTab("meet");
                    }}
                  >
                    Entrar
                  </button>
                )}
              </li>
            ))}
            {breakouts.length === 0 && <li className={styles.muted}>Aún no hay salas de división.</li>}
          </ul>
        </div>
      )}

      {tab === "dinamicas" && (
        <div className={styles.panel}>
          {isAdmin && (
            <div className={styles.adminRow}>
              <button type="button" className={styles.primary} onClick={() => void startIce("pregunta_rapida")}>
                Pregunta rápida
              </button>
              <button type="button" className={styles.ghost} onClick={() => void startIce("dos_verdades")}>
                Dos verdades
              </button>
              <button type="button" className={styles.ghost} onClick={() => void startIce("asociacion")}>
                Asociación
              </button>
            </div>
          )}
          {!ice && <p className={styles.muted}>No hay dinámica activa.</p>}
          {ice && (
            <div className={styles.ice}>
              <p className={styles.iceType}>{ice.type.replace("_", " ")}</p>
              <p className={styles.icePrompt}>{ice.prompt}</p>
              <div className={styles.iceForm}>
                <input
                  value={iceText}
                  onChange={(e) => setIceText(e.target.value)}
                  placeholder="Tu respuesta…"
                  maxLength={500}
                />
                <button type="button" className={styles.primary} onClick={() => void respondIce()}>
                  Enviar
                </button>
              </div>
              <ul className={styles.responses}>
                {(ice.stateJson?.responses || []).map((r) => (
                  <li key={r.userId}>
                    <strong>{r.nombre}:</strong> {r.text}
                  </li>
                ))}
              </ul>
              {isAdmin && (
                <button
                  type="button"
                  className={styles.ghost}
                  onClick={async () => {
                    await fetch(`/api/live-classes/${liveClassId}/icebreakers`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "close", sessionId: ice.id }),
                    });
                    setIce(null);
                  }}
                >
                  Cerrar dinámica
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
