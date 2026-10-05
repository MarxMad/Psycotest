import Link from "next/link";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import { courseEnrollments, courseLessons, courseModules, courses, lessonProgress } from "@/db/schema";
import { asegurarSeccion } from "../guardia";
import { Avance, Encabezado, Tarjeta, Tarjetas, Vacio } from "../Secciones";

export const dynamic = "force-dynamic";

export default async function MisCursosPage() {
  // Redirige si esta sección no es del canal de la persona.
  const { user } = await asegurarSeccion("/mi-cuenta/cursos");

  const db = getDb();

  const inscritos = await db
    .select({
      inscripcionId: courseEnrollments.id,
      id: courses.id,
      slug: courses.slug,
      titulo: courses.title,
      subtitulo: courses.subtitle,
      instructor: courses.instructorName,
    })
    .from(courseEnrollments)
    .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
    .where(eq(courseEnrollments.userId, user.id));

  // Avance por curso: lecciones completadas sobre el total
  const avances = await Promise.all(
    inscritos.map(async (c) => {
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
      return { id: c.id, porcentaje: total > 0 ? (hechas / total) * 100 : 0, total, hechas };
    }),
  );
  const porCurso = new Map(avances.map((a) => [a.id, a]));

  return (
    <>
      <Encabezado
        titulo="Mis cursos"
        texto="Las clases que contrataste, con tu avance guardado lección por lección."
      />

      {inscritos.length === 0 ? (
        <Vacio
          titulo="Todavía no tienes cursos"
          texto="Cuando te inscribas a un programa aparecerá aquí con tu avance."
          accion={<Link href="/cursos">Ver catálogo</Link>}
        />
      ) : (
        <Tarjetas>
          {inscritos.map((c) => {
            const a = porCurso.get(c.id);
            return (
              <Tarjeta
                key={c.id}
                meta={c.instructor}
                titulo={c.titulo}
                pie={
                  <Link href={`/cursos/${c.slug}/aprender`}>
                    {a && a.hechas > 0 ? "Continuar →" : "Empezar →"}
                  </Link>
                }
              >
                {c.subtitulo && <p>{c.subtitulo}</p>}
                {a && a.total > 0 && <Avance porcentaje={a.porcentaje} />}
              </Tarjeta>
            );
          })}
        </Tarjetas>
      )}
    </>
  );
}
