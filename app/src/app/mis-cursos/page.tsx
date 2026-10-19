import type { Metadata } from "next";
import { eq, sql } from "drizzle-orm";
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
import { getSessionUser } from "@/lib/auth";

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
    .where(eq(courseEnrollments.userId, userId));

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
  if (usuario) {
    try {
      cursos = await cursosDe(usuario.id);
    } catch (error) {
      console.error("[mis-cursos]", error);
      cursos = [];
    }
  }
  return (
    <MarketShell>
      <MisCursos nombre={usuario?.nombre ?? null} cursos={cursos} />
    </MarketShell>
  );
}
