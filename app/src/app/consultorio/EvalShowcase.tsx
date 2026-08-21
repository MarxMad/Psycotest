"use client";

import Image from "next/image";
import styles from "./consultorio.module.css";

type Dimension = { label: string; desc: string };

export function EvalShowcase({ image, dimensions }: { image: string; dimensions: readonly Dimension[] }) {
  return (
    <div className={styles.evalShowcase}>
      <div className={styles.evalPhoto}>
        <Image src={image} alt="Profesional en evaluación de competencias" fill sizes="(max-width: 900px) 100vw, 50vw" className={styles.evalImg} />
        <div className={styles.evalPhotoOverlay} />
      </div>
      <div className={styles.evalPanel}>
        <p className={styles.evalPanelTitle}>Lo que evaluamos</p>
        <ul className={styles.evalDims}>
          {dimensions.map((d) => (
            <li key={d.label}>
              <strong>{d.label}</strong>
              <span>{d.desc}</span>
            </li>
          ))}
        </ul>
        <div className={styles.evalMiniChart} aria-hidden>
          {[72, 58, 81, 65].map((h, i) => (
            <span key={i} style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
