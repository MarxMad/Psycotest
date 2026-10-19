/**
 * Diplomados de CEDUCT.
 *
 * Un diplomado es un curso del canal `ceduct`: así reutiliza inscripción,
 * avance por lección, expediente y constancia, en vez de duplicar todo.
 */

import { and, asc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import { courseCategories, courseLessons, courseModules, courses } from "@/db/schema";
import { enHoras as aHoras, type Diplomado as TipoDiplomado } from "./diplomados-formato";

export type { Diplomado, Modalidad, Nivel } from "./diplomados-formato";
export {
  MODALIDAD_LABEL,
  NIVEL_LABEL,
  enHoras,
  precioMxn,
} from "./diplomados-formato";

const CAMPOS = {
  id: courses.id,
  slug: courses.slug,
  titulo: courses.title,
  subtitulo: courses.subtitle,
  descripcion: courses.description,
  precioMxn: courses.priceMxn,
  imagen: courses.thumbnailUrl,
  instructor: courses.instructorName,
  nivel: courses.level,
  modalidad: courses.modalidad,
  estandarClave: courses.estandarClave,
  horas: courses.durationMinutes,
  categoria: courseCategories.name,
  categoriaSlug: courseCategories.slug,
  cupo: courses.inventoryLimit,
  vendidos: courses.soldCount,
};

function normaliza(f: Record<string, unknown>): TipoDiplomado {
  return {
    ...(f as unknown as TipoDiplomado),
    horas: aHoras(Number(f.horas ?? 0)),
  };
}

/** Catálogo publicado del canal CEDUCT. */
export async function listarDiplomados(): Promise<TipoDiplomado[]> {
  const filas = await getDb()
    .select(CAMPOS)
    .from(courses)
    .leftJoin(courseCategories, eq(courses.categoryId, courseCategories.id))
    .where(and(eq(courses.status, "published"), eq(courseCategories.channelId, "ceduct")))
    .orderBy(asc(courses.sortOrder), asc(courses.title));
  return filas.map(normaliza);
}

/** Las áreas con al menos un diplomado, para los filtros. */
export async function listarAreas(): Promise<{ slug: string; nombre: string; total: number }[]> {
  const filas = await getDb()
    .select({
      slug: courseCategories.slug,
      nombre: courseCategories.name,
      total: sql<number>`count(${courses.id})`,
    })
    .from(courseCategories)
    .leftJoin(
      courses,
      and(eq(courses.categoryId, courseCategories.id), eq(courses.status, "published")),
    )
    .where(eq(courseCategories.channelId, "ceduct"))
    .groupBy(courseCategories.slug, courseCategories.name)
    .orderBy(asc(courseCategories.name));
  return filas.filter((f) => Number(f.total) > 0).map((f) => ({ ...f, total: Number(f.total) }));
}

export async function obtenerDiplomado(slug: string): Promise<TipoDiplomado | null> {
  const [f] = await getDb()
    .select(CAMPOS)
    .from(courses)
    .leftJoin(courseCategories, eq(courses.categoryId, courseCategories.id))
    .where(and(eq(courses.slug, slug), eq(courses.status, "published")))
    .limit(1);
  return f ? normaliza(f) : null;
}

export type ModuloTemario = { titulo: string; lecciones: string[] };

/** Temario: módulos con sus lecciones, para la ficha del diplomado. */
export async function temarioDe(cursoId: string): Promise<ModuloTemario[]> {
  const filas = await getDb()
    .select({
      modulo: courseModules.title,
      orden: courseModules.sortOrder,
      leccion: courseLessons.title,
      ordenLeccion: courseLessons.sortOrder,
    })
    .from(courseModules)
    .leftJoin(courseLessons, eq(courseLessons.moduleId, courseModules.id))
    .where(eq(courseModules.courseId, cursoId))
    .orderBy(asc(courseModules.sortOrder), asc(courseLessons.sortOrder));

  const porModulo = new Map<string, string[]>();
  for (const f of filas) {
    const lista = porModulo.get(f.modulo) ?? [];
    if (f.leccion) lista.push(f.leccion);
    porModulo.set(f.modulo, lista);
  }
  return [...porModulo.entries()].map(([titulo, lecciones]) => ({ titulo, lecciones }));
}
