import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getChannelFromHost, CHANNELS } from "@/lib/channels";
import { canalDelArea } from "@/lib/area-alumno";
import { inicioDelPanel, operaElPanel } from "@/lib/auth-rutas";
import { sitioDelAlumno } from "@/lib/canal-del-alumno";
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
    // Cada marca tiene su pantalla de acceso; /acceso manda al inicio de
    // sesión del equipo cuando el dominio no es de ninguna.
    redirect(desdeHost ? "/acceso?next=/mi-cuenta" : "/login?next=/mi-cuenta");
  }

  // La zona sigue al dominio: aunque no tenga nada aquí, ve esta marca y el
  // inicio le dice qué tiene y dónde.
  const canal = canalDelArea(desdeHost);

  // Fuera de un dominio de marca no hay «Mi cuenta» propia: el equipo va a su
  // panel y el alumno, al sitio de su empresa.
  if (canal === "martin") {
    if (operaElPanel(user.rol)) redirect(inicioDelPanel(user.rol));
    const sitio = await sitioDelAlumno(user.id);
    if (sitio) redirect(sitio);
  }

  return (
    <AreaShell canal={canal} nombre={user.nombre} marca={CHANNELS[canal].name}>
      {children}
    </AreaShell>
  );
}
