import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getPlayerState } from "@/lib/course-access";
import { getCourseBySlug, getCourseCurriculum } from "@/lib/courses";
import { getBestQuizAttempt, getQuizByLessonId } from "@/lib/quizzes";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug requerido" }, { status: 400 });

  const user = await getSessionUser();
  const courseRow = await getCourseBySlug(slug);
  if (!courseRow) return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });

  if (user) {
    const state = await getPlayerState(user.id, slug);
    if (state) {
      const curriculum = [];
      for (const block of state.curriculum) {
        const lessons = [];
        for (const { lesson, progress } of block.lessons) {
          const quiz = lesson.type === "quiz" ? await getQuizByLessonId(lesson.id) : null;
          const best =
            quiz != null ? await getBestQuizAttempt(state.enrollment.id, quiz.id) : null;
          lessons.push({
            id: lesson.id,
            slug: lesson.slug,
            title: lesson.title,
            type: lesson.type,
            durationSeconds: lesson.durationSeconds,
            freePreview: lesson.freePreview,
            completed: progress?.completed ?? false,
            lastPositionSeconds: progress?.lastPositionSeconds ?? 0,
            quizId: quiz?.id ?? null,
            quizPassed: best?.passed ?? false,
            quizScore: best?.score ?? null,
          });
        }
        curriculum.push({ module: block.module, lessons });
      }
      return NextResponse.json({
        course: courseRow.course,
        enrolled: true,
        progressPercent: state.enrollment.progressPercent,
        curriculum,
      });
    }
  }

  const raw = await getCourseCurriculum(courseRow.course.id);
  const curriculum = [];
  for (const block of raw) {
    const lessons = [];
    for (const lesson of block.lessons) {
      const quiz = lesson.type === "quiz" ? await getQuizByLessonId(lesson.id) : null;
      lessons.push({
        id: lesson.id,
        slug: lesson.slug,
        title: lesson.title,
        type: lesson.type,
        durationSeconds: lesson.durationSeconds,
        freePreview: lesson.freePreview,
        completed: false,
        lastPositionSeconds: 0,
        quizId: quiz?.id ?? null,
        quizPassed: false,
        quizScore: null,
      });
    }
    curriculum.push({ module: block.module, lessons });
  }

  return NextResponse.json({
    course: courseRow.course,
    enrolled: false,
    progressPercent: 0,
    curriculum,
  });
}
