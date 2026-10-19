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
import { whatsapp } from "@/lib/contacto";
import { CHANNELS, channelPublicUrl } from "@/lib/channels";
import { ChannelShell } from "@/components/channels/ChannelShell";
import { canalDelCurso } from "../canal";
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
    redirect(`/cursos/${LEGACY_SLUGS[slug]}`);
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
  const canal = canalDelCurso(category?.channelId);

  let lessonIndex = 0;

  return (
    <ChannelShell channel={CHANNELS[canal]}>
      <div className={c.detailHero}>
        <div className={c.detailHeroInner}>
          <p className={c.detailBreadcrumb}>
            <Link href={`${channelPublicUrl(canal)}#academia`}>Cursos</Link>
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
                {lessonCount > 0 ? <span>{lessonCount} clases</span> : null}
                {course.durationMinutes > 0 ? (
                  <span>{formatDuration(course.durationMinutes)} de contenido</span>
                ) : null}
                <span>{course.modalidad === "online" ? "Grabado" : "En vivo"}</span>
                {course.estandarClave ? <span>Estándar {course.estandarClave}</span> : null}
              </div>

              <div className={c.instructorRow}>
                <div className={c.instructorAvatar} aria-hidden>
                  {course.instructorName
                    .split(/\s+/)
                    .filter((p) => p.length > 2)
                    .slice(0, 2)
                    .map((p) => p[0]?.toUpperCase())
                    .join("")}
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
                {course.priceMxn > 0 ? (
                  <CourseCheckout
                    courseSlug={course.slug}
                    priceLabel={formatMxn(course.priceMxn)}
                    stripeReady={isStripeConfigured()}
                    enrolled={enrolled}
                  />
                ) : (
                  <div className={c.checkoutBox}>
                    <p className={c.priceTag}>Precio a cotizar</p>
                    <a
                      className={c.btnPrimary}
                      href={whatsapp(`Hola, quiero cotizar el curso «${course.title}».`)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Pedir cotización
                    </a>
                    <p className={c.checkoutHint}>
                      Se cotiza por grupo: nos dices cuántas personas y en qué modalidad.
                    </p>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>

      <div className={c.detailBody}>
        <div className={c.detailBodyInner}>
          <h2 className={c.syllabusTitle}>Contenido del curso</h2>
          <p className={c.syllabusLead}>
            {lessonCount > 0
              ? `${lessonCount} clases · ${formatDuration(course.durationMinutes)} · Avance guardado automáticamente`
              : `${formatDuration(course.durationMinutes)} de programa · el temario detallado va en la propuesta`}
          </p>

          <div className={c.syllabusPlatzi}>
            {curriculum.length === 0 ? (
              <p className={c.syllabusLead}>
                Este curso se arma sobre tu diagnóstico: el temario con objetivos, duración y
                materiales se entrega en la propuesta.
              </p>
            ) : null}
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
    </ChannelShell>
  );
}
