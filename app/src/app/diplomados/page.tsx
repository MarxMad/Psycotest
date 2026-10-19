import type { Metadata } from "next";
import { Explorador, type FiltrosIniciales } from "@/components/marketplace/catalogo/Explorador";
import { MarketShell } from "@/components/marketplace/MarketShell";
import { obtenerCatalogo } from "@/lib/ceduct/catalogo";
import mk from "@/components/marketplace/mk.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catálogo de diplomados y certificaciones — CEDUCT",
  description:
    "Diplomados y certificaciones de competencias laborales con validez oficial CONOCER. Filtra por categoría, modalidad y precio.",
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function CatalogoPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { programas, esDemo } = await obtenerCatalogo();
  const iniciales: FiltrosIniciales = {
    q: uno(sp.q),
    tipo: uno(sp.tipo),
    categoria: uno(sp.categoria),
    modalidad: uno(sp.modalidad),
    max: uno(sp.max),
    orden: uno(sp.orden),
  };

  return (
    <MarketShell>
      {esDemo && (
        <div className={mk.contenedor} style={{ paddingTop: 24 }}>
          <p className={mk.avisoDemo}>
            Catálogo de ejemplo: aún no hay programas publicados en la base. Los precios e instructores son ficticios.
          </p>
        </div>
      )}
      <Explorador programas={programas} iniciales={iniciales} />
    </MarketShell>
  );
}
