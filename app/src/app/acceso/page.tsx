import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MarketShell } from "@/components/marketplace/MarketShell";
import { Acceso } from "@/components/marketplace/paginas/Acceso";
import { getSessionUser } from "@/lib/auth";
import { RUTAS } from "@/lib/ceduct/rutas";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Iniciar sesión — CEDUCT",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AccesoPage({ searchParams }: Props) {
  const sp = await searchParams;
  const nextCrudo = typeof sp.next === "string" ? sp.next : "";
  // Sólo rutas internas: evita redirigir a un dominio ajeno.
  const siguiente = nextCrudo.startsWith("/") && !nextCrudo.startsWith("//") ? nextCrudo : RUTAS.misCursos;

  const sesion = await getSessionUser().catch(() => null);
  if (sesion) redirect(siguiente);

  return (
    <MarketShell>
      <Acceso modoInicial={sp.modo === "registro" ? "registro" : "entrar"} siguiente={siguiente} />
    </MarketShell>
  );
}
