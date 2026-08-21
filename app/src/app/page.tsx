import type { Metadata } from "next";
import { ConsultorioLanding } from "./consultorio/ConsultorioLanding";
import { ConsultorioRoot } from "./consultorio/ConsultorioRoot";
import { CONSULTORIO } from "@/lib/consultorio-brand";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `${CONSULTORIO.shortName} — Plataforma profesional`,
  description: CONSULTORIO.tagline,
};

export default async function HomePage() {
  return (
    <ConsultorioRoot>
      <ConsultorioLanding />
    </ConsultorioRoot>
  );
}
