"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { menosMovimiento } from "@/lib/aparicion";

/*
 * Video real de la portada de Psicología Aplicada.
 *
 * Todo viene de Pexels (licencia Pexels: uso comercial libre, sin atribución
 * obligatoria, sin poder revenderlo tal cual). Se recortó, se le quitó el
 * audio y se recodificó en H.264 con inicio rápido: 1600 px para escritorio
 * y 720 px para teléfono. El póster es un cuadro del mismo clip.
 *
 *   entrevista  https://www.pexels.com/video/7643457/  (0–9 s)
 *   consulta    https://www.pexels.com/video/8428348/  (2–10 s)
 *   candidata   https://www.pexels.com/video/7744229/
 *   equipo      https://www.pexels.com/video/7659850/
 */

export type ClipId = "entrevista" | "consulta" | "candidata" | "equipo";

type Clip = { video: string; movil: string; poster: string; posterMovil?: string; alt: string };

const R = "/psico/media";

export const CLIPS: Record<ClipId, Clip> = {
  entrevista: {
    video: `${R}/entrevista.mp4`,
    movil: `${R}/entrevista-movil.mp4`,
    poster: `${R}/entrevista.webp`,
    posterMovil: `${R}/entrevista-movil.webp`,
    alt: "Entrevista de selección frente a un ventanal: la entrevistadora y el candidato se dan la mano.",
  },
  consulta: {
    video: `${R}/consulta.mp4`,
    movil: `${R}/consulta-movil.mp4`,
    poster: `${R}/consulta.webp`,
    posterMovil: `${R}/consulta-movil.webp`,
    alt: "Una psicóloga escucha y toma notas durante una sesión en su consultorio.",
  },
  candidata: {
    video: `${R}/candidata.mp4`,
    movil: `${R}/candidata-movil.mp4`,
    poster: `${R}/candidata.webp`,
    alt: "Una candidata piensa su respuesta frente a la computadora.",
  },
  equipo: {
    video: `${R}/equipo.mp4`,
    movil: `${R}/equipo-movil.mp4`,
    poster: `${R}/equipo.webp`,
    alt: "Un equipo de trabajo revisa resultados alrededor de una mesa.",
  },
};

/** Teléfono o conexión que pide ahorrar datos: va la versión ligera. */
function quiereLigero(): boolean {
  if (typeof window === "undefined") return false;
  const con = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return window.matchMedia("(max-width: 760px)").matches || Boolean(con?.saveData);
}

export function useLigero() {
  const [ligero, setLigero] = useState(false);
  useEffect(() => setLigero(quiereLigero()), []);
  return ligero;
}

export type VideoRealHandle = { video: HTMLVideoElement | null };

/**
 * Un clip mudo que solo corre mientras está en pantalla. Con «menos
 * movimiento» se queda en el póster.
 */
export const VideoReal = forwardRef<
  VideoRealHandle,
  {
    clip: ClipId;
    className?: string;
    /** Encuadre dentro del recorte (object-position). */
    encuadre?: string;
    /** Si no, corre cuando entra en pantalla. */
    reproducir?: boolean;
    loop?: boolean;
    decorativo?: boolean;
    prioridad?: boolean;
    onEnded?: () => void;
    onListo?: () => void;
  }
>(function VideoReal(
  { clip, className, encuadre, reproducir, loop = true, decorativo, prioridad, onEnded, onListo },
  ref,
) {
  const nodo = useRef<HTMLVideoElement>(null);
  const ligero = useLigero();
  const [quieto, setQuieto] = useState(false);
  const [enPantalla, setEnPantalla] = useState(false);
  const c = CLIPS[clip];

  useImperativeHandle(ref, () => ({ video: nodo.current }), []);
  useEffect(() => setQuieto(menosMovimiento()), []);

  useEffect(() => {
    const v = nodo.current;
    if (!v || reproducir !== undefined) return;
    if (!("IntersectionObserver" in window)) {
      setEnPantalla(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => setEnPantalla(e.isIntersecting), { rootMargin: "120px" });
    io.observe(v);
    return () => io.disconnect();
  }, [reproducir]);

  const corre = !quieto && (reproducir ?? enPantalla);

  useEffect(() => {
    const v = nodo.current;
    if (!v) return;
    if (corre) {
      // El navegador puede negarse (modo ahorro): se queda el póster.
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [corre, ligero]);

  useEffect(() => {
    if (quieto) onListo?.();
  }, [quieto, onListo]);

  return (
    <video
      ref={nodo}
      // Cambiar de fuente obliga a recargar; la clave lo hace limpio.
      key={ligero ? "movil" : "escritorio"}
      className={className}
      style={encuadre ? { objectPosition: encuadre } : undefined}
      src={ligero ? c.movil : c.video}
      poster={ligero && c.posterMovil ? c.posterMovil : c.poster}
      muted
      playsInline
      loop={loop}
      preload={prioridad ? "auto" : "metadata"}
      disablePictureInPicture
      aria-hidden={decorativo || undefined}
      aria-label={decorativo ? undefined : c.alt}
      role={decorativo ? undefined : "img"}
      onEnded={onEnded}
      onLoadedData={onListo}
    />
  );
});
