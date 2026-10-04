"use client";

import { ConsultorioAnime } from "@/components/consultorio/ConsultorioAnime";
import type { ChannelId } from "@/lib/channels";
import { clasesDeCanal, estiloDeCanal } from "@/lib/tema-canal";
import styles from "./consultorio.module.css";

/**
 * Cáscara del área de alumno, vestida con el tema del canal.
 *
 * El canal lo resuelve el layout a partir del host y lo pasa aquí: salir
 * del sitio de IGE y caer en esta zona ya no se siente otro sitio.
 */
export function BrandShell({
  canal,
  children,
}: {
  canal: ChannelId;
  children: React.ReactNode;
}) {
  return (
    <ConsultorioAnime>
      <div
        className={`${styles.root} ${clasesDeCanal(canal)}`}
        data-canal={canal}
        style={estiloDeCanal(canal)}
      >
        {children}
      </div>
    </ConsultorioAnime>
  );
}
