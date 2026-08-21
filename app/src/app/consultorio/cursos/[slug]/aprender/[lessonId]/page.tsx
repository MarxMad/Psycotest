import { redirect, notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { canAccessLesson, getEnrollmentBySlug, getPlayerState } from "@/lib/course-access";
import { getLessonInCourse } from "@/lib/courses";
import { CoursePlayer } from "../../../CoursePlayer";
import c from "../../../cursos.module.css";

type Props = { params: Promise<{ slug: string; lessonId: string }> };

export const dynamic = "force-dynamic";

export default async function LessonPage({ params }: Props) {
  const { slug, lessonId } = await params;
  const lessonRow = await getLessonInCourse(slug, lessonId);
  if (!lessonRow) notFound();

  const user = await getSessionUser();
  if (!user) {
    redirect(`/consultorio/ingreso?next=/consultorio/cursos/${slug}/aprender/${lessonId}`);
  }

  const allowed = await canAccessLesson({
    userId: user.id,
    courseId: lessonRow.course.id,
    lessonId,
    freePreview: lessonRow.lesson.freePreview,
  });

  if (!allowed) {
    redirect(`/consultorio/cursos/${slug}`);
  }

  const state = await getPlayerState(user.id, slug);
  if (!state && !lessonRow.lesson.freePreview) {
    redirect(`/consultorio/cursos/${slug}`);
  }

  let curriculum;
  if (state) {
    curriculum = state.curriculum.map((block) => ({
      module: block.module,
      lessons: block.lessons.map(({ lesson, progress }) => ({
        id: lesson.id,
        slug: lesson.slug,
        title: lesson.title,
        durationSeconds: lesson.durationSeconds,
        freePreview: lesson.freePreview,
        progress: progress
          ? { completed: progress.completed, lastPositionSeconds: progress.lastPositionSeconds }
          : null,
      })),
    }));
  } else {
    const { getCourseCurriculum } = await import("@/lib/courses");
    const raw = await getCourseCurriculum(lessonRow.course.id);
    curriculum = raw.map((block) => ({
      module: block.module,
      lessons: block.lessons.map((lesson) => ({
        id: lesson.id,
        slug: lesson.slug,
        title: lesson.title,
        durationSeconds: lesson.durationSeconds,
        freePreview: lesson.freePreview,
        progress: null,
      })),
    }));
  }

  return (
    <div className={c.platziRoot}>
      <CoursePlayer
        courseSlug={slug}
        courseTitle={lessonRow.course.title}
        currentLessonId={lessonId}
        curriculum={curriculum}
        videoUrl={lessonRow.lesson.videoUrl}
        progressPercent={state?.enrollment.progressPercent ?? 0}
      />
    </div>
  );
}
