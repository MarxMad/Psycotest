import { Source_Sans_3, Source_Serif_4 } from "next/font/google";

/** Tipografía unificada MH / CONOCER en todo el sitio */
export const serif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-serif",
  display: "swap",
});

export const sans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});
