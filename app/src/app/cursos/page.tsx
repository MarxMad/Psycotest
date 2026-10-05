import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { channelPublicUrl, getChannelFromHost, type ChannelId } from "@/lib/channels";

export const dynamic = "force-dynamic";

/**
 * `/cursos` no tiene catálogo propio: lleva al de su canal.
 *
 * Había una lista aparte que se armaba resolviendo el canal por el host y, sin
 * subdominio, caía siempre en CEDUCT: mostraba otra marca y otros cursos que
 * los de la portada desde la que se había llegado. Y era una segunda copia de
 * algo que cada portada ya trae —la academia de IGE, el catálogo de CEDUCT—,
 * así que las dos se desincronizaban. Queda sólo una lista por canal, la de
 * su portada, y esta ruta reparte hacia ella.
 */
const CATALOGO: Record<ChannelId, string> = {
  ceduct: "/diplomados",
  ige: "#academia",
  psicologia: "#bateria",
  martin: "#canales",
};

export default async function CursosPage() {
  const host = (await headers()).get("host");
  const canal: ChannelId = getChannelFromHost(host)?.id ?? "ige";
  const destino = CATALOGO[canal];

  redirect(destino.startsWith("#") ? `${channelPublicUrl(canal)}${destino}` : destino);
}
