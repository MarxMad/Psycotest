import type { Metadata } from "next";
import { ChannelShell } from "@/components/channels/ChannelShell";
import { MartinLanding } from "@/components/channels/MartinLanding";
import { getChannelPage } from "@/lib/channel-store";
import { CHANNELS } from "@/lib/channels";

/** El contenido se edita desde /admin/canales: no se puede prerenderizar. */
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
  const canal = CHANNELS.martin;
  const content = await getChannelPage("martin");
  return (
    <ChannelShell channel={canal}>
      <MartinLanding channel={canal} content={content} />
    </ChannelShell>
  );
}
