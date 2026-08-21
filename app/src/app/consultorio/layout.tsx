import type { Metadata } from "next";
import { CONSULTORIO } from "@/lib/consultorio-brand";
import { ConsultorioRoot } from "./ConsultorioRoot";

export const metadata: Metadata = {
  title: `${CONSULTORIO.shortName} — Plataforma profesional`,
  description: CONSULTORIO.tagline,
};

export default function ConsultorioLayout({ children }: { children: React.ReactNode }) {
  return <ConsultorioRoot>{children}</ConsultorioRoot>;
}
