import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getChannelFromHost, type ChannelId } from "@/lib/channels";
import { canalDeEntrada } from "@/lib/canal-del-alumno";
import { inicioDelArea, seccionPertenece } from "@/lib/area-alumno";
import type { AuthUser } from "@/lib/auth";

/**
 * Deja pasar sólo si la sección pertenece al canal de la persona.
 *
 * Sin esto, alguien que compró certificación podría llegar al apartado de
 * cursos escribiendo la URL, que es justo la confusión que se quiere evitar.
 */
export async function asegurarSeccion(
  href: string,
): Promise<{ user: AuthUser; canal: ChannelId }> {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(href)}`);

  const host = (await headers()).get("host");
  const canal = await canalDeEntrada(user.id, getChannelFromHost(host)?.id ?? null);
  if (!canal) redirect("/sin-contenido");

  if (!seccionPertenece(canal, href)) redirect(inicioDelArea(canal));

  return { user, canal };
}
