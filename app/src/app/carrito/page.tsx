import type { Metadata } from "next";
import { CeductShell } from "@/components/ceduct/CeductShell";
import { VistaCarrito } from "./VistaCarrito";

export const metadata: Metadata = {
  title: "Tu carrito — CEDUCT",
  robots: { index: false, follow: false },
};

export default function CarritoPage() {
  return (
    <CeductShell>
      <VistaCarrito />
    </CeductShell>
  );
}
