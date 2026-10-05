import { headers } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import {
  countCourseLessons,
  formatDuration,
  levelLabel,
  listCategoriesByChannel,
  listPublishedCoursesByChannel,
} from "@/lib/courses";
import { getChannelFromHost, type ChannelId } from "@/lib/channels";
import { courseThumbnail, evaluationFocus } from "@/lib/course-marketing";
import { formatMxn } from "@/lib/stripe";
import { CourseSearchBar } from "./CourseSearchBar";
import c from "./cursos.module.css";

export const dynamic = "force-dynamic";

/**
 * Cada canal tiene su escuela. El catálogo se filtra por el canal del host,
 * así que la portada tiene que hablar de lo que ese canal enseña.
 */
const PORTADA: Record<ChannelId, { eyebrow: string; titulo: string; lead: string; sello: string }> = {
  ceduct: {
    eyebrow: "Academy · Formación CONOCER",
    titulo: "Aprende certificación y evaluación a tu ritmo",
    lead:
      "Rutas de aprendizaje con video, temario por módulos y avance por lección — estilo academy, alineadas a certificación CONOCER.",
    sello: "Certificación CONOCER",
  },
  ige: {
    eyebrow: "Academia · Ingeniería de Grupos Efectivos",
    titulo: "Cursos para equipos que tienen que entenderse",
    lead:
      "Dirección, clima laboral, cumplimiento y diagnóstico. En vivo con tu gente y tus casos, o grabados para avanzar cuando se pueda.",
    sello: "En vivo y grabados",
  },
  psicologia: {
    eyebrow: "Academia · Psicología Aplicada",
    titulo: "Formación en evaluación de personal",
    lead: "Cursos sobre aplicación e interpretación de instrumentos psicométricos.",
    sello: "Instrumentos aplicados",
  },
  martin: {
    eyebrow: "Academia",
    titulo: "Cursos y programas",
    lead: "Formación con avance por lección.",
    sello: "Avance por lección",
  },
};

type CourseRow = Awaited<ReturnType<typeof listPublishedCoursesByChannel>>[number];

function CourseCard({
  course,
  lessonCount,
}: {
  course: CourseRow["course"];
  lessonCount: number;
}) {
  return (
    <Link href={`/consultorio/cursos/${course.slug}`} className={c.courseCard}>
      <div className={c.cardThumb}>
        <Image
          src={courseThumbnail(course.id, course.thumbnailUrl)}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, 33vw"
          className={c.cardImg}
        />
        <span className={c.cardFocus}>{evaluationFocus(course.id)}</span>
      </div>
      <div className={c.cardBody}>
        <p className={c.cardTeacher}>{course.instructorName}</p>
        <h3>{course.title}</h3>
        {course.subtitle ? <p className={c.cardSub}>{course.subtitle}</p> : null}
        <div className={c.cardMeta}>
          <span className={c.tag}>{levelLabel(course.level)}</span>
          {lessonCount > 0 ? <span className={c.tag}>{lessonCount} clases</span> : null}
          {course.durationMinutes > 0 ? (
            <span className={c.tag}>{formatDuration(course.durationMinutes)}</span>
          ) : null}
        </div>
        <div className={c.cardFooter}>
          {/* Sin precio cargado el curso se cotiza; "$0" se leería como gratis. */}
          <span className={c.cardPrice}>
            {course.priceMxn > 0 ? formatMxn(course.priceMxn) : "Cotizar"}
          </span>
          <span className={c.cardCta}>Ver curso →</span>
        </div>
      </div>
    </Link>
  );
}

