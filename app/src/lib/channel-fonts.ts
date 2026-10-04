/**
 * Tipografías de los canales públicos, alojadas por nosotros.
 *
 * Antes se pedían a `next/font/google`, que las descarga en cada compilación.
 * Eso ataba el despliegue a que Google respondiera igual desde la máquina de
 * build: su cargador hace `/\.(woff|woff2|eot|ttf|otf)$/.exec(url)[1]` y, si
 * alguna URL no trae extensión reconocible, revienta con «Cannot read
 * properties of null». El build fallaba al azar —el mismo commit compilaba en
 * un proyecto y moría en el otro— sin que nada hubiera cambiado en el código.
 *
 * Los archivos viven ahora en `src/fuentes`. Se bajó la variante variable de
 * cada familia cuando existe, así que un archivo cubre todos los pesos; las
 * dos que no tienen variable traen un archivo por peso. Son 321 kB en total y
 * el navegador solo pide el par del canal que esté viendo.
 */

import localFont from "next/font/local";
import type { ChannelId } from "./channels";

const fraunces = localFont({
  src: "../fuentes/fraunces-variable.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--f-fraunces",
  adjustFontFallback: "Times New Roman",
});

const dmSans = localFont({
  src: "../fuentes/dm-sans-variable.woff2",
  weight: "100 1000",
  display: "swap",
  variable: "--f-dm-sans",
  adjustFontFallback: "Arial",
});

const libreBaskerville = localFont({
  src: [
    { path: "../fuentes/libre-baskerville-400.woff2", weight: "400", style: "normal" },
    { path: "../fuentes/libre-baskerville-700.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--f-libre",
  adjustFontFallback: "Times New Roman",
});

const sourceSans = localFont({
  src: "../fuentes/source-sans-3-variable.woff2",
  weight: "200 900",
  display: "swap",
  variable: "--f-source-sans",
  adjustFontFallback: "Arial",
});

const spaceGrotesk = localFont({
  src: "../fuentes/space-grotesk-variable.woff2",
  weight: "300 700",
  display: "swap",
  variable: "--f-space",
  adjustFontFallback: "Arial",
});

const ibmPlex = localFont({
  src: [
    { path: "../fuentes/ibm-plex-sans-400.woff2", weight: "400", style: "normal" },
    { path: "../fuentes/ibm-plex-sans-500.woff2", weight: "500", style: "normal" },
    { path: "../fuentes/ibm-plex-sans-600.woff2", weight: "600", style: "normal" },
  ],
  display: "swap",
  variable: "--f-ibm-plex",
  adjustFontFallback: "Arial",
});

const outfit = localFont({
  src: "../fuentes/outfit-variable.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--f-outfit",
  adjustFontFallback: "Arial",
});

const manrope = localFont({
  src: "../fuentes/manrope-variable.woff2",
  weight: "200 800",
  display: "swap",
  variable: "--f-manrope",
  adjustFontFallback: "Arial",
});

type ParTipografico = {
  /** Clases que activan las variables de ambas familias */
  className: string;
  /** Valor para --ch-font-display */
  display: string;
  /** Valor para --ch-font-body */
  body: string;
};

export const FUENTES_CANAL: Record<ChannelId, ParTipografico> = {
  martin: {
    className: `${fraunces.variable} ${dmSans.variable}`,
    display: "var(--f-fraunces), Georgia, serif",
    body: "var(--f-dm-sans), system-ui, sans-serif",
  },
  ceduct: {
    className: `${libreBaskerville.variable} ${sourceSans.variable}`,
    display: "var(--f-libre), Georgia, serif",
    body: "var(--f-source-sans), system-ui, sans-serif",
  },
  psicologia: {
    className: `${spaceGrotesk.variable} ${ibmPlex.variable}`,
    display: "var(--f-space), system-ui, sans-serif",
    body: "var(--f-ibm-plex), system-ui, sans-serif",
  },
  ige: {
    className: `${outfit.variable} ${manrope.variable}`,
    display: "var(--f-outfit), system-ui, sans-serif",
    body: "var(--f-manrope), system-ui, sans-serif",
  },
};
