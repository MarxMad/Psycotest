import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Landing as CeductMarketplace } from "@/components/marketplace/landing/Landing";
import { MarketShell } from "@/components/marketplace/MarketShell";
import { obtenerCatalogo } from "@/lib/ceduct/catalogo";
import { IgeLanding } from "@/components/channels/IgeLanding";
import { MartinLanding } from "@/components/channels/MartinLanding";
import { ChannelLanding } from "@/components/channels/ChannelLanding";
import { ChannelShell } from "@/components/channels/ChannelShell";
import { PsicologiaLanding } from "@/components/channels/PsicologiaLanding";
import { getChannel, type ChannelId, CHANNEL_IDS } from "@/lib/channels";
import { getChannelPage } from "@/lib/channel-store";
import { levelLabel, listPublishedCoursesByChannel } from "@/lib/courses";
import { courseThumbnail } from "@/lib/course-marketing";
import type { CursoVista } from "@/components/channels/RejillaCursos";

/** El contenido se edita desde /admin/canales: no se puede prerenderizar. */
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ channel: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { channel: id } = await params;
  if (!CHANNEL_IDS.includes(id as ChannelId)) return {};
  const content = await getChannelPage(id as ChannelId);
  return {
    title: content.seoTitle,
    description: content.seoDescription,
  };
}

export default async function ChannelSitePage({ params }: Props) {
  const { channel: id } = await params;
  const channel = getChannel(id);
  if (!channel) notFound();

  // CEDUCT es un marketplace con su propia cáscara (navbar con carrito,
  // buscador y pie): no usa ChannelShell.
  if (channel.id === "ceduct") {
    const { programas } = await obtenerCatalogo();
    return (
      <MarketShell>
        <CeductMarketplace programas={programas} />
      </MarketShell>
    );
  }

  const content = await getChannelPage(channel.id);

  let landing = <ChannelLanding channel={channel} content={content} />;
  if (channel.id === "psicologia") {
    landing = <PsicologiaLanding channel={channel} content={content} />;
  } else if (channel.id === "ige") {
    // La academia es el centro de esta portada: su catálogo viaja con ella.
    const filas = await listPublishedCoursesByChannel(channel.id);
    const cursos: CursoVista[] = filas.map(({ course, category }) => ({
      id: course.id,
      slug: course.slug,
      titulo: course.title,
      resumen: course.subtitle ?? "",
      imagen: courseThumbnail(course.id, course.thumbnailUrl),
      minutos: course.durationMinutes,
      nivel: levelLabel(course.level),
      precio: course.priceMxn,
      categoriaId: category?.id ?? "otros",
      categoriaNombre: category?.name ?? "Catálogo",
      // Lo grabado se cursa en línea; lo demás se imparte con el grupo delante.
      formato: course.modalidad === "online" ? "grabado" : "vivo",
    }));
    landing = <IgeLanding channel={channel} content={content} cursos={cursos} />;
  } else if (channel.id === "martin") {
    landing = <MartinLanding channel={channel} content={content} />;
  }

  return <ChannelShell channel={channel}>{landing}</ChannelShell>;
}
