import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getChannelFromHost, type ChannelId } from "@/lib/channels";
import { AREA_BASE, canalDelArea, seccionPertenece } from "@/lib/area-alumno";
import type { AuthUser } from "@/lib/auth";

/**
 * Deja pasar sólo si la sección pertenece a la marca de este dominio.
 *
 * Sin esto, alguien en el dominio de CEDUCT podría llegar al apartado de
 * cursos de IGE escribiendo la URL, que es justo la confusión que se evita.
 * Cada sección trae su propio estado vacío, así que no hace falta tener
 * contenido para entrar.
 */
export async function asegurarSeccion(
  href: string,
): Promise<{ user: AuthUser; canal: ChannelId }> {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(href)}`);

  const host = (await headers()).get("host");
  const canal = canalDelArea(getChannelFromHost(host)?.id ?? null);
  if (!seccionPertenece(canal, href)) redirect(AREA_BASE);

  return { user, canal };
}
