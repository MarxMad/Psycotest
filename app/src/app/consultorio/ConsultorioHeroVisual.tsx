"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./consultorio.module.css";

const VIDEO_SRC = "/media/hero-bg.mp4";
const POSTER_SRC = "/media/hero-poster.jpg";

/**
 * Fondo cinematográfico del hero: video en loop con póster de respaldo
 * y respeto a prefers-reduced-motion.
 */
export function ConsultorioHeroVisual() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || reducedMotion) return;

    const play = () => {
      video.play().catch(() => {
        /* autoplay bloqueado: el póster cubre */
      });
    };

    play();
    video.addEventListener("loadeddata", play);
    return () => video.removeEventListener("loadeddata", play);
  }, [reducedMotion]);

  return (
    <div className={styles.heroMedia} aria-hidden>
      <div
        className={styles.heroPoster}
        style={{ backgroundImage: `url(${POSTER_SRC})` }}
        data-ready={ready ? "true" : undefined}
      />

      {!reducedMotion ? (
        <video
          ref={videoRef}
          className={styles.heroVideo}
          data-ready={ready ? "true" : undefined}
          poster={POSTER_SRC}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          onCanPlay={() => setReady(true)}
          onPlaying={() => setReady(true)}
        >
          <source src={VIDEO_SRC} type="video/mp4" />
        </video>
      ) : null}

      <div className={styles.heroScrim} />
      <div className={styles.heroGrain} />
      <div className={styles.heroGlow} />
    </div>
  );
}
