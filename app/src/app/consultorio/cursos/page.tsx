import Link from "next/link";
import { ConsultorioNav } from "../ConsultorioNav";
import { listCategories, listPublishedCourses, formatDuration, levelLabel } from "@/lib/courses";
import { formatMxn } from "@/lib/stripe";
import styles from "../consultorio.module.css";
import c from "./cursos.module.css";

export const dynamic = "force-dynamic";

export default async function CursosCatalogPage() {
  const [categories, courses] = await Promise.all([listCategories(), listPublishedCourses()]);

  const byCategory = categories.map((cat) => ({
    category: cat,
    courses: courses.filter((row) => row.category.id === cat.id),
  }));

  return (
    <div className={styles.page}>
      <ConsultorioNav />
      <section className={c.catalogHero}>
        <div className={styles.wrap}>
          <p className={styles.eyebrow}>Formación en línea</p>
          <h1>Cursos grabados</h1>
          <p>Aprende a tu ritmo con clases en video, temario por módulos y seguimiento de avance — estilo Platzi.</p>
        </div>
      </section>

      <div className={`${styles.wrap} ${c.catalogPage}`}>
        {byCategory.map(({ category, courses: catCourses }) =>
          catCourses.length === 0 ? null : (
            <section key={category.id} className={c.categoryBlock}>
              <div className={c.categoryHead}>
                <div>
                  <h2>{category.name}</h2>
                  {category.description ? <p>{category.description}</p> : null}
                </div>
              </div>
              <div className={c.courseGrid}>
                {catCourses.map(({ course }) => (
                  <Link key={course.id} href={`/consultorio/cursos/${course.slug}`} className={c.courseCard}>
                    <div className={c.cardThumb}>{levelLabel(course.level)}</div>
                    <div className={c.cardBody}>
                      <div className={c.cardMeta}>
                        <span className={c.tag}>{levelLabel(course.level)}</span>
                        <span className={c.tag}>{formatDuration(course.durationMinutes)}</span>
                      </div>
                      <h3>{course.title}</h3>
                      <p>{course.subtitle ?? course.description.slice(0, 120)}…</p>
                      <div className={c.cardFooter}>
                        <span>{formatMxn(course.priceMxn)}</span>
                        <span>Ver curso →</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ),
        )}
      </div>
    </div>
  );
}
