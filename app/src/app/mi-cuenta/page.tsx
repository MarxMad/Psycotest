import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getChannelFromHost } from "@/lib/channels";
import { canalDeEntrada } from "@/lib/canal-del-alumno";
import { inicioDelArea } from "@/lib/area-alumno";

export const dynamic = "force-dynamic";

/** La zona privada no tiene portada: se entra directo a la primera sección. */
export default async function MiCuentaPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/mi-cuenta");

  const host = (await headers()).get("host");
  const canal = await canalDeEntrada(user.id, getChannelFromHost(host)?.id ?? null);
  if (!canal) redirect("/sin-contenido");

  redirect(inicioDelArea(canal));
}
