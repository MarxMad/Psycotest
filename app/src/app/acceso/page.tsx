import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { MarketShell } from "@/components/marketplace/MarketShell";
import { Acceso } from "@/components/marketplace/paginas/Acceso";
import { AccesoMarca } from "@/components/auth/AccesoMarca";
import { getSessionUser } from "@/lib/auth";
import { getChannelFromHost } from "@/lib/channels";
import { tieneAreaAlumno, AREA_BASE } from "@/lib/area-alumno";
import { FUENTES_CANAL } from "@/lib/channel-fonts";
import { LOGO_DE_MARCA } from "@/lib/logos-marca";
import { estiloDeCanal } from "@/lib/tema-canal";
import { RUTAS } from "@/lib/ceduct/rutas";
import { PARAM_SALIDA } from "@/lib/salir";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

async function canalDelHost() {
  return getChannelFromHost((await headers()).get("host"));
}

export async function generateMetadata(): Promise<Metadata> {
  const canal = await canalDelHost();
  return {
    title: `Iniciar sesión — ${canal?.id === "ceduct" ? "CEDUCT" : (canal?.name ?? "Acceso")}`,
    robots: { index: false, follow: false },
  };
}

/**
 * Acceso de alumnos y clientes, con la marca del dominio: CEDUCT con su
 * cáscara de tienda, IGE y Psicología Aplicada con la suya. En el dominio del
 * panel (o en una marca sin zona privada) se usa el inicio de sesión del equipo.
 */
export default async function AccesoPage({ searchParams }: Props) {
  const sp = await searchParams;
  const canal = await canalDelHost();
  const conMarca = canal && (canal.id === "ceduct" || tieneAreaAlumno(canal.id));

  if (!canal || !conMarca) {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (typeof v === "string") q.set(k, v);
    redirect(`/login${q.size ? `?${q}` : ""}`);
  }

  const nextCrudo = typeof sp.next === "string" ? sp.next : "";
  const porDefecto = canal.id === "ceduct" ? RUTAS.misCursos : AREA_BASE;
  // Sólo rutas internas: evita redirigir a un dominio ajeno.
  const siguiente = nextCrudo.startsWith("/") && !nextCrudo.startsWith("//") ? nextCrudo : porDefecto;

  const sesion = await getSessionUser().catch(() => null);
  if (sesion) redirect(siguiente);

  const modoInicial = sp.modo === "registro" ? "registro" : "entrar";
  const salir = sp[PARAM_SALIDA] === "1";

  if (canal.id === "ceduct") {
    return (
      <MarketShell>
        <Acceso modoInicial={modoInicial} siguiente={siguiente} salir={salir} />
      </MarketShell>
    );
  }

  return (
    <AccesoMarca
      canal={canal.id}
      marca={canal.name}
      logo={LOGO_DE_MARCA[canal.id]}
      estilo={estiloDeCanal(canal.id)}
      fuentes={FUENTES_CANAL[canal.id].className}
      modoInicial={modoInicial}
      siguiente={siguiente}
      salir={salir}
    />
  );
}
