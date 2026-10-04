/**
 * Par tipográfico del sitio principal, alojado por nosotros.
 *
 * Mismo motivo que en `channel-fonts.ts`: pedirlas a Google en cada
 * compilación hacía que el despliegue fallara al azar. Outfit ya está bajado
 * para el canal IGE y se reaprovecha el mismo archivo.
 */

import localFont from "next/font/local";

export const serif = localFont({
  src: "../fuentes/cormorant-garamond-variable.woff2",
  weight: "300 700",
  variable: "--font-serif",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

export const sans = localFont({
  src: "../fuentes/outfit-variable.woff2",
  weight: "100 900",
  variable: "--font-sans",
  display: "swap",
  adjustFontFallback: "Arial",
});
