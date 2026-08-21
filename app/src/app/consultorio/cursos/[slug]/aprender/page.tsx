import { redirect, notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getEnrollmentBySlug } from "@/lib/course-access";
import { firstLessonId, getCourseBySlug } from "@/lib/courses";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export default async function AprenderIndexPage({ params }: Props) {
  const { slug } = await params;
  const row = await getCourseBySlug(slug);
  if (!row) notFound();

  const user = await getSessionUser();
  if (!user) {
    redirect(`/consultorio/ingreso?next=/consultorio/cursos/${slug}/aprender`);
  }

  const enrollment = await getEnrollmentBySlug(user.id, slug);
  if (!enrollment || enrollment.enrollment.status !== "active") {
    redirect(`/consultorio/cursos/${slug}`);
  }

  const lessonId = await firstLessonId(row.course.id);
  if (!lessonId) notFound();
  redirect(`/consultorio/cursos/${slug}/aprender/${lessonId}`);
}
