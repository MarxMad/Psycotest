import type { Metadata } from "next";
import { CursosShell } from "./CursosShell";

export const metadata: Metadata = {
  title: "Cursos en línea",
  description: "Formación con temario, avance por lección y ruta hacia la certificación.",
};

export default function CursosLayout({ children }: { children: React.ReactNode }) {
  return <CursosShell>{children}</CursosShell>;
}
