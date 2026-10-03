/**
 * Tipografías de los canales públicos, servidas por next/font.
 *
 * Antes se cargaban con un `@import` de Google Fonts dentro de un <style>:
 * eso bloquea el render y bajaba las ocho familias en cada canal, aunque cada
 * uno solo use dos. Con next/font se alojan en el propio dominio y cada canal
 * aplica únicamente su par.
 */

import {
  DM_Sans,
  Fraunces,
  IBM_Plex_Sans,
  Libre_Baskerville,
  Manrope,
  Outfit,
  Source_Sans_3,
  Space_Grotesk,
} from "next/font/google";
import type { ChannelId } from "./channels";



const fraunces = Fraunces({ subsets: ["latin"], display: "swap", weight: ["500", "700"], variable: "--f-fraunces" });
const dmSans = DM_Sans({ subsets: ["latin"], display: "swap", weight: ["400", "500", "600", "700"], variable: "--f-dm-sans" });
const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "700"],
  variable: "--f-libre",
});
const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600", "700"],
  variable: "--f-source-sans",
});
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], display: "swap", weight: ["500", "700"], variable: "--f-space" });
const ibmPlex = IBM_Plex_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
  variable: "--f-ibm-plex",
});
const outfit = Outfit({ subsets: ["latin"], display: "swap", weight: ["500", "700", "800"], variable: "--f-outfit" });
const manrope = Manrope({ subsets: ["latin"], display: "swap", weight: ["400", "600", "700"], variable: "--f-manrope" });

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
