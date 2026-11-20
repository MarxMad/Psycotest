import type { Metadata } from "next";
import { CounselingLanding } from "@/components/channels/counseling/CounselingLanding";
import { getChannelPage } from "@/lib/channel-store";
import { clasesDeCanal } from "@/lib/tema-canal";

/** El contenido vive en la base (channel-store): no se puede prerenderizar. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Martín Hernández González — Certificación, evaluación y formación",
  description:
    "Certificación de competencias laborales, evaluación y selección de personal, capacitación y consultoría organizacional.",
};

/**
 * Portada del grupo.
 *
 * Antes había dos puertas: un índice de cuatro tarjetas en el dominio
 * principal y el portafolio de Martín aparte. Ahora es una sola: la práctica
 * de Martín como respaldo y, desde ahí, a cada marca según lo que la
 * persona necesita.
 */
export default async function PortadaDelGrupo() {
  const content = await getChannelPage("martin");
  return (
    <div className={clasesDeCanal("martin")} data-channel="martin">
      <CounselingLanding content={content} />
    </div>
  );
}
