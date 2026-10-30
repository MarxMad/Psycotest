import type { Metadata } from "next";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import {
  courseCategories,
  courseEnrollments,
  courseLessons,
  courseModules,
  courses,
  lessonProgress,
} from "@/db/schema";
import { MarketShell } from "@/components/marketplace/MarketShell";
import { MisCursos, type CursoInscrito } from "@/components/marketplace/paginas/MisCursos";
import { inicioDelArea } from "@/lib/area-alumno";
import { getSessionUser } from "@/lib/auth";
import { contenidoPorCanal } from "@/lib/canal-del-alumno";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mis cursos — CEDUCT",
  robots: { index: false, follow: false },
};

async function cursosDe(userId: string): Promise<CursoInscrito[]> {
  const db = getDb();
  const inscritos = await db
    .select({
      inscripcionId: courseEnrollments.id,
      estado: courseEnrollments.status,
      id: courses.id,
      slug: courses.slug,
      titulo: courses.title,
      subtitulo: courses.subtitle,
      instructor: courses.instructorName,
      imagen: courses.thumbnailUrl,
      categoria: courseCategories.name,
    })
    .from(courseEnrollments)
    .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
    .leftJoin(courseCategories, eq(courses.categoryId, courseCategories.id))
    // Sólo lo de CEDUCT: lo comprado en otra marca no tiene por qué asomarse aquí.
    .where(and(eq(courseEnrollments.userId, userId), eq(courseCategories.channelId, "ceduct")));

  return Promise.all(
    inscritos
      .filter((c) => c.estado !== "refunded" && c.estado !== "cancelled")
      .map(async (c) => {
        const [fila] = await db
          .select({
            total: sql<number>`count(distinct ${courseLessons.id})`,
            hechas: sql<number>`count(distinct ${lessonProgress.lessonId})`,
          })
          .from(courseModules)
          .leftJoin(courseLessons, eq(courseLessons.moduleId, courseModules.id))
          .leftJoin(
            lessonProgress,
            sql`${lessonProgress.lessonId} = ${courseLessons.id}
                and ${lessonProgress.enrollmentId} = ${c.inscripcionId}
                and ${lessonProgress.completed} = true`,
          )
          .where(eq(courseModules.courseId, c.id));
        const total = Number(fila?.total ?? 0);
        const hechas = Number(fila?.hechas ?? 0);
        return {
          id: c.id,
          slug: c.slug,
          titulo: c.titulo,
          subtitulo: c.subtitulo,
          instructor: c.instructor,
          imagen: c.imagen,
          categoria: c.categoria,
          estado: c.estado,
          total,
          hechas,
          porcentaje: total > 0 ? (hechas / total) * 100 : 0,
        };
      }),
  );
}

export default async function MisCursosPage() {
  const usuario = await getSessionUser().catch(() => null);
  let cursos: CursoInscrito[] | null = null;
  let area: string | null = null;
  if (usuario) {
    try {
      const [lista, conteo] = await Promise.all([cursosDe(usuario.id), contenidoPorCanal(usuario.id)]);
      cursos = lista;
      if (conteo.ceduct > 0) area = inicioDelArea("ceduct");
    } catch (error) {
      console.error("[mis-cursos]", error);
      cursos = [];
    }
  }
  return (
    <MarketShell>
      <MisCursos nombre={usuario?.nombre ?? null} cursos={cursos} area={area} />
    </MarketShell>
  );
}
