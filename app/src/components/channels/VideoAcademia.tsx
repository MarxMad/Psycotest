"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";
import { Play } from "lucide-react";
import { menosMovimiento } from "@/lib/aparicion";
import s from "./VideoAcademia.module.css";

export type Pieza = {
  id: string;
  titulo: string;
  pie: string;
  poster: string;
  /** Identificador de YouTube, si el video vive allá. */
  youtube?: string;
  /** Archivo servido por el propio sitio (carpeta /public). */
  archivo?: string;
};

function Reproductor({ pieza, grande }: { pieza: Pieza; grande?: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  const hayVideo = Boolean(pieza.youtube || pieza.archivo);

  // El marco crece un punto al abrirse: el video toma el lugar del cartel.
  useEffect(() => {
    if (!abierto || !caja.current || menosMovimiento()) return;
    animate(caja.current, { scale: [0.985, 1], opacity: [0.6, 1], duration: 420, ease: "out(3)" });
  }, [abierto]);

  return (
    <div className={`${s.pieza} ${grande ? s.piezaGrande : ""}`} ref={caja}>
      {abierto && pieza.youtube ? (
        <iframe
          className={s.marco}
          src={`https://www.youtube-nocookie.com/embed/${pieza.youtube}?autoplay=1&rel=0`}
          title={pieza.titulo}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : abierto && pieza.archivo ? (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video className={s.marco} src={pieza.archivo} controls autoPlay playsInline />
      ) : (
        <button
          type="button"
          className={s.cartel}
          onClick={() => hayVideo && setAbierto(true)}
          disabled={!hayVideo}
          aria-label={hayVideo ? `Reproducir: ${pieza.titulo}` : `${pieza.titulo} — próximamente`}
        >
          <Image
            src={pieza.poster}
            alt=""
            fill
            sizes={grande ? "(max-width: 900px) 100vw, 60vw" : "(max-width: 900px) 100vw, 30vw"}
            className={s.poster}
          />
          <span className={s.play} aria-hidden>
            <Play size={grande ? 26 : 18} fill="currentColor" strokeWidth={0} />
          </span>
          {!hayVideo && <span className={s.pronto}>Próximamente</span>}
        </button>
      )}

      <div className={s.textoPieza}>
        <strong>{pieza.titulo}</strong>
        <span>{pieza.pie}</span>
      </div>
    </div>
  );
}

/**
 * El bloque de video de la academia.
 *
 * Una sesión se vende mejor enseñándola que describiéndola. El cartel se
 * queda quieto hasta que alguien lo pide: así la portada no carga un iframe
 * de YouTube que nadie va a ver. Los huecos vacíos se marcan como
 * «próximamente» en vez de desaparecer, para que se vea dónde va cada pieza.
 */
export function VideoAcademia({ principal, piezas }: { principal: Pieza; piezas: Pieza[] }) {
  return (
    <div className={s.caja}>
      <Reproductor pieza={principal} grande />
      {piezas.length > 0 && (
        <div className={s.fila}>
          {piezas.map((p) => (
            <Reproductor key={p.id} pieza={p} />
          ))}
        </div>
      )}
    </div>
  );
}
