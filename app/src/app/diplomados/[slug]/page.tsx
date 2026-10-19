import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Ficha } from "@/components/marketplace/ficha/Ficha";
import { MarketShell } from "@/components/marketplace/MarketShell";
import { obtenerPrograma, relacionadosDe } from "@/lib/ceduct/catalogo";
import { TIPO_LABEL, precio } from "@/lib/ceduct/tipos";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await obtenerPrograma(slug);
  if (!p) return { title: "Programa no encontrado — CEDUCT" };
  return {
    title: `${p.titulo} — CEDUCT`,
    description: p.subtitulo ?? p.descripcion.slice(0, 160),
    openGraph: { title: p.titulo, description: p.subtitulo ?? undefined, images: p.imagen ? [p.imagen] : undefined },
  };
}

export default async function ProgramaPage({ params }: Props) {
  const { slug } = await params;
  const p = await obtenerPrograma(slug);
  if (!p) notFound();
  const relacionados = await relacionadosDe(p);

  // Datos estructurados para buscadores (schema.org/Course).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: p.titulo,
    description: p.subtitulo ?? p.descripcion,
    provider: { "@type": "Organization", name: "CEDUCT A.C." },
    educationalCredentialAwarded: TIPO_LABEL[p.tipo],
    ...(p.precioMxn > 0 && {
      offers: { "@type": "Offer", price: (p.precioMxn / 100).toFixed(2), priceCurrency: "MXN", description: precio(p.precioMxn) },
    }),
  };

  return (
    <MarketShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Ficha programa={p} relacionados={relacionados} />
    </MarketShell>
  );
}
