import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getEnrollmentBySlug } from "@/lib/course-access";
import {
  formatDuration,
  formatLessonDuration,
  getCourseBySlug,
  getCourseCurriculum,
  levelLabel,
} from "@/lib/courses";
import { formatMxn, isStripeConfigured } from "@/lib/stripe";
import { ConsultorioNav } from "../../ConsultorioNav";
import styles from "../../consultorio.module.css";
import { CourseCheckout } from "../CourseCheckout";
import c from "../cursos.module.css";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;
  const row = await getCourseBySlug(slug);
  if (!row?.course.published) notFound();

  const { course, category } = row;
  const curriculum = await getCourseCurriculum(course.id);
  const user = await getSessionUser();
  const enrollment = user ? await getEnrollmentBySlug(user.id, slug) : null;
  const enrolled = enrollment?.enrollment.status === "active";

  return (
    <div className={styles.page}>
      <ConsultorioNav />
      <div className={`${styles.wrap} ${c.courseLanding}`}>
        <p className={styles.eyebrow}>
          <Link href="/consultorio/cursos">Cursos</Link> / {category.name}
        </p>

        <div className={c.courseLandingGrid}>
          <div className={c.courseLandingMain}>
            <h1>{course.title}</h1>
            {course.subtitle ? <p className={c.courseSub}>{course.subtitle}</p> : null}
            <p className={c.courseDesc}>{course.description}</p>

            <p className={styles.eyebrow}>Temario</p>
            <div className={c.syllabus}>
              {curriculum.map((block) => (
                <div key={block.module.id} className={c.syllabusModule}>
                  <h3>{block.module.title}</h3>
                  <ul>
                    {block.lessons.map((lesson) => (
                      <li key={lesson.id}>
                        <span>{lesson.title}</span>
                        <span>
                          {lesson.freePreview ? <span className={c.previewTag}>Preview</span> : null}{" "}
                          {formatLessonDuration(lesson.durationSeconds)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <p style={{ marginTop: "1.5rem", fontSize: "0.88rem", color: "var(--c-muted)" }}>
              <strong>Instructor:</strong> {course.instructorName}
              {course.instructorBio ? ` — ${course.instructorBio}` : ""}
            </p>
            <p style={{ fontSize: "0.88rem", color: "var(--c-muted)" }}>
              {levelLabel(course.level)} · {formatDuration(course.durationMinutes)}
            </p>
          </div>

          <CourseCheckout
            courseSlug={course.slug}
            priceLabel={formatMxn(course.priceMxn)}
            stripeReady={isStripeConfigured()}
            hasPriceId={Boolean(course.stripePriceId)}
            enrolled={enrolled}
          />
        </div>
      </div>
    </div>
  );
}
