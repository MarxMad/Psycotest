/**
 * Tipografías del marketplace, alojadas en src/fuentes (mismo motivo que
 * channel-fonts.ts: no depender de Google en cada build).
 *
 * Fraunces (serif de óptica variable) para titulares: el tono de un documento
 * oficial, que es lo que se vende. Manrope para el cuerpo: muy legible en
 * tamaños chicos sobre fondo oscuro. `--mk-font-serif` apunta a la misma
 * Fraunces desde mk.module.css, así que se descarga una sola vez.
 */

import localFont from "next/font/local";

export const fuenteDisplay = localFont({
  src: "../../fuentes/fraunces-variable.woff2",
  display: "swap",
  variable: "--mk-font-display",
  adjustFontFallback: "Times New Roman",
});

export const fuenteCuerpo = localFont({
  src: "../../fuentes/manrope-variable.woff2",
  weight: "200 800",
  display: "swap",
  variable: "--mk-font-body",
  adjustFontFallback: "Arial",
});

export const FUENTES_MK = `${fuenteDisplay.variable} ${fuenteCuerpo.variable}`;
