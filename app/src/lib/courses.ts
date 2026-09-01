import { asc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";

export type CourseWithCategory = {
  course: typeof schema.courses.$inferSelect;
  category: typeof schema.courseCategories.$inferSelect;
};

export type LessonWithModule = {
  lesson: typeof schema.courseLessons.$inferSelect;
  module: typeof schema.courseModules.$inferSelect;
};

export async function listCategories() {
  const db = getDb();
  return db.select().from(schema.courseCategories).orderBy(asc(schema.courseCategories.sortOrder));
}

export async function listPublishedCourses() {
  const db = getDb();
  const rows = await db
    .select({
      course: schema.courses,
      category: schema.courseCategories,
    })
    .from(schema.courses)
    .innerJoin(schema.courseCategories, eq(schema.courses.categoryId, schema.courseCategories.id))
    .where(eq(schema.courses.published, true))
    .orderBy(asc(schema.courseCategories.sortOrder), asc(schema.courses.sortOrder));
  return rows;
}

export async function getCourseBySlug(slug: string) {
  const db = getDb();
  const [row] = await db
    .select({
      course: schema.courses,
      category: schema.courseCategories,
    })
    .from(schema.courses)
    .innerJoin(schema.courseCategories, eq(schema.courses.categoryId, schema.courseCategories.id))
    .where(eq(schema.courses.slug, slug))
    .limit(1);
  return row ?? null;
}

export async function getCourseCurriculum(courseId: string) {
  const db = getDb();
  const modules = await db
    .select()
    .from(schema.courseModules)
    .where(eq(schema.courseModules.courseId, courseId))
    .orderBy(asc(schema.courseModules.sortOrder));

  const lessonsByModule = await Promise.all(
    modules.map(async (mod) => {
      const lessons = await db
        .select()
        .from(schema.courseLessons)
        .where(eq(schema.courseLessons.moduleId, mod.id))
        .orderBy(asc(schema.courseLessons.sortOrder));
      return { module: mod, lessons };
    }),
  );

  return lessonsByModule;
}

export async function getLessonInCourse(courseSlug: string, lessonId: string) {
  const courseRow = await getCourseBySlug(courseSlug);
  if (!courseRow) return null;

  const db = getDb();
  const [lesson] = await db
    .select({
      lesson: schema.courseLessons,
      module: schema.courseModules,
    })
    .from(schema.courseLessons)
    .innerJoin(schema.courseModules, eq(schema.courseLessons.moduleId, schema.courseModules.id))
    .where(eq(schema.courseLessons.id, lessonId))
    .limit(1);

  if (!lesson || lesson.module.courseId !== courseRow.course.id) return null;
  return { ...courseRow, ...lesson };
}

export async function countCourseLessons(courseId: string) {
  const curriculum = await getCourseCurriculum(courseId);
  return curriculum.reduce((n, m) => n + m.lessons.length, 0);
}

export async function firstLessonId(courseId: string) {
  const curriculum = await getCourseCurriculum(courseId);
  for (const block of curriculum) {
    if (block.lessons[0]) return block.lessons[0].id;
  }
  return null;
}
