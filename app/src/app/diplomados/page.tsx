import type { Metadata } from "next";
import { listarAreas, listarDiplomados } from "@/lib/diplomados";
import { CatalogoDiplomados } from "./CatalogoDiplomados";
import { CeductShell } from "./CeductShell";

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
      <CatalogoDiplomados diplomados={diplomados} areas={areas} />
    </CeductShell>
  );
}
