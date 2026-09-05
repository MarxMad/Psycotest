import { redirect, notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { canAccessLesson, getPlayerState } from "@/lib/course-access";
import { getCourseCurriculum, getLessonInCourse } from "@/lib/courses";
import { getQuizByLessonId } from "@/lib/quizzes";
import { CoursePlayer } from "../../../CoursePlayer";

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

  const quiz = lessonRow.lesson.type === "quiz" ? await getQuizByLessonId(lessonId) : null;

  let curriculum;
  if (state) {
    curriculum = state.curriculum.map((block) => ({
      module: block.module,
      lessons: block.lessons.map(({ lesson, progress }) => ({
        id: lesson.id,
        slug: lesson.slug,
        title: lesson.title,
        type: lesson.type,
        durationSeconds: lesson.durationSeconds,
        freePreview: lesson.freePreview,
        progress: progress
          ? { completed: progress.completed, lastPositionSeconds: progress.lastPositionSeconds }
          : null,
      })),
    }));
  } else {
    const raw = await getCourseCurriculum(lessonRow.course.id);
    curriculum = raw.map((block) => ({
      module: block.module,
      lessons: block.lessons.map((lesson) => ({
        id: lesson.id,
        slug: lesson.slug,
        title: lesson.title,
        type: lesson.type,
        durationSeconds: lesson.durationSeconds,
        freePreview: lesson.freePreview,
        progress: null,
      })),
    }));
  }

  return (
    <CoursePlayer
      courseSlug={slug}
      courseTitle={lessonRow.course.title}
      currentLessonId={lessonId}
      lessonType={lessonRow.lesson.type}
      curriculum={curriculum}
      videoUrl={lessonRow.lesson.videoUrl}
      quizId={quiz?.id ?? null}
      progressPercent={state?.enrollment.progressPercent ?? 0}
    />
  );
}
