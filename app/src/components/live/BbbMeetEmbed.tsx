"use client";

import { useState } from "react";
import styles from "./BbbMeetEmbed.module.css";

type Props = {
  joinUrl: string;
  title?: string;
  className?: string;
};

/**
 * Embebe el cliente HTML5 de BigBlueButton.
 * Si el servidor BBB bloquea iframes (X-Frame-Options), se ofrece abrir en pestaña.
 */
export function BbbMeetEmbed({ joinUrl, title = "Sala BigBlueButton", className }: Props) {
  const [blocked, setBlocked] = useState(false);

  return (
    <div className={`${styles.shell} ${className ?? ""}`}>
      <div className={styles.toolbar}>
        <span className={styles.badge}>BigBlueButton</span>
        <a href={joinUrl} target="_blank" rel="noopener noreferrer" className={styles.openBtn}>
          Abrir en pestaña nueva
        </a>
      </div>

      {blocked ? (
        <div className={styles.fallback}>
          <p>
            Tu servidor BBB no permite embeber la sala en esta página. Ábrela en una pestaña nueva
            para continuar (misma sesión, cámara y micrófono).
          </p>
          <a href={joinUrl} target="_blank" rel="noopener noreferrer" className={styles.cta}>
            Entrar a la clase
          </a>
        </div>
      ) : (
        <iframe
          src={joinUrl}
          title={title}
          allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
          allowFullScreen
          className={styles.frame}
          onError={() => setBlocked(true)}
        />
      )}
    </div>
  );
}
