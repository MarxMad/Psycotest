import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
import styles from "./consultorio.module.css";

const sans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--ige-sans",
});

const serif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--ige-serif",
});

export function ConsultorioRoot({ children }: { children: React.ReactNode }) {
  return <div className={`${sans.variable} ${serif.variable} ${styles.root}`}>{children}</div>;
}
