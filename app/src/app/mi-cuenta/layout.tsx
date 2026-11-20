import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getChannelFromHost, CHANNELS } from "@/lib/channels";
import { canalDelArea } from "@/lib/area-alumno";
import { AreaShell } from "./AreaShell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mi cuenta",
  robots: { index: false, follow: false },
};

export default async function MiCuentaLayout({ children }: { children: React.ReactNode }) {
  const host = (await headers()).get("host");
  const desdeHost = getChannelFromHost(host)?.id ?? null;

  const user = await getSessionUser();
  if (!user) {
    // CEDUCT tiene su propia pantalla de acceso; las demás marcas usan la de la plataforma.
    redirect(desdeHost === "ceduct" ? "/acceso?next=/mi-cuenta" : "/login?next=/mi-cuenta");
  }

  // La zona sigue al dominio: aunque no tenga nada aquí, ve esta marca y el
  // inicio le dice qué tiene y dónde.
  const canal = canalDelArea(desdeHost);

  return (
    <AreaShell canal={canal} nombre={user.nombre} marca={CHANNELS[canal].name}>
      {children}
    </AreaShell>
  );
}
