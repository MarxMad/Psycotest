import type { Metadata } from "next";
import { VistaCarrito } from "@/components/marketplace/compra/VistaCarrito";
import { MarketShell } from "@/components/marketplace/MarketShell";
import { obtenerCatalogo } from "@/lib/ceduct/catalogo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tu carrito — CEDUCT",
  robots: { index: false, follow: false },
};

export default async function CarritoPage() {
  const { programas } = await obtenerCatalogo();
  const sugerencias = programas.filter((p) => p.destacado).slice(0, 3);
  return (
    <MarketShell>
      <VistaCarrito sugerencias={sugerencias} />
    </MarketShell>
  );
}
