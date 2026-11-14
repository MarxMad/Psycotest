"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { LiveKitRoom, RoomAudioRenderer, StartAudio } from "@livekit/components-react";
import { DisconnectReason, VideoPresets } from "livekit-client";
import { Antesala } from "./Antesala";
import { Sala } from "./Sala";
import type { Pase, Preferencias } from "./tipos";
import s from "./sala.module.css";

type Fase =
  | { tipo: "cargando" }
  | { tipo: "error"; mensaje: string; iniciarSesion?: boolean }
  | { tipo: "antesala" }
  | { tipo: "dentro" }
  | { tipo: "fuera"; mensaje: string; puedeVolver: boolean };

const OPCIONES_SALA = {
  // Cada quien recibe la calidad que cabe en su conexión y en el tamaño de
  // su mosaico; con muchos alumnos es lo que mantiene la clase fluida.
  adaptiveStream: true,
  dynacast: true,
  videoCaptureDefaults: { resolution: VideoPresets.h720.resolution },
  publishDefaults: { simulcast: true },
};

function motivoDeSalida(motivo?: DisconnectReason): { mensaje: string; puedeVolver: boolean } {
  switch (motivo) {
    case DisconnectReason.ROOM_DELETED:
      return { mensaje: "La clase terminó. ¡Gracias por participar!", puedeVolver: false };
    case DisconnectReason.PARTICIPANT_REMOVED:
      return { mensaje: "Quien dirige la clase te sacó de la sala.", puedeVolver: false };
    case DisconnectReason.DUPLICATE_IDENTITY:
      return {
        mensaje: "Abriste esta clase en otra ventana o dispositivo; la clase sigue allá.",
        puedeVolver: true,
      };
    case DisconnectReason.CLIENT_INITIATED:
      return { mensaje: "Saliste de la clase.", puedeVolver: true };
    default:
      return { mensaje: "Se perdió la conexión con la clase.", puedeVolver: true };
  }
}

/**
 * Sala de clase en vivo, de punta a punta: pide el pase, muestra la
 * antesala, conecta, mueve entre la sala principal y las de división, y al
 * salir explica por qué.
 *
 * Ocupa toda la pantalla y toma el acento y la tipografía de la marca que la
 * envuelve (variables `--ch-*` del canal), así se siente parte de la
 * plataforma y no una ventana de terceros.
 */
