import type { Metadata } from "next";
import { listarAreas, listarDiplomados } from "@/lib/diplomados";
import { Catalogo } from "@/components/ceduct/Catalogo";
import { CeductShell } from "@/components/ceduct/CeductShell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Diplomados — CEDUCT",
  description:
    "Diplomados con ruta hacia la certificación de competencias laborales, con clave ECE 002-10.",
};

export default async function DiplomadosPage() {
  const [diplomados, areas] = await Promise.all([listarDiplomados(), listarAreas()]);

  return (
    <CeductShell>
      <Catalogo diplomados={diplomados} areas={areas} />
    </CeductShell>
  );
}
