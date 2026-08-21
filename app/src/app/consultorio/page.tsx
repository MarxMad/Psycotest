import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { CONSULTORIO } from "@/lib/consultorio-brand";

export const metadata: Metadata = {
  title: `${CONSULTORIO.shortName} — Plataforma profesional`,
  description: CONSULTORIO.tagline,
};

export default function ConsultorioRedirectPage() {
  permanentRedirect("/");
}
