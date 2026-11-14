"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  useChat,
  useConnectionState,
  useIsRecording,
  useLocalParticipant,
  useParticipantAttributes,
  useParticipants,
  useRoomContext,
  useTracks,
} from "@livekit/components-react";
import { ConnectionState, Track } from "livekit-client";
import {
  Circle,
  Hand,
  MessageSquare,
  Mic,
  MicOff,
  MonitorUp,
  PenTool,
  PhoneOff,
  Shuffle,
  Sparkles,
  Users,
  Video,
  VideoOff,
  X,
} from "lucide-react";
import { Escenario } from "./Escenario";
import { PanelChat, PanelDinamicas, PanelDivision, PanelPersonas } from "./Paneles";
import type { Dinamica, Pase, SalaDivision } from "./tipos";
import s from "./sala.module.css";

const LiveWhiteboard = dynamic(
  () => import("../LiveWhiteboard").then((m) => m.LiveWhiteboard),
  { ssr: false, loading: () => <p className={s.tenue}>Cargando pizarra…</p> },
);

type Panel = "personas" | "chat" | "division" | "dinamicas";

/** Segundos que se avisa antes de mover a alguien a su sala de división. */
const AVISO_MOVIMIENTO = 8;

export function Sala({
  pase,
  onIrASala,
  onTerminar,
  avisoExterno,
  onCerrarAvisoExterno,
}: {
  pase: Pase;
  onIrASala: (breakoutRoomId: string | null) => void;
  onTerminar: () => void;
  /** Aviso que viene de fuera de la sala (p. ej. un cambio de sala fallido). */
  avisoExterno?: string | null;
  onCerrarAvisoExterno?: () => void;
}) {
  const room = useRoomContext();
  const estado = useConnectionState();
  const grabando = useIsRecording();
  const personas = useParticipants();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } =
    useLocalParticipant();
  const { attributes } = useParticipantAttributes({ participant: localParticipant });
  const manoArriba = attributes?.mano === "1";

  const camaras = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }], {
    onlySubscribed: false,
  });
  const pantallas = useTracks([{ source: Track.Source.ScreenShare, withPlaceholder: false }], {
    onlySubscribed: false,
  });

  const [panel, setPanel] = useState<Panel | null>(null);
  const [pizarra, setPizarra] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [confirmarFin, setConfirmarFin] = useState(false);
  const [presencia, setPresencia] = useState<number | null>(null);

  // ---------------------------------------------------------------- chat
  const { chatMessages, send, isSending } = useChat();
  const [leidos, setLeidos] = useState(0);
  useEffect(() => {
    if (panel === "chat") setLeidos(chatMessages.length);
  }, [panel, chatMessages.length]);
  const sinLeer = panel === "chat" ? 0 : chatMessages.length - leidos;

  // ---------------------------------------------------------------- asistencia
  // Solo late mientras está conectado de verdad: el porcentaje CONOCER cuenta
  // tiempo dentro de la sala, no tiempo con la pestaña abierta.
  useEffect(() => {
    if (estado !== ConnectionState.Connected) return;
    let vivo = true;
    async function latir() {
      const res = await fetch(`/api/live-classes/${pase.clase.id}/heartbeat`, { method: "POST" });
      if (!res.ok || !vivo) return;
      const d = await res.json().catch(() => null);
      if (typeof d?.attendance?.presencePercent === "number") {
        setPresencia(d.attendance.presencePercent);
      }
    }
    void latir();
    const t = setInterval(() => void latir(), 30_000);
    return () => {
      vivo = false;
      clearInterval(t);
    };
  }, [estado, pase.clase.id]);

  // ---------------------------------------------------------------- arranque
  // Si el servidor no avisó (webhook sin configurar), quien dirige marca la
  // clase como en curso al conectarse.
  const marcada = useRef(false);
  useEffect(() => {
    if (!pase.anfitrion || marcada.current || estado !== ConnectionState.Connected) return;
    if (pase.clase.status !== "scheduled" || pase.breakout) return;
    marcada.current = true;
    void fetch(`/api/live-classes/${pase.clase.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "live" }),
    });
  }, [estado, pase]);

  // ---------------------------------------------------------------- división y dinámicas
  const [salas, setSalas] = useState<SalaDivision[]>([]);
  const [mia, setMia] = useState<SalaDivision | null>(null);
  const [dinamica, setDinamica] = useState<Dinamica | null>(null);
  const [cuentaAtras, setCuentaAtras] = useState<number | null>(null);

  const refrescar = useCallback(async () => {
    const [rb, ri] = await Promise.all([
      fetch(`/api/live-classes/${pase.clase.id}/breakouts`),
      fetch(`/api/live-classes/${pase.clase.id}/icebreakers`),
    ]);
    if (rb.ok) {
      const d = await rb.json();
      setSalas(d.breakouts ?? []);
      setMia(d.mine ?? null);
    }
    if (ri.ok) {
      const d = await ri.json();
      setDinamica(d.active ?? null);
    }
  }, [pase.clase.id]);

  useEffect(() => {
    void refrescar();
    const t = setInterval(() => void refrescar(), 8_000);
    return () => clearInterval(t);
  }, [refrescar]);

  // El alumno se mueve solo: a su sala cuando lo asignan, de regreso cuando
  // la cierran. Se le avisa unos segundos antes para que no le tome por sorpresa.
  const destino = pase.anfitrion
    ? undefined
    : !pase.breakout && mia?.status === "open"
      ? mia.id
      : pase.breakout && mia?.id !== pase.breakout.id
        ? (mia?.id ?? null)
        : undefined;

  useEffect(() => {
    if (destino === undefined) {
      setCuentaAtras(null);
      return;
    }
    setCuentaAtras(AVISO_MOVIMIENTO);
    const t = setInterval(() => {
      setCuentaAtras((n) => {
        if (n === null) return null;
        if (n <= 1) {
          clearInterval(t);
          onIrASala(destino);
          return null;
        }
        return n - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [destino, onIrASala]);

  // Una dinámica nueva abre su panel para que nadie se la pierda.
  const ultimaDinamica = useRef<string | null>(null);
  useEffect(() => {
    if (dinamica && dinamica.id !== ultimaDinamica.current) {
      ultimaDinamica.current = dinamica.id;
      if (!pase.anfitrion) setPanel("dinamicas");
    }
  }, [dinamica, pase.anfitrion]);

  // ---------------------------------------------------------------- controles
  async function intentar(accion: () => Promise<unknown>, error: string) {
    try {
      setAviso(null);
      await accion();
    } catch {
      setAviso(error);
    }
  }

  const puedeCompartir = pase.anfitrion || Boolean(pase.breakout);

  async function cambiarGrabacion() {
    const res = await fetch(`/api/live-classes/${pase.clase.id}/grabacion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: grabando ? "detener" : "iniciar" }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setAviso(d.error ?? "No se pudo cambiar la grabación");
    }
  }

  async function terminarClase() {
    setConfirmarFin(false);
    const res = await fetch(`/api/live-classes/${pase.clase.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    if (res.ok) onTerminar();
    else setAviso("No se pudo terminar la clase");
  }

  const reconectando = estado === ConnectionState.Reconnecting;
  const pizarraEditable = pase.anfitrion || Boolean(pase.breakout);

  return (
    <div className={s.dentro}>
      <header className={s.encabezado}>
        <div className={s.encabezadoTitulo}>
          <span className={s.enVivo}>
            <span className={s.punto} /> En vivo
          </span>
          <h1>{pase.clase.title}</h1>
          {pase.breakout && (
            <span className={s.insigniaSala}>
              {pase.breakout.name}
              <button type="button" onClick={() => onIrASala(null)}>
                Volver a la principal
              </button>
            </span>
          )}
        </div>
        <div className={s.encabezadoEstado}>
          {grabando && (
            <span className={s.grabando}>
              <Circle size={10} fill="currentColor" /> Grabando
            </span>
          )}
          {!pase.anfitrion && presencia !== null && (
            <span className={s.tenue} title="Tiempo conectado frente a la duración de la clase">
              Asistencia {presencia}%
            </span>
          )}
          <span className={s.tenue}>
            <Users size={14} /> {personas.length}
          </span>
        </div>
      </header>

      {reconectando && <div className={s.franja}>Se cortó la conexión. Reconectando…</div>}
      {cuentaAtras !== null && (
        <div className={s.franjaAcento}>
          {destino
            ? `Te asignaron a ${mia?.name ?? "una sala de división"}. Te movemos en ${cuentaAtras} s.`
            : `La sala de división se cerró. Regresas a la sala principal en ${cuentaAtras} s.`}
          <button type="button" onClick={() => destino !== undefined && onIrASala(destino)}>
            Ir ahora
          </button>
        </div>
      )}
      {(aviso || avisoExterno) && (
        <div className={s.franja} role="status">
          {aviso ?? avisoExterno}
          <button
            type="button"
            onClick={() => {
              setAviso(null);
              onCerrarAvisoExterno?.();
            }}
            aria-label="Cerrar aviso"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className={s.cuerpo} data-panel={panel ?? undefined}>
        <main className={s.escenario}>
          <Escenario
            camaras={camaras}
            pantallas={pantallas}
            pizarra={
              pizarra ? (
                <div className={s.pizarra}>
                  <LiveWhiteboard
                    key={pase.breakout?.id ?? "principal"}
                    liveClassId={pase.clase.id}
                    breakoutRoomId={pase.breakout?.id ?? null}
                    isAdmin={pizarraEditable}
                    llenar
                  />
                </div>
              ) : null
            }
          />
        </main>

        {panel && (
          <aside className={s.panel} aria-label="Panel lateral">
            <div className={s.panelEncabezado}>
              <h2>
                {panel === "personas" && "Personas"}
                {panel === "chat" && "Chat"}
                {panel === "division" && "Salas de división"}
                {panel === "dinamicas" && "Dinámicas"}
              </h2>
              <button type="button" onClick={() => setPanel(null)} aria-label="Cerrar panel">
                <X size={18} />
              </button>
            </div>
            {panel === "personas" && <PanelPersonas pase={pase} />}
            {panel === "chat" && (
              <PanelChat mensajes={chatMessages} enviar={send} enviando={isSending} />
            )}
            {panel === "division" && (
              <PanelDivision
                pase={pase}
                salas={salas}
                mia={mia}
                onIrASala={onIrASala}
                onCambio={(lista) => {
                  if (lista) setSalas(lista);
                  void refrescar();
                }}
              />
            )}
            {panel === "dinamicas" && (
              <PanelDinamicas pase={pase} activa={dinamica} onCambio={setDinamica} />
            )}
          </aside>
        )}
      </div>

      <footer className={s.barra}>
        <div className={s.barraGrupo}>
          <Control
            activo={isMicrophoneEnabled}
            etiqueta={isMicrophoneEnabled ? "Silenciar" : "Activar micro"}
            onClick={() =>
              void intentar(
                () => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled),
                "No se pudo usar el micrófono. Revisa los permisos del navegador.",
              )
            }
          >
            {isMicrophoneEnabled ? <Mic size={20} /> : <MicOff size={20} />}
          </Control>
          <Control
            activo={isCameraEnabled}
            etiqueta={isCameraEnabled ? "Apagar cámara" : "Encender cámara"}
            onClick={() =>
              void intentar(
                () => localParticipant.setCameraEnabled(!isCameraEnabled),
                "No se pudo usar la cámara. Revisa los permisos del navegador.",
              )
            }
          >
            {isCameraEnabled ? <Video size={20} /> : <VideoOff size={20} />}
          </Control>
          {puedeCompartir && (
            <Control
              activo={!isScreenShareEnabled}
              resaltado={isScreenShareEnabled}
              etiqueta={isScreenShareEnabled ? "Dejar de compartir" : "Compartir pantalla"}
              onClick={() =>
                void intentar(
                  () => localParticipant.setScreenShareEnabled(!isScreenShareEnabled, { audio: true }),
                  "No se pudo compartir la pantalla.",
                )
              }
            >
              <MonitorUp size={20} />
            </Control>
          )}
          {!pase.anfitrion && (
            <Control
              activo
              resaltado={manoArriba}
              etiqueta={manoArriba ? "Bajar mano" : "Levantar mano"}
              onClick={() =>
                void intentar(
                  () => localParticipant.setAttributes({ mano: manoArriba ? "" : "1" }),
                  "No se pudo levantar la mano.",
                )
              }
            >
              <Hand size={20} />
            </Control>
          )}
        </div>

        <div className={s.barraGrupo}>
          <Control activo resaltado={pizarra} etiqueta="Pizarra" onClick={() => setPizarra((v) => !v)}>
            <PenTool size={20} />
          </Control>
          <Control
            activo
            resaltado={panel === "personas"}
            etiqueta="Personas"
            onClick={() => setPanel((p) => (p === "personas" ? null : "personas"))}
          >
            <Users size={20} />
          </Control>
          <Control
            activo
            resaltado={panel === "chat"}
            etiqueta="Chat"
            contador={sinLeer}
            onClick={() => setPanel((p) => (p === "chat" ? null : "chat"))}
          >
            <MessageSquare size={20} />
          </Control>
          <Control
            activo
            resaltado={panel === "division"}
            etiqueta="División"
            contador={salas.filter((b) => b.status === "open").length}
            onClick={() => setPanel((p) => (p === "division" ? null : "division"))}
          >
            <Shuffle size={20} />
          </Control>
          <Control
            activo
            resaltado={panel === "dinamicas"}
            etiqueta="Dinámicas"
            contador={dinamica ? 1 : 0}
            onClick={() => setPanel((p) => (p === "dinamicas" ? null : "dinamicas"))}
          >
            <Sparkles size={20} />
          </Control>
        </div>

        <div className={s.barraGrupo}>
          {pase.anfitrion && pase.puedeGrabar && !pase.breakout && (
            <Control
              activo
              resaltado={grabando}
              peligro={grabando}
              etiqueta={grabando ? "Detener grabación" : "Grabar"}
              onClick={() => void cambiarGrabacion()}
            >
              <Circle size={18} fill={grabando ? "currentColor" : "none"} />
            </Control>
          )}
          {pase.anfitrion && !pase.breakout && (
            <div className={s.terminarEnvoltura}>
              {confirmarFin && (
                <div className={s.confirmar} role="dialog" aria-label="Terminar la clase">
                  <p>¿Terminar la clase para todos? Se cierran también las salas de división.</p>
                  <div>
                    <button type="button" className={s.peligroSolido} onClick={() => void terminarClase()}>
                      Terminar para todos
                    </button>
                    <button type="button" className={s.secundario} onClick={() => setConfirmarFin(false)}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
              <button type="button" className={s.botonTerminar} onClick={() => setConfirmarFin((v) => !v)}>
                Terminar clase
              </button>
            </div>
          )}
          <button
            type="button"
            className={s.botonSalir}
            onClick={() => void room.disconnect()}
            aria-label="Salir de la sala"
            title="Salir de la sala"
          >
            <PhoneOff size={20} />
          </button>
        </div>
      </footer>
    </div>
  );
}

function Control({
  activo,
  resaltado = false,
  peligro = false,
  etiqueta,
  contador = 0,
  onClick,
  children,
}: {
  activo: boolean;
  resaltado?: boolean;
  peligro?: boolean;
  etiqueta: string;
  contador?: number;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={s.control}
      data-apagado={!activo || undefined}
      data-resaltado={resaltado || undefined}
      data-peligro={peligro || undefined}
      onClick={onClick}
      aria-label={etiqueta}
      aria-pressed={resaltado}
      title={etiqueta}
    >
      {children}
      {contador > 0 && <span className={s.contador}>{contador > 9 ? "9+" : contador}</span>}
      <span className={s.controlEtiqueta}>{etiqueta}</span>
    </button>
  );
}
