"use client";

import { useMemo } from "react";
import styles from "./JitsiMeetEmbed.module.css";

type Props = {
  roomUrl: string;
  displayName: string;
  className?: string;
};

export function JitsiMeetEmbed({ roomUrl, displayName, className }: Props) {
  const src = useMemo(() => {
    try {
      const url = new URL(roomUrl);
      const hash = [
        `userInfo.displayName="${encodeURIComponent(displayName || "Participante")}"`,
        "config.prejoinConfig.enabled=false",
      ].join("&");
      url.hash = hash;
      return url.toString();
    } catch {
      return roomUrl;
    }
  }, [roomUrl, displayName]);

  return (
    <div className={`${styles.shell} ${className ?? ""}`}>
      <iframe
        src={src}
        title="Sala en vivo"
        allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
        allowFullScreen
        className={styles.frame}
      />
    </div>
  );
}
