import type { Metadata } from "next";
import { CursosShell } from "./CursosShell";

export const metadata: Metadata = {
  title: "Cursos en línea — Martín Hernández",
  description: "Formación grabada con temario, progreso y certificación CONOCER.",
};

export default function CursosLayout({ children }: { children: React.ReactNode }) {
  return <CursosShell>{children}</CursosShell>;
}
