import type { Metadata } from "next";
import { MarketShell } from "@/components/marketplace/MarketShell";
import { Nosotros } from "@/components/marketplace/paginas/Nosotros";

export const metadata: Metadata = {
  title: "Nosotros — CEDUCT",
  description: "CEDUCT A.C., Entidad de Certificación y Evaluación acreditada ante CONOCER con clave ECE 002-10.",
};

export default function NosotrosPage() {
  return (
    <MarketShell>
      <Nosotros />
    </MarketShell>
  );
}
