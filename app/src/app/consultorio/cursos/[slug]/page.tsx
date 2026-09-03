import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getEnrollmentBySlug } from "@/lib/course-access";
import {
  countCourseLessons,
  formatDuration,
  formatLessonDuration,
  getCourseBySlug,
  getCourseCurriculum,
  levelLabel,
} from "@/lib/courses";
import { courseThumbnail, evaluationFocus } from "@/lib/course-marketing";
import { formatMxn, isStripeConfigured } from "@/lib/stripe";
import { CourseCheckout } from "../CourseCheckout";
import c from "../cursos.module.css";

type Props = { params: Promise<{ slug: string }> };

const LEGACY_SLUGS: Record<string, string> = {
  "papi-practica-clinica": "perfil-conductual-organizacional",
  "mabe-seleccion-puestos": "ajuste-candidato-puesto",
};

export const dynamic = "force-dynamic";

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;
  if (LEGACY_SLUGS[slug]) {
    redirect(`/consultorio/cursos/${LEGACY_SLUGS[slug]}`);
  }
  const row = await getCourseBySlug(slug);
  if (!row?.course.published) notFound();

  const { course, category } = row;
  const curriculum = await getCourseCurriculum(course.id);
  const lessonCount = await countCourseLessons(course.id);
  const user = await getSessionUser();
  const enrollment = user ? await getEnrollmentBySlug(user.id, slug) : null;
  const enrolled = enrollment?.enrollment.status === "active";
  const thumb = courseThumbnail(course.id, course.thumbnailUrl);
  const focus = evaluationFocus(course.id);

  let lessonIndex = 0;

  return (
    <>
      <div className={c.detailHero}>
        <div className={c.detailHeroInner}>
          <p className={c.detailBreadcrumb}>
            <Link href="/consultorio/cursos">Cursos</Link>
            <span>/</span>
            <span>{category?.name ?? "Cursos"}</span>
          </p>

          <div className={c.detailGrid}>
            <div className={c.detailMain}>
              <span className={c.detailFocus}>{focus}</span>
              <h1>{course.title}</h1>
              {course.subtitle ? <p className={c.detailSub}>{course.subtitle}</p> : null}
              <p className={c.detailDesc}>{course.description}</p>

              <div className={c.metaPills}>
                <span>{levelLabel(course.level)}</span>
                <span>{lessonCount} clases</span>
                <span>{formatDuration(course.durationMinutes)} de contenido</span>
                <span>Certificación CONOCER</span>
              </div>

              <div className={c.instructorRow}>
                <div className={c.instructorAvatar} aria-hidden>
                  MH
                </div>
                <div>
                  <p className={c.instructorName}>{course.instructorName}</p>
                  <p className={c.instructorBio}>{course.instructorBio}</p>
                </div>
              </div>
            </div>

            <aside className={c.detailAside}>
              <div className={c.previewCard}>
                <div className={c.previewThumb}>
                  <Image src={thumb} alt="" fill sizes="320px" className={c.cardImg} priority />
                  <span className={c.previewPlay} aria-hidden>
                    ▶
                  </span>
                </div>
                <CourseCheckout
                  courseSlug={course.slug}
                  priceLabel={formatMxn(course.priceMxn)}
                  stripeReady={isStripeConfigured()}
                  hasPriceId={Boolean(course.stripePriceId)}
                  enrolled={enrolled}
                />
              </div>
            </aside>
          </div>
        </div>
      </div>

      <div className={c.detailBody}>
        <div className={c.detailBodyInner}>
          <h2 className={c.syllabusTitle}>Contenido del curso</h2>
          <p className={c.syllabusLead}>
            {lessonCount} clases · {formatDuration(course.durationMinutes)} · Avance guardado automáticamente
          </p>

          <div className={c.syllabusPlatzi}>
            {curriculum.map((block) => (
              <section key={block.module.id} className={c.syllabusSection}>
                <h3>{block.module.title}</h3>
                <ol className={c.lessonList}>
                  {block.lessons.map((lesson) => {
                    lessonIndex += 1;
                    return (
                      <li key={lesson.id} className={c.lessonRow}>
                        <span className={c.lessonNum}>{lessonIndex}</span>
                        <div className={c.lessonInfo}>
                          <span className={c.lessonTitle}>{lesson.title}</span>
                          {lesson.description ? (
                            <span className={c.lessonDesc}>{lesson.description}</span>
                          ) : null}
                        </div>
                        <span className={c.lessonMeta}>
                          {lesson.freePreview ? <span className={c.previewTag}>Gratis</span> : null}
                          {formatLessonDuration(lesson.durationSeconds)}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </section>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
