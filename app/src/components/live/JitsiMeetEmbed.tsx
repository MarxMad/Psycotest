"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./JitsiMeetEmbed.module.css";

/**
 * Estado de la conexión a la sala.
 *
 * `esperando` es el caso importante: meet.jit.si no arranca la conferencia
 * hasta que entra un moderador, y un iframe no puede autenticarse. Cuando
 * pasan unos segundos sin entrar, lo decimos en vez de dejar girando la rueda.
 */
export type EstadoSala = "conectando" | "esperando" | "dentro" | "fuera" | "error";

type JitsiApi = {
  dispose: () => void;
  addListener: (evento: string, cb: (datos: never) => void) => void;
  executeCommand: (comando: string, ...args: unknown[]) => void;
};

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (dominio: string, opciones: Record<string, unknown>) => JitsiApi;
  }
}

/** Un solo <script> por dominio aunque se monten varias salas. */
const guiones = new Map<string, Promise<void>>();

function cargarApi(dominio: string): Promise<void> {
  const previo = guiones.get(dominio);
  if (previo) return previo;

  const carga = new Promise<void>((resolver, rechazar) => {
    if (window.JitsiMeetExternalAPI) {
      resolver();
      return;
    }
    const nodo = document.createElement("script");
    nodo.src = `https://${dominio}/external_api.js`;
    nodo.async = true;
    nodo.onload = () => resolver();
    nodo.onerror = () => rechazar(new Error("external_api"));
    document.head.appendChild(nodo);
  });

  guiones.set(dominio, carga);
  return carga;
}

function partes(roomUrl: string): { dominio: string; sala: string } | null {
  try {
    const url = new URL(roomUrl);
    const sala = url.pathname.replace(/^\/+/, "");
    if (!sala) return null;
    return { dominio: url.host, sala };
  } catch {
    return null;
  }
}

type Props = {
  roomUrl: string;
  displayName: string;
  email?: string | null;
  className?: string;
  /** Cambios de estado de la conexión. */
  onEstado?: (estado: EstadoSala) => void;
  /** Se vuelve moderador: en meet.jit.si significa que la reunión ya arrancó. */
  onModerador?: () => void;
  /** Cuántas personas hay en la sala, contándome. */
  onParticipantes?: (total: number) => void;
};

export function JitsiMeetEmbed({
  roomUrl,
  displayName,
  email,
  className,
  onEstado,
  onModerador,
  onParticipantes,
}: Props) {
  const contenedor = useRef<HTMLDivElement>(null);
  const [estado, setEstado] = useState<EstadoSala>("conectando");

  // Los callbacks viven en una ref: si entraran en las dependencias, cada
  // render del padre destruiría y recrearía la videollamada.
  const avisos = useRef({ onEstado, onModerador, onParticipantes });
  avisos.current = { onEstado, onModerador, onParticipantes };

  useEffect(() => {
    const destino = partes(roomUrl);
    if (!destino) {
      setEstado("error");
      avisos.current.onEstado?.("error");
      return;
    }

    let vivo = true;
    let api: JitsiApi | null = null;
    let espera: ReturnType<typeof setTimeout> | null = null;
    let dentro = false;
    const otros = new Set<string>();

    const marcar = (nuevo: EstadoSala) => {
      if (!vivo) return;
      setEstado(nuevo);
      avisos.current.onEstado?.(nuevo);
    };

    void cargarApi(destino.dominio)
      .then(() => {
        if (!vivo || !contenedor.current || !window.JitsiMeetExternalAPI) return;

        api = new window.JitsiMeetExternalAPI(destino.dominio, {
          roomName: destino.sala,
          parentNode: contenedor.current,
          userInfo: { displayName: displayName || "Participante", email: email || undefined },
          configOverwrite: {
            prejoinPageEnabled: false,
            prejoinConfig: { enabled: false },
            startWithAudioMuted: true,
            disableDeepLinking: true,
          },
          interfaceConfigOverwrite: {
            MOBILE_APP_PROMO: false,
            SHOW_JITSI_WATERMARK: false,
          },
        });

        api.addListener("videoConferenceJoined", () => {
          dentro = true;
          if (espera) clearTimeout(espera);
          marcar("dentro");
          avisos.current.onParticipantes?.(otros.size + 1);
        });

        api.addListener("videoConferenceLeft", () => {
          dentro = false;
          marcar("fuera");
        });

        api.addListener("participantRoleChanged", (datos: { role?: string }) => {
          if (datos?.role === "moderator") avisos.current.onModerador?.();
        });

        api.addListener("participantJoined", (datos: { id?: string }) => {
          if (datos?.id) otros.add(datos.id);
          avisos.current.onParticipantes?.(otros.size + (dentro ? 1 : 0));
        });

        api.addListener("participantLeft", (datos: { id?: string }) => {
          if (datos?.id) otros.delete(datos.id);
          avisos.current.onParticipantes?.(otros.size + (dentro ? 1 : 0));
        });

        // `errorOccurred` salta por cosas menores —una cámara ocupada, un
        // micrófono sin permiso— y Jitsi ya las explica dentro del marco. No
        // se convierte en «no se pudo cargar»: eso asustaría en medio de una
        // clase que funciona, o taparía el aviso de que falta el anfitrión.
        // El estado de error queda para lo que sí impide montar la sala.

        // Sin moderador la conferencia no empieza y `videoConferenceJoined`
        // nunca llega. A los ocho segundos lo damos por esperando.
        espera = setTimeout(() => {
          if (!dentro) marcar("esperando");
        }, 8000);
      })
      .catch(() => marcar("error"));

    return () => {
      vivo = false;
      if (espera) clearTimeout(espera);
      api?.dispose();
    };
  }, [roomUrl, displayName, email]);

  return (
    <div className={`${styles.shell} ${className ?? ""}`} data-estado={estado}>
      <div ref={contenedor} className={styles.frame} />
      {estado === "conectando" && <p className={styles.aviso}>Conectando a la sala…</p>}
      {estado === "error" && (
        <p className={styles.aviso}>
          No se pudo cargar la videollamada.{" "}
          <a href={roomUrl} target="_blank" rel="noreferrer">
            Abrir en una pestaña
          </a>
        </p>
      )}
    </div>
  );
}
