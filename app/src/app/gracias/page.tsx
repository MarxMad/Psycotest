import type { Metadata } from "next";
import { CeductShell } from "@/components/ceduct/CeductShell";
import { Confirmacion } from "./Confirmacion";

export const metadata: Metadata = {
  title: "Pago recibido — CEDUCT",
  robots: { index: false, follow: false },
};

export default function GraciasPage() {
  return (
    <CeductShell>
      <Confirmacion />
    </CeductShell>
  );
}
