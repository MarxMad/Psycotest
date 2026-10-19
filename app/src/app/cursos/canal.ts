import { CHANNELS, type ChannelId } from "@/lib/channels";

/**
 * A qué marca pertenece un curso.
 *
 * El canal vive en la escuela del curso (`channel_id` de la categoría), no en
 * el subdominio. Resolverlo por el host hacía que la misma ficha cambiara de
 * colores, tipografía y encabezado según por dónde se entrara: un curso de
 * IGE abierto sin subdominio se pintaba con el tema de CEDUCT y se sentía
 * haber salido del sitio. Con el canal en los datos, la ficha y el
 * reproductor heredan la identidad de la portada de la que se viene.
 *
 * IGE es el reserva: es el canal que vende cursos sueltos.
 */
export function canalDelCurso(channelId: string | null | undefined): ChannelId {
  return channelId && channelId in CHANNELS ? (channelId as ChannelId) : "ige";
}
