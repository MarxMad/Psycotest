import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getChannelFromHost, CHANNELS, type ChannelId } from "@/lib/channels";
import { canalDeEntrada } from "@/lib/canal-del-alumno";
import { tieneAreaAlumno, inicioDelArea } from "@/lib/area-alumno";
import { AreaShell } from "./AreaShell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mi cuenta",
  robots: { index: false, follow: false },
};

export default async function MiCuentaLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/mi-cuenta");

  // El canal del subdominio manda; si no hay, se resuelve por lo contratado.
  const host = (await headers()).get("host");
  const desdeHost = getChannelFromHost(host)?.id ?? null;
  const canal = await canalDeEntrada(user.id, desdeHost);

  // Sin contenido en ningún canal: no hay zona privada que mostrar.
  if (!canal || !tieneAreaAlumno(canal)) redirect("/sin-contenido");

  // Llegó por un canal donde no tiene nada: se le manda al suyo.
  if (desdeHost && desdeHost !== canal && tieneAreaAlumno(desdeHost)) {
    redirect(inicioDelArea(canal));
  }

  return (
    <AreaShell canal={canal as ChannelId} nombre={user.nombre} marca={CHANNELS[canal].name}>
      {children}
    </AreaShell>
  );
}
