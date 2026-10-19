/**
 * Tipografías del marketplace, alojadas en src/fuentes (mismo motivo que
 * channel-fonts.ts: no depender de Google en cada build).
 *
 * Space Grotesk para titulares —geométrica, con carácter técnico— y Manrope
 * para el cuerpo: muy legible en tamaños chicos sobre fondo oscuro.
 */

import localFont from "next/font/local";

export const fuenteDisplay = localFont({
  src: "../../fuentes/space-grotesk-variable.woff2",
  weight: "300 700",
  display: "swap",
  variable: "--mk-font-display",
  adjustFontFallback: "Arial",
});

export const fuenteCuerpo = localFont({
  src: "../../fuentes/manrope-variable.woff2",
  weight: "200 800",
  display: "swap",
  variable: "--mk-font-body",
  adjustFontFallback: "Arial",
});

export const FUENTES_MK = `${fuenteDisplay.variable} ${fuenteCuerpo.variable}`;
