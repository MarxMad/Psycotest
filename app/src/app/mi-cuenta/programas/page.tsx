import Link from "next/link";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import { courseEnrollments, courseLessons, courseModules, courses, lessonProgress } from "@/db/schema";
import { asegurarSeccion } from "../guardia";
import { Avance, Encabezado, Tarjeta, Tarjetas, Vacio } from "../Secciones";

export const dynamic = "force-dynamic";

/** Diplomados y programas largos. Misma fuente que los cursos, otra lectura. */
export default async function MisProgramasPage() {
  // Redirige si esta sección no es del canal de la persona.
  const { user } = await asegurarSeccion("/mi-cuenta/programas");

  const db = getDb();
  const inscritos = await db
    .select({
      inscripcionId: courseEnrollments.id,
      id: courses.id,
      slug: courses.slug,
      titulo: courses.title,
      subtitulo: courses.subtitle,
      minutos: courses.durationMinutes,
    })
    .from(courseEnrollments)
    .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
    .where(eq(courseEnrollments.userId, user.id));

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
      return { id: c.id, porcentaje: total > 0 ? (Number(fila?.hechas ?? 0) / total) * 100 : 0 };
    }),
  );
  const porCurso = new Map(avances.map((a) => [a.id, a.porcentaje]));

  return (
    <>
      <Encabezado
        titulo="Mis programas"
        texto="Los diplomados y rutas de formación en los que estás inscrito."
      />

      {inscritos.length === 0 ? (
        <Vacio
          titulo="No tienes programas activos"
          texto="Cuando te inscribas a un diplomado aparecerá aquí con tu avance y tus materiales."
          accion={<Link href="/consultorio/cursos">Ver programas</Link>}
        />
      ) : (
        <Tarjetas>
          {inscritos.map((c) => (
            <Tarjeta
              key={c.id}
              meta={c.minutos ? `${Math.round(c.minutos / 60)} horas` : "Programa"}
              titulo={c.titulo}
              pie={<Link href={`/consultorio/cursos/${c.slug}/aprender`}>Continuar →</Link>}
            >
              {c.subtitulo && <p>{c.subtitulo}</p>}
              <Avance porcentaje={porCurso.get(c.id) ?? 0} />
            </Tarjeta>
          ))}
        </Tarjetas>
      )}
    </>
  );
}
