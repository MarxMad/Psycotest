import type { CursoVista } from "@/components/channels/RejillaCursos";
import { courseThumbnail } from "./course-marketing";
import { levelLabel, listPublishedCoursesByChannel } from "./courses";

type Fila = Awaited<ReturnType<typeof listPublishedCoursesByChannel>>[number];

/** Lo que una tarjeta del catálogo necesita saber de un curso. */
export function aCursoVista({ course, category }: Fila): CursoVista {
  return {
    id: course.id,
    slug: course.slug,
    titulo: course.title,
    resumen: course.subtitle ?? "",
    imagen: courseThumbnail(course.id, course.thumbnailUrl),
    minutos: course.durationMinutes,
    nivel: levelLabel(course.level),
    precio: course.priceMxn,
    categoriaId: category?.id ?? "otros",
    categoriaNombre: category?.name ?? "Catálogo",
    // Lo grabado se cursa en línea; lo demás se imparte con el grupo delante.
    formato: course.modalidad === "online" ? "grabado" : "vivo",
  };
}

/** El catálogo publicado de un canal, listo para la rejilla. */
export async function cursosVistaDeCanal(canal: string) {
  const filas = await listPublishedCoursesByChannel(canal);
  return filas.map(aCursoVista);
}
