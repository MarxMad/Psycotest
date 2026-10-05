import { redirect, notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { canAccessLesson, getEnrollmentBySlug, getPlayerState } from "@/lib/course-access";
import { getLessonInCourse } from "@/lib/courses";
import { clasesDeCanal, estiloDeCanal } from "@/lib/tema-canal";
import { canalDelCurso } from "../../../canal";
import { CoursePlayer } from "../../../CoursePlayer";

type Props = { params: Promise<{ slug: string; lessonId: string }> };

export const dynamic = "force-dynamic";

export default async function LessonPage({ params }: Props) {
  const { slug, lessonId } = await params;
  const lessonRow = await getLessonInCourse(slug, lessonId);
  if (!lessonRow) notFound();

  const user = await getSessionUser();
  if (!user) {
    redirect(`/login?next=/cursos/${slug}/aprender/${lessonId}`);
  }

  const allowed = await canAccessLesson({
    userId: user.id,
    courseId: lessonRow.course.id,
    lessonId,
    freePreview: lessonRow.lesson.freePreview,
  });

  if (!allowed) {
    redirect(`/cursos/${slug}`);
  }

  const state = await getPlayerState(user.id, slug);
  if (!state && !lessonRow.lesson.freePreview) {
    redirect(`/cursos/${slug}`);
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

  // El reproductor va a pantalla completa, sin encabezado de sitio; el tema
  // del canal sí viaja con él para que no cambie de piel al entrar a clase.
  const canal = canalDelCurso(lessonRow.category?.channelId);

  return (
    <div className={clasesDeCanal(canal)} style={estiloDeCanal(canal)}>
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
