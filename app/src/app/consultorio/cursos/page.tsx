import Link from "next/link";
import Image from "next/image";
import {
  countCourseLessons,
  formatDuration,
  levelLabel,
  listCategories,
  listPublishedCourses,
} from "@/lib/courses";
import { courseThumbnail, evaluationFocus } from "@/lib/course-marketing";
import { formatMxn } from "@/lib/stripe";
import { CourseSearchBar } from "./CourseSearchBar";
import c from "./cursos.module.css";

export const dynamic = "force-dynamic";

type CourseRow = Awaited<ReturnType<typeof listPublishedCourses>>[number];

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
          <span className={c.tag}>{lessonCount} clases</span>
          <span className={c.tag}>{formatDuration(course.durationMinutes)}</span>
        </div>
        <div className={c.cardFooter}>
          <span className={c.cardPrice}>{formatMxn(course.priceMxn)}</span>
          <span className={c.cardCta}>Ver curso →</span>
        </div>
      </div>
    </Link>
  );
}

export default async function CursosCatalogPage() {
  const [categories, courses] = await Promise.all([listCategories(), listPublishedCourses()]);

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
    <>
      <section className={c.catalogHero}>
        <div className={c.catalogHeroInner}>
          <p className={c.catalogEyebrow}>Academy · Formación CONOCER</p>
          <h1>Aprende certificación y evaluación a tu ritmo</h1>
          <p className={c.catalogLead}>
            Cursos grabados con clases en video, temario por módulos y seguimiento de avance integrado con
            certificación CONOCER.
          </p>
          {totalCourses > 0 ? <CourseSearchBar /> : null}
          <div className={c.catalogStats}>
            <span>{totalCourses} cursos</span>
            <span>·</span>
            <span>Certificación CONOCER</span>
            <span>·</span>
            <span>Avance por lección</span>
          </div>
        </div>
      </section>

      <div className={c.catalogBody}>
        {totalCourses === 0 ? (
          <div className={c.emptyState}>
            <h2>Próximamente en catálogo</h2>
            <p>
              Estamos preparando los programas de formación. Mientras tanto puedes acceder a tu cuenta o
              conocer la certificación CONOCER en la página principal.
            </p>
            <div className={c.emptyActions}>
              <Link href="/consultorio/ingreso" className={c.emptyPrimary}>
                Acceder
              </Link>
              <Link href="/" className={c.emptySecondary}>
                Volver al inicio
              </Link>
            </div>
          </div>
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
    </>
  );
}
