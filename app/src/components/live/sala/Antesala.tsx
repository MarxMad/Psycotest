"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMediaDevices } from "@livekit/components-react";
import { Track, createLocalTracks, type LocalTrack, type LocalVideoTrack } from "livekit-client";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";
import type { Pase, Preferencias } from "./tipos";
import { iniciales } from "./tipos";
import s from "./sala.module.css";

const CLAVE = "sala-preferencias";

function leerGuardadas(): Partial<Preferencias> {
  try {
    return JSON.parse(localStorage.getItem(CLAVE) ?? "{}") as Partial<Preferencias>;
  } catch {
    return {};
  }
}

/**
 * Antesala: la persona se ve y se escucha antes de entrar, elige cámara y
 * micrófono, y decide si entra con ellos encendidos. Evita el clásico «¿me
 * escuchan?» de los primeros cinco minutos de clase.
 */
export function Antesala({
  pase,
  onEntrar,
}: {
  pase: Pase;
  onEntrar: (preferencias: Preferencias) => void;
}) {
  const [prefs, setPrefs] = useState<Preferencias>({ audio: true, video: true });
  const [fallo, setFallo] = useState<string | null>(null);

  useEffect(() => {
    // Lo elegido la vez pasada, para no configurar cada clase de nuevo.
    setPrefs((p) => ({ ...p, ...leerGuardadas() }));
  }, []);

  const camaras = useMediaDevices({ kind: "videoinput" });
  const microfonos = useMediaDevices({ kind: "audioinput" });

  const opciones = useMemo(
    () => ({
      audio: prefs.audio ? { deviceId: prefs.audioDeviceId } : false,
      video: prefs.video ? { deviceId: prefs.videoDeviceId } : false,
    }),
    [prefs.audio, prefs.video, prefs.audioDeviceId, prefs.videoDeviceId],
  );

  // Pistas de vista previa. Se crean a mano y no con `usePreviewTracks`: ese
  // hook las cerraba al montar dos veces (modo estricto) y la cámara quedaba
  // en negro. Cada cambio de dispositivo cierra las anteriores.
  const [pistas, setPistas] = useState<LocalTrack[]>([]);
  useEffect(() => {
    let cancelado = false;
    let creadas: LocalTrack[] = [];
    setFallo(null);
    if (!opciones.audio && !opciones.video) {
      setPistas([]);
      return;
    }
    createLocalTracks(opciones)
      .then((t) => {
        if (cancelado) {
          t.forEach((p) => p.stop());
          return;
        }
        creadas = t;
        setPistas(t);
      })
      .catch(() => {
        if (!cancelado) {
          setFallo(
            "No pudimos usar tu cámara o micrófono. Revisa los permisos del navegador; también puedes entrar sin ellos.",
          );
        }
      });
    return () => {
      cancelado = true;
      creadas.forEach((p) => p.stop());
    };
  }, [opciones]);

  const video = pistas.find((t) => t.kind === Track.Kind.Video) as LocalVideoTrack | undefined;
  const nodoVideo = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = nodoVideo.current;
    if (!video || !el) return;
    video.attach(el);
    return () => {
      video.detach(el);
    };
  }, [video]);

  const nivel = useNivelDeVoz(pistas.find((t) => t.kind === Track.Kind.Audio)?.mediaStreamTrack);

  function entrar() {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(prefs));
    } catch {
      // Sin almacenamiento: se elige de nuevo la próxima vez.
    }
    onEntrar(prefs);
  }

  const hora = new Date(pase.clase.scheduledAt).toLocaleString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={s.antesala}>
      <div className={s.antesalaVista}>
        {prefs.video && video ? (
          <video ref={nodoVideo} className={s.antesalaVideo} autoPlay muted playsInline />
        ) : (
          <div className={s.antesalaAvatar}>
            <span>{iniciales(pase.user.nombre)}</span>
          </div>
        )}
        <div className={s.antesalaControles}>
          <button
            type="button"
            className={prefs.audio ? s.boton : s.botonApagado}
            onClick={() => setPrefs((p) => ({ ...p, audio: !p.audio }))}
            aria-label={prefs.audio ? "Apagar micrófono" : "Encender micrófono"}
          >
            {prefs.audio ? <Mic size={20} /> : <MicOff size={20} />}
          </button>
          <button
            type="button"
            className={prefs.video ? s.boton : s.botonApagado}
            onClick={() => setPrefs((p) => ({ ...p, video: !p.video }))}
            aria-label={prefs.video ? "Apagar cámara" : "Encender cámara"}
          >
            {prefs.video ? <Video size={20} /> : <VideoOff size={20} />}
          </button>
        </div>
        {prefs.audio && (
          <div className={s.medidor} aria-hidden>
            <span style={{ transform: `scaleX(${nivel})` }} />
          </div>
        )}
      </div>

      <div className={s.antesalaDatos}>
        <p className={s.antesalaEtiqueta}>
          {pase.anfitrion ? "Vas a dirigir la clase" : "Estás por entrar a clase"}
        </p>
        <h1 className={s.antesalaTitulo}>{pase.clase.title}</h1>
        <p className={s.tenue}>
          {hora} · {pase.clase.durationMinutes} min
        </p>

        <label className={s.campo}>
          <span>Cámara</span>
          <select
            value={prefs.videoDeviceId ?? ""}
            onChange={(e) => setPrefs((p) => ({ ...p, videoDeviceId: e.target.value || undefined }))}
            disabled={!prefs.video}
          >
            <option value="">Predeterminada</option>
            {camaras.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || "Cámara"}
              </option>
            ))}
          </select>
        </label>
        <label className={s.campo}>
          <span>Micrófono</span>
          <select
            value={prefs.audioDeviceId ?? ""}
            onChange={(e) => setPrefs((p) => ({ ...p, audioDeviceId: e.target.value || undefined }))}
            disabled={!prefs.audio}
          >
            <option value="">Predeterminado</option>
            {microfonos.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || "Micrófono"}
              </option>
            ))}
          </select>
        </label>

        {fallo && <p className={s.aviso}>{fallo}</p>}

        <button type="button" className={s.primario} onClick={entrar}>
          {pase.anfitrion ? "Abrir la clase" : "Entrar a la clase"}
        </button>
        {!pase.anfitrion && (
          <p className={s.tenue}>
            Tu asistencia se registra mientras estés conectado a la clase.
          </p>
        )}
      </div>
    </div>
  );
}

/** Nivel del micrófono de 0 a 1, para ver que sí entra sonido. */
function useNivelDeVoz(pista: MediaStreamTrack | undefined): number {
  const [nivel, setNivel] = useState(0);

  useEffect(() => {
    if (!pista) {
      setNivel(0);
      return;
    }
    const contexto = new AudioContext();
    const fuente = contexto.createMediaStreamSource(new MediaStream([pista]));
    const analizador = contexto.createAnalyser();
    analizador.fftSize = 256;
    fuente.connect(analizador);
    const datos = new Uint8Array(analizador.frequencyBinCount);
    let cuadro = 0;

    const medir = () => {
      analizador.getByteFrequencyData(datos);
      const promedio = datos.reduce((a, b) => a + b, 0) / datos.length;
      setNivel(Math.min(1, promedio / 60));
      cuadro = requestAnimationFrame(medir);
    };
    medir();

    return () => {
      cancelAnimationFrame(cuadro);
      fuente.disconnect();
      void contexto.close();
    };
  }, [pista]);

  return nivel;
}
