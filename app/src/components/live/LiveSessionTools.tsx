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

type Pestana = "meet" | "pizarra" | "breakouts" | "dinamicas";

type Props = {
  liveClassId: string;
  isAdmin: boolean;
  mainRoomUrl: string | null;
  userId?: string | null;
  /** Personas que Jitsi reporta en la sala, incluido quien mira. */
  enSala?: number | null;
  onRoomUrlChange?: (url: string | null) => void;
};

const DINAMICAS: Array<{ tipo: string; etiqueta: string }> = [
  { tipo: "pregunta_rapida", etiqueta: "Pregunta rápida" },
  { tipo: "dos_verdades", etiqueta: "Dos verdades" },
  { tipo: "asociacion", etiqueta: "Asociación" },
];

export function LiveSessionTools({
  liveClassId,
  isAdmin,
  mainRoomUrl,
  userId,
  enSala,
  onRoomUrlChange,
}: Props) {
  const [tab, setTab] = useState<Pestana>("meet");
  /** La pizarra se monta la primera vez que se abre y ya no se desmonta. */
  const [pizarraAbierta, setPizarraAbierta] = useState(false);
  const [presence, setPresence] = useState<{ connectedSeconds: number; presencePercent: number } | null>(
    null,
  );
  const [breakouts, setBreakouts] = useState<Breakout[]>([]);
  const [mine, setMine] = useState<Breakout | null>(null);
  const [ice, setIce] = useState<IceSession | null>(null);
  const [iceText, setIceText] = useState("");
  const [tipoIce, setTipoIce] = useState(DINAMICAS[0].tipo);
  const [promptIce, setPromptIce] = useState("");
  const [breakoutCount, setBreakoutCount] = useState(2);
  const [msg, setMsg] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
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
    if (tab === "pizarra") setPizarraAbierta(true);
  }, [tab]);

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
    setOcupado(true);
    try {
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
      const salas: Breakout[] = data.breakouts || [];
      setBreakouts(salas);
      const abiertas = salas.filter((b) => b.status === "open");
      const repartidos = abiertas.reduce((n, b) => n + b.assignments.length, 0);
      setMsg(
        repartidos === 0
          ? `${abiertas.length} salas listas, pero no había nadie conectado para repartir. Asigna a mano o vuelve a repartir cuando entren.`
          : `${abiertas.length} salas · ${repartidos} persona${repartidos === 1 ? "" : "s"} repartida${repartidos === 1 ? "" : "s"}`,
      );
    } finally {
      setOcupado(false);
    }
  }

  async function closeBreakouts() {
    setOcupado(true);
    try {
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
        setMsg("Salas cerradas — todos vuelven a la sala principal");
      }
    } finally {
      setOcupado(false);
    }
  }

  async function startIce() {
    setOcupado(true);
    try {
      const res = await fetch(`/api/live-classes/${liveClassId}/icebreakers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: tipoIce, prompt: promptIce.trim() || undefined }),
      });
      if (!res.ok) {
        setMsg("No se pudo abrir la dinámica");
        return;
      }
      const data = await res.json();
      setIce(data.session);
      setPromptIce("");
    } finally {
      setOcupado(false);
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

  async function closeIce() {
    if (!ice) return;
    await fetch(`/api/live-classes/${liveClassId}/icebreakers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "close", sessionId: ice.id }),
    });
    setIce(null);
  }

  const minutes = presence ? Math.floor(presence.connectedSeconds / 60) : 0;
  const seconds = presence ? presence.connectedSeconds % 60 : 0;
  const abiertas = breakouts.filter((b) => b.status === "open");
  const cerradas = breakouts.length - abiertas.length;
  const respuestas = ice?.stateJson?.responses ?? [];
  const yaRespondi = Boolean(userId && respuestas.some((r) => r.userId === userId));

  return (
    <div className={styles.wrap}>
      <div className={styles.presenceBar}>
        <span>
          Tiempo conectado: {minutes}m {seconds.toString().padStart(2, "0")}s
        </span>
        <span>Presencia registrada: {presence?.presencePercent ?? 0}% de la clase</span>
        {typeof enSala === "number" && (
          <span>
            En la sala: {enSala} {enSala === 1 ? "persona" : "personas"}
          </span>
        )}
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
            aria-selected={tab === key}
            className={tab === key ? styles.tabActive : styles.tab}
            onClick={() => setTab(key)}
          >
            {label}
            {key === "breakouts" && abiertas.length > 0 && (
              <span className={styles.pill}>{abiertas.length}</span>
            )}
            {key === "dinamicas" && ice && <span className={styles.pill}>·</span>}
          </button>
        ))}
      </div>

      {msg && <p className={styles.msg}>{msg}</p>}

      {tab === "meet" && (
        <p className={styles.hint}>
          La videollamada está arriba. Usa las pestañas para la pizarra, las salas de división y las
          dinámicas de integración.
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
                Ir a mi sala
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

      {/* La pizarra no se desmonta al cambiar de pestaña: desmontarla perdía
          lo que estuviera sin guardar y recargaba el documento entero. */}
      {pizarraAbierta && (
        <div className={styles.panel} hidden={tab !== "pizarra"}>
          <LiveWhiteboard liveClassId={liveClassId} isAdmin={isAdmin} />
        </div>
      )}

      {tab === "breakouts" && (
        <div className={styles.panel}>
          {isAdmin && (
            <>
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
                <button
                  type="button"
                  className={styles.primary}
                  disabled={ocupado}
                  onClick={() => void createBreakouts()}
                >
                  Repartir al grupo
                </button>
                <button
                  type="button"
                  className={styles.ghost}
                  disabled={ocupado || abiertas.length === 0}
                  onClick={() => void closeBreakouts()}
                >
                  Cerrar todas
                </button>
              </div>
              <p className={styles.muted}>
                Reparte solo a quien está conectado en este momento. Volver a repartir cierra el
                reparto anterior y hace uno nuevo.
              </p>
            </>
          )}

          <ul className={styles.list}>
            {abiertas.map((b) => (
              <li key={b.id}>
                <div>
                  <strong>{b.name}</strong>{" "}
                  <span className={styles.muted}>
                    ({b.assignments.length}{" "}
                    {b.assignments.length === 1 ? "persona" : "personas"})
                  </span>
                  <div className={styles.muted}>
                    {b.assignments.map((a) => a.nombre || a.userId).join(", ") || "Sin asignados"}
                  </div>
                </div>
                <div className={styles.filaAcciones}>
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
                  <a
                    className={styles.ghost}
                    href={b.roomUrl}
                    target="_blank"
                    rel="noreferrer"
                    title="Abrir esta sala en una pestaña aparte"
                  >
                    Pestaña
                  </a>
                </div>
              </li>
            ))}
            {abiertas.length === 0 && (
              <li className={styles.muted}>No hay salas de división abiertas.</li>
            )}
          </ul>

          {cerradas > 0 && (
            <p className={styles.muted}>
              {cerradas} sala{cerradas === 1 ? "" : "s"} de repartos anteriores, ya cerrada
              {cerradas === 1 ? "" : "s"}.
            </p>
          )}
        </div>
      )}

      {tab === "dinamicas" && (
        <div className={styles.panel}>
          {isAdmin && (
            <div className={styles.dinamicaForm}>
              <div className={styles.adminRow}>
                <label>
                  Tipo{" "}
                  <select value={tipoIce} onChange={(e) => setTipoIce(e.target.value)}>
                    {DINAMICAS.map((d) => (
                      <option key={d.tipo} value={d.tipo}>
                        {d.etiqueta}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className={styles.primary}
                  disabled={ocupado}
                  onClick={() => void startIce()}
                >
                  {ice ? "Abrir otra" : "Abrir dinámica"}
                </button>
              </div>
              <input
                className={styles.promptInput}
                value={promptIce}
                onChange={(e) => setPromptIce(e.target.value)}
                placeholder="Tu propia pregunta (si lo dejas vacío, proponemos una)"
                maxLength={300}
              />
            </div>
          )}

          {!ice && <p className={styles.muted}>No hay dinámica activa.</p>}

          {ice && (
            <div className={styles.ice}>
              <p className={styles.iceType}>{ice.type.replace(/_/g, " ")}</p>
              <p className={styles.icePrompt}>{ice.prompt}</p>

              <div className={styles.iceForm}>
                <input
                  value={iceText}
                  onChange={(e) => setIceText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void respondIce();
                  }}
                  placeholder={yaRespondi ? "Cambia tu respuesta…" : "Tu respuesta…"}
                  maxLength={500}
                />
                <button
                  type="button"
                  className={styles.primary}
                  disabled={!iceText.trim()}
                  onClick={() => void respondIce()}
                >
                  {yaRespondi ? "Actualizar" : "Enviar"}
                </button>
              </div>

              <p className={styles.muted}>
                {respuestas.length} respuesta{respuestas.length === 1 ? "" : "s"}
                {yaRespondi ? " · ya enviaste la tuya" : ""}
              </p>

              <ul className={styles.responses}>
                {respuestas.map((r) => (
                  <li key={r.userId}>
                    <strong>{r.nombre}:</strong> {r.text}
                  </li>
                ))}
              </ul>

              {isAdmin && (
                <button type="button" className={styles.ghost} onClick={() => void closeIce()}>
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
