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

export default async function CursosCatalogPage() {
  const [categories, courses] = await Promise.all([listCategories(), listPublishedCourses()]);

  const lessonCounts = await Promise.all(
    courses.map(async ({ course }) => ({
      id: course.id,
      count: await countCourseLessons(course.id),
    })),
  );
  const lessonsByCourse = Object.fromEntries(lessonCounts.map((x) => [x.id, x.count]));

  const byCategory = categories.map((cat) => ({
    category: cat,
    courses: courses.filter((row) => row.category?.id === cat.id),
  }));

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
          <CourseSearchBar />
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
        <nav className={c.schoolNav} aria-label="Escuelas">
          {categories.map((cat) => (
            <a key={cat.id} href={`#school-${cat.slug}`} className={c.schoolPill}>
              {cat.name}
            </a>
          ))}
        </nav>

        {byCategory.map(({ category, courses: catCourses }) =>
          catCourses.length === 0 ? null : (
            <section key={category.id} id={`school-${category.slug}`} className={c.schoolSection}>
              <header className={c.schoolHead}>
                <div>
                  <h2>{category.name}</h2>
                  {category.description ? <p>{category.description}</p> : null}
                </div>
              </header>
              <div className={c.courseGrid}>
                {catCourses.map(({ course }) => (
                  <Link key={course.id} href={`/consultorio/cursos/${course.slug}`} className={c.courseCard}>
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
                      <p className={c.cardSub}>{course.subtitle}</p>
                      <div className={c.cardMeta}>
                        <span className={c.tag}>{levelLabel(course.level)}</span>
                        <span className={c.tag}>{lessonsByCourse[course.id] ?? 0} clases</span>
                        <span className={c.tag}>{formatDuration(course.durationMinutes)}</span>
                      </div>
                      <div className={c.cardFooter}>
                        <span className={c.cardPrice}>{formatMxn(course.priceMxn)}</span>
                        <span className={c.cardCta}>Ver curso →</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ),
        )}
      </div>
    </>
  );
}