export function SalaEnVivo({ liveClassId, salida }: { liveClassId: string; salida: string }) {
  const [fase, setFase] = useState<Fase>({ tipo: "cargando" });
  const [pase, setPase] = useState<Pase | null>(null);
  const [prefs, setPrefs] = useState<Preferencias>({ audio: true, video: true });
  const cambiando = useRef(false);
  const dentro = useRef(false);

  const [avisoCambio, setAvisoCambio] = useState<string | null>(null);

  /**
   * Pide un pase. Al entrar, un fallo es una pantalla de error; al cambiar
   * de sala no: la persona sigue donde estaba y solo se le avisa.
   */
  const pedirPase = useCallback(
    async (breakoutRoomId: string | null, alCambiar = false): Promise<Pase | null> => {
      const res = await fetch(`/api/live-classes/${liveClassId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(breakoutRoomId ? { breakoutRoomId } : {}),
      });
      if (res.ok) return (await res.json()) as Pase;

      const d = await res.json().catch(() => ({}));
      if (alCambiar) {
        setAvisoCambio(d.error ?? "No se pudo cambiar de sala.");
      } else if (res.status === 401) {
        setFase({ tipo: "error", mensaje: "Inicia sesión para entrar a la clase.", iniciarSesion: true });
      } else {
        setFase({ tipo: "error", mensaje: d.error ?? "No se pudo abrir la sala." });
      }
      return null;
    },
    [liveClassId],
  );

  useEffect(() => {
    let vivo = true;
    void pedirPase(null)
      .then((p) => {
        if (!vivo || !p) return;
        setPase(p);
        setFase({ tipo: "antesala" });
      })
      .catch(() => vivo && setFase({ tipo: "error", mensaje: "Error de red al abrir la sala." }));
    return () => {
      vivo = false;
    };
  }, [pedirPase]);

  // Al cerrar la pestaña o navegar fuera, se cierra la asistencia. El aviso
  // del servidor de video también lo hace; esto es por si llega tarde.
  useEffect(() => {
    const salir = () => {
      if (dentro.current) navigator.sendBeacon(`/api/live-classes/${liveClassId}/leave`);
    };
    window.addEventListener("pagehide", salir);
    return () => {
      window.removeEventListener("pagehide", salir);
      salir();
    };
  }, [liveClassId]);

  const irASala = useCallback(
    async (breakoutRoomId: string | null) => {
      setAvisoCambio(null);
      const nuevo = await pedirPase(breakoutRoomId, true).catch(() => {
        setAvisoCambio("Error de red al cambiar de sala.");
        return null;
      });
      if (!nuevo) return;
      // Solo ahora: desconectar la sala anterior es parte del cambio, no una salida.
      cambiando.current = true;
      setPase(nuevo);
    },
    [pedirPase],
  );

  const alDesconectar = useCallback(
    (motivo?: DisconnectReason) => {
      // Cambiar de sala desconecta la anterior a propósito: no es una salida.
      if (cambiando.current) return;
      dentro.current = false;
      if (motivo !== DisconnectReason.DUPLICATE_IDENTITY) {
        void fetch(`/api/live-classes/${liveClassId}/leave`, { method: "POST" });
      }
      setFase({ tipo: "fuera", ...motivoDeSalida(motivo) });
    },
    [liveClassId],
  );

  async function volverAEntrar() {
    setFase({ tipo: "cargando" });
    const p = await pedirPase(null);
    if (p) {
      setPase(p);
      setFase({ tipo: "antesala" });
    }
  }

  return (
    <div className={s.sala}>
      {fase.tipo === "cargando" && (
        <div className={s.centro}>
          <div className={s.girando} aria-hidden />
          <p className={s.tenue}>Preparando la sala…</p>
        </div>
      )}

      {fase.tipo === "error" && (
        <div className={s.centro}>
          <p className={s.mensajeGrande}>{fase.mensaje}</p>
          <div className={s.acciones}>
            {fase.iniciarSesion ? (
              <Link className={s.primario} href={`/login?next=${encodeURIComponent(salida)}`}>
                Iniciar sesión
              </Link>
            ) : null}
            <Link className={s.secundario} href={salida}>
              Volver
            </Link>
          </div>
        </div>
      )}

      {fase.tipo === "antesala" && pase && (
        <>
          <Link className={s.cerrarSala} href={salida}>
            ← Volver
          </Link>
          <Antesala
            pase={pase}
            onEntrar={(p) => {
              setPrefs(p);
              dentro.current = true;
              setFase({ tipo: "dentro" });
            }}
          />
        </>
      )}

      {fase.tipo === "dentro" && pase && (
        <LiveKitRoom
          key={pase.sala}
          serverUrl={pase.serverUrl}
          token={pase.token}
          connect
          audio={prefs.audio ? { deviceId: prefs.audioDeviceId } : false}
          video={prefs.video ? { deviceId: prefs.videoDeviceId } : false}
          options={OPCIONES_SALA}
          onConnected={() => {
            cambiando.current = false;
          }}
          onDisconnected={alDesconectar}
          onError={() => {
            /* los fallos de dispositivo se avisan dentro de la sala */
          }}
          className={s.conexion}
        >
          <Sala
            pase={pase}
            onIrASala={irASala}
            avisoExterno={avisoCambio}
            onCerrarAvisoExterno={() => setAvisoCambio(null)}
            onTerminar={() => {
              dentro.current = false;
              setFase({ tipo: "fuera", mensaje: "Terminaste la clase para todos.", puedeVolver: false });
            }}
          />
          <RoomAudioRenderer />
          <StartAudio label="Toca para activar el sonido de la clase" className={s.activarAudio} />
        </LiveKitRoom>
      )}

      {fase.tipo === "fuera" && (
        <div className={s.centro}>
          <p className={s.mensajeGrande}>{fase.mensaje}</p>
          <div className={s.acciones}>
            {fase.puedeVolver && (
              <button type="button" className={s.primario} onClick={() => void volverAEntrar()}>
                Volver a entrar
              </button>
            )}
            <Link className={s.secundario} href={salida}>
              Salir
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