export default async function CursosCatalogPage() {
  const host = (await headers()).get("host");
  const canal: ChannelId = getChannelFromHost(host)?.id ?? "ceduct";
  const portada = PORTADA[canal] ?? PORTADA.ceduct;

  const [categories, courses] = await Promise.all([
    listCategoriesByChannel(canal),
    listPublishedCoursesByChannel(canal),
  ]);

  const lessonCounts = await Promise.all(
    courses.map(async ({ course }) => ({
      id: course.id,
      count: await countCourseLessons(course.id),
    })),
  );
  const lessonsByCourse = Object.fromEntries(lessonCounts.map((x) => [x.id, x.count]));

  const byCategory = categories
    .map((cat) => ({
      category: cat,
      courses: courses.filter((row) => row.category?.id === cat.id),
    }))
    .filter((block) => block.courses.length > 0);

  const uncategorized = courses.filter((row) => !row.category?.id);
  const totalCourses = courses.length;

  return (
    <div className={c.catalogPage}>
      <section className={c.catalogHero}>
        <div className={c.catalogHeroInner}>
          <p className={c.catalogEyebrow}>{portada.eyebrow}</p>
          <h1>{portada.titulo}</h1>
          <p className={c.catalogLead}>{portada.lead}</p>
          {totalCourses > 0 ? <CourseSearchBar /> : null}
          <div className={c.catalogStats}>
            <span>{totalCourses} cursos</span>
            <span>·</span>
            <span>{portada.sello}</span>
            <span>·</span>
            <span>Avance por lección</span>
          </div>
        </div>
      </section>

      <div className={c.catalogBody}>
        {totalCourses === 0 ? (
          <>
            <div className={c.emptyState}>
              <div className={c.emptyIcon} aria-hidden>
                ▣
              </div>
              <h2>Catálogo en preparación</h2>
              <p>
                Pronto verás rutas de formación con clases en video, progreso y certificación. Mientras
                tanto puedes entrar a tu cuenta o volver a la página principal.
              </p>
              <div className={c.emptyActions}>
                <Link href="/consultorio/ingreso" className={c.emptyPrimary}>
                  Acceder
                </Link>
                <Link href="/mi-cuenta" className={c.emptySecondary}>
                  Ir a mi cuenta
                </Link>
              </div>
            </div>
            <div className={c.comingRail} aria-hidden>
              <div className={c.comingCard}>
                <strong>Evaluación de competencias</strong>
                <span>Ruta introductoria con módulos y prácticas.</span>
              </div>
              <div className={c.comingCard}>
                <strong>Certificación CONOCER</strong>
                <span>Preparación al estándar y expediente digital.</span>
              </div>
              <div className={c.comingCard}>
                <strong>Desarrollo organizacional</strong>
                <span>Diagnóstico, selección y capacitación aplicada.</span>
              </div>
            </div>
          </>
        ) : (
          <>
            {byCategory.length > 0 ? (
              <nav className={c.schoolNav} aria-label="Escuelas">
                {byCategory.map(({ category }) => (
                  <a key={category.id} href={`#school-${category.slug}`} className={c.schoolPill}>
                    {category.name}
                  </a>
                ))}
                {uncategorized.length > 0 ? (
                  <a href="#school-todos" className={c.schoolPill}>
                    Todos
                  </a>
                ) : null}
              </nav>
            ) : null}

            {byCategory.map(({ category, courses: catCourses }) => (
              <section key={category.id} id={`school-${category.slug}`} className={c.schoolSection}>
                <header className={c.schoolHead}>
                  <div>
                    <h2>{category.name}</h2>
                    {category.description ? <p>{category.description}</p> : null}
                  </div>
                </header>
                <div className={c.courseGrid}>
                  {catCourses.map(({ course }) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      lessonCount={lessonsByCourse[course.id] ?? 0}
                    />
                  ))}
                </div>
              </section>
            ))}

            {uncategorized.length > 0 ? (
              <section id="school-todos" className={c.schoolSection}>
                <header className={c.schoolHead}>
                  <div>
                    <h2>{byCategory.length > 0 ? "Otros cursos" : "Todos los cursos"}</h2>
                    <p>Formación disponible en la plataforma.</p>
                  </div>
                </header>
                <div className={c.courseGrid}>
                  {uncategorized.map(({ course }) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      lessonCount={lessonsByCourse[course.id] ?? 0}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
