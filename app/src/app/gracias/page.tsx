import type { Metadata } from "next";
import { MarketShell } from "@/components/marketplace/MarketShell";
import { Confirmacion } from "./Confirmacion";

export const metadata: Metadata = {
  title: "Pago recibido — CEDUCT",
  robots: { index: false, follow: false },
};

export default function GraciasPage() {
  return (
    <MarketShell>
      <Confirmacion />
    </MarketShell>
  );
}
