/**
 * Catálogo del marketplace (servidor).
 *
 * La fuente de verdad son los cursos publicados del canal `ceduct` en la
 * base. Si todavía no hay ninguno —o la base no responde en desarrollo— se
 * sirve el catálogo de ejemplo para que el sitio no se vea vacío.
 */

import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db/index";
import { courseCategories, courses } from "@/db/schema";
import { temarioDe } from "@/lib/diplomados";
import { categoriaDesdeTexto } from "./config";
import { PROGRAMAS_DEMO } from "./demo";
import type { Programa, TipoPrograma } from "./tipos";

const FORZAR_DEMO = process.env.CEDUCT_CATALOGO_DEMO === "1";

/**
 * La base no distingue diplomado de certificación: un curso con clave de
 * estándar es una certificación; uno sin clave, diplomado (el diplomado
 * menciona en su texto a qué estándares prepara, pero no se evalúa en él).
 */
function tipoDe(titulo: string, clave: string | null): TipoPrograma {
  if (/^diplomado/i.test(titulo)) return "diplomado";
  return clave ? "certificacion" : "diplomado";
}

async function desdeBase(): Promise<Programa[]> {
  const filas = await getDb()
    .select({
      id: courses.id,
      slug: courses.slug,
      titulo: courses.title,
      subtitulo: courses.subtitle,
      descripcion: courses.description,
      precioMxn: courses.priceMxn,
      imagen: courses.thumbnailUrl,
      instructor: courses.instructorName,
      instructorBio: courses.instructorBio,
      nivel: courses.level,
      modalidad: courses.modalidad,
      estandarClave: courses.estandarClave,
      minutos: courses.durationMinutes,
      categoria: courseCategories.name,
      categoriaSlug: courseCategories.slug,
      cupo: courses.inventoryLimit,
      vendidos: courses.soldCount,
      orden: courses.sortOrder,
    })
    .from(courses)
    .leftJoin(courseCategories, eq(courses.categoryId, courseCategories.id))
    .where(and(eq(courses.status, "published"), eq(courseCategories.channelId, "ceduct")))
    .orderBy(asc(courses.sortOrder), asc(courses.title));

  return filas.map((f, i) => {
    const horas = Math.round(Number(f.minutos ?? 0) / 60);
    const tipo = tipoDe(f.titulo, f.estandarClave);
    return {
      id: f.id,
      slug: f.slug,
      tipo,
      titulo: f.titulo,
      subtitulo: f.subtitulo,
      descripcion: f.descripcion,
      categoria: categoriaDesdeTexto(f.categoriaSlug ?? f.categoria),
      precioMxn: f.precioMxn,
      precioAntesMxn: null,
      imagen: f.imagen,
      instructores: [
        {
          nombre: f.instructor,
          cargo: "Instructor CEDUCT",
          bio: f.instructorBio ?? "",
          foto: null,
        },
      ],
      nivel: f.nivel,
      modalidad: f.modalidad,
      horas,
      // Una certificación no se cursa: se evalúa, y lo que tarda depende de la persona.
      duracion: horas ? `${horas} horas` : tipo === "certificacion" ? "Según tu evaluación" : "A tu ritmo",
      fechaInicio: null,
      estandarClave: f.estandarClave,
      // El temario se carga sólo en la ficha (obtenerPrograma).
      temario: [],
      requisitos: [],
      dirigidoA: [],
      cupo: f.cupo,
      vendidos: f.vendidos,
      // Los primeros del orden manual son los que se destacan en la portada.
      destacado: i < 4,
      fuente: "base" as const,
    };
  });
}

export type Catalogo = { programas: Programa[]; esDemo: boolean };

export async function obtenerCatalogo(): Promise<Catalogo> {
  if (FORZAR_DEMO) return { programas: PROGRAMAS_DEMO, esDemo: true };
  try {
    const programas = await desdeBase();
    if (programas.length > 0) return { programas, esDemo: false };
  } catch (error) {
    console.error("[ceduct/catalogo] la base no respondió; se usa el catálogo de ejemplo", error);
  }
  return { programas: PROGRAMAS_DEMO, esDemo: true };
}

export async function obtenerPrograma(slug: string): Promise<Programa | null> {
  const { programas } = await obtenerCatalogo();
  const p = programas.find((x) => x.slug === slug) ?? PROGRAMAS_DEMO.find((x) => x.slug === slug);
  if (!p) return null;
  if (p.fuente === "demo") return p;
  try {
    const temario = await temarioDe(p.id);
    return { ...p, temario };
  } catch {
    return p;
  }
}

/** Misma categoría primero, luego mismo tipo. Nunca el propio programa. */
export async function relacionadosDe(programa: Programa, cuantos = 3): Promise<Programa[]> {
  const { programas } = await obtenerCatalogo();
  const otros = programas.filter((p) => p.slug !== programa.slug);
  const puntaje = (p: Programa) =>
    (p.categoria === programa.categoria ? 2 : 0) + (p.tipo === programa.tipo ? 1 : 0);
  return [...otros].sort((a, b) => puntaje(b) - puntaje(a)).slice(0, cuantos);
}
