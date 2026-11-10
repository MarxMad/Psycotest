"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { menosMovimiento } from "@/lib/aparicion";

/*
 * Video real de la portada de Psicología Aplicada.
 *
 * Todo viene de Pexels (licencia Pexels: uso comercial libre, sin atribución
 * obligatoria, sin poder revenderlo tal cual). Se recortó, se le quitó el
 * audio y se recodificó en H.264 con inicio rápido desde el original 4K:
 * 2560 px para escritorio (CRF 23) y 1280 px para teléfono (CRF 25), que en
 * vertical se recorta y necesita resolución de sobra. El póster es un cuadro
 * del mismo clip.
 *
 *   entrevista  https://www.pexels.com/video/7643457/  (0–9 s)
 *   expediente  https://www.pexels.com/video/5438975/  (0–9 s)
 *   acuerdo     https://www.pexels.com/video/8478749/  (2–11 s)
 *   candidata   https://www.pexels.com/video/7744229/
 *   consulta    https://www.pexels.com/video/8428348/  (2–10 s)
 *   escucha     https://www.pexels.com/video/6174827/  (0–9 s)
 *   sesion      https://www.pexels.com/video/8428208/  (0–9 s)
 *   reflexion   https://www.pexels.com/video/6878289/  (0–9 s, original 1080p)
 *   equipo      https://www.pexels.com/video/7659850/
 */

export type ClipId =
  | "entrevista"
  | "expediente"
  | "acuerdo"
  | "candidata"
  | "consulta"
  | "escucha"
  | "sesion"
  | "reflexion"
  | "equipo";

type Clip = { video: string; movil: string; poster: string; posterMovil: string; alt: string };

const R = "/psico/media";

const ALT: Record<ClipId, string> = {
  entrevista: "Entrevista de selección frente a un ventanal: la entrevistadora y el candidato conversan.",
  expediente: "Un reclutador revisa el expediente de una candidata durante la entrevista.",
  acuerdo: "Al terminar la entrevista, el candidato y el reclutador se ponen de pie y se dan la mano.",
  candidata: "Una candidata piensa su respuesta frente a la computadora.",
  consulta: "Una psicóloga escucha y toma notas durante una sesión en su consultorio.",
  escucha: "Una mujer habla con calma durante una sesión, sentada en un sofá claro.",
  sesion: "Un psicólogo con libreta conversa con su paciente en un consultorio luminoso.",
  reflexion: "Una mujer se detiene a pensar frente a su computadora, junto a la ventana.",
  equipo: "Un equipo de trabajo revisa resultados alrededor de una mesa.",
};

export const CLIPS = Object.fromEntries(
  (Object.keys(ALT) as ClipId[]).map((id) => [
    id,
    {
      video: `${R}/${id}.mp4`,
      movil: `${R}/${id}-movil.mp4`,
      poster: `${R}/${id}.webp`,
      posterMovil: `${R}/${id}-movil.webp`,
      alt: ALT[id],
    },
  ]),
) as Record<ClipId, Clip>;

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
      poster={ligero ? c.posterMovil : c.poster}
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
