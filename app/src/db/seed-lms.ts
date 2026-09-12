import { eq } from "drizzle-orm";
import type { AppDb } from "./index";
import * as schema from "./schema";

const DEMO_COURSE_ID = "course-demo-conocer";
const DEMO_SLUG = "fundamentos-evaluacion-conocer";

/**
 * Curso demo Platzi-style: 1 módulo, 1 video + 1 quiz.
 * Idempotente — no duplica si ya existe el slug completo.
 */
export async function seedDemoCourse(db: AppDb): Promise<void> {
  const [existing] = await db
    .select({ id: schema.courses.id })
    .from(schema.courses)
    .where(eq(schema.courses.slug, DEMO_SLUG))
    .limit(1);

  if (existing) {
    const lessons = await db
      .select({ id: schema.courseLessons.id })
      .from(schema.courseLessons)
      .innerJoin(schema.courseModules, eq(schema.courseLessons.moduleId, schema.courseModules.id))
      .where(eq(schema.courseModules.courseId, existing.id))
      .limit(1);
    if (lessons.length > 0) return;
    // Curso huérfano sin lecciones: limpiar y recrear
    await db.delete(schema.courses).where(eq(schema.courses.id, existing.id));
  }

  const now = new Date().toISOString();

  const [cat] = await db
    .select({ id: schema.courseCategories.id })
    .from(schema.courseCategories)
    .where(eq(schema.courseCategories.slug, "conocer"))
    .limit(1);

  let categoryId = cat?.id;
  if (!categoryId) {
    categoryId = "cat-conocer";
    await db
      .insert(schema.courseCategories)
      .values({
        id: categoryId,
        slug: "conocer",
        name: "Certificación CONOCER",
        description: "Rutas hacia estándares de competencia laboral",
        sortOrder: 1,
      })
      .onConflictDoNothing();
    const [again] = await db
      .select({ id: schema.courseCategories.id })
      .from(schema.courseCategories)
      .where(eq(schema.courseCategories.slug, "conocer"))
      .limit(1);
    categoryId = again?.id ?? categoryId;
  }

  await db.insert(schema.courses).values({
    id: DEMO_COURSE_ID,
    title: "Fundamentos de evaluación CONOCER",
    slug: DEMO_SLUG,
    description:
      "Introducción práctica a la evaluación de competencias: marco CONOCER, evidencia y cuestionario de comprobación.",
    subtitle: "Curso demo con video y quiz validados",
    categoryId,
    priceMxn: 0,
    instructorName: "Equipo consultorio",
    level: "basico",
    durationMinutes: 25,
    published: true,
    status: "published",
    requireQuizPass: true,
    sortOrder: 1,
    createdAt: now,
    updatedAt: now,
  });

  const moduleId = "mod-demo-1";
  await db.insert(schema.courseModules).values({
    id: moduleId,
    courseId: DEMO_COURSE_ID,
    title: "Módulo 1 · Marco y evidencia",
    sortOrder: 1,
  });

  const videoLessonId = "lesson-demo-video";
  await db.insert(schema.courseLessons).values({
    id: videoLessonId,
    moduleId,
    slug: "introduccion-conocer",
    title: "¿Qué es CONOCER y por qué certificar?",
    description: "Visión general del Sistema Nacional de Competencias.",
    type: "video",
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    durationSeconds: 120,
    sortOrder: 1,
    freePreview: true,
  });

  const quizLessonId = "lesson-demo-quiz";
  await db.insert(schema.courseLessons).values({
    id: quizLessonId,
    moduleId,
    slug: "comprobacion-modulo-1",
    title: "Comprobación · Módulo 1",
    description: "Cuestionario de validación (aprueba con 70%).",
    type: "quiz",
    durationSeconds: 0,
    sortOrder: 2,
    freePreview: false,
  });

  const quizId = "quiz-demo-1";
  await db.insert(schema.courseQuizzes).values({
    id: quizId,
    lessonId: quizLessonId,
    passScore: 70,
    maxAttempts: 5,
    shuffleQuestions: false,
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(schema.quizQuestions).values([
    {
      id: "qq-demo-1",
      quizId,
      prompt: "¿Qué organismo coordina el Sistema Nacional de Competencias en México?",
      type: "single",
      options: [
        { key: "a", label: "CONOCER" },
        { key: "b", label: "IMSS" },
        { key: "c", label: "SAT" },
      ],
      correctKeys: ["a"],
      explanation: "CONOCER articula el SNCL y los estándares de competencia.",
      sortOrder: 1,
    },
    {
      id: "qq-demo-2",
      quizId,
      prompt: "Una certificación CONOCER reconoce principalmente:",
      type: "single",
      options: [
        { key: "a", label: "Un título universitario" },
        { key: "b", label: "Competencias laborales demostradas" },
        { key: "c", label: "Antigüedad en la empresa" },
      ],
      correctKeys: ["b"],
      explanation: "Se certifica lo que la persona sabe hacer conforme a un estándar.",
      sortOrder: 2,
    },
    {
      id: "qq-demo-3",
      quizId,
      prompt: "El respaldo institucional de las constancias CONOCER se vincula a la SEP.",
      type: "true_false",
      options: [
        { key: "true", label: "Verdadero" },
        { key: "false", label: "Falso" },
      ],
      correctKeys: ["true"],
      explanation: "El marco de certificación de competencias se reconoce en el ámbito de la SEP.",
      sortOrder: 3,
    },
  ]);

  console.info(`[psycotest] Curso demo LMS sembrado: /consultorio/cursos/${DEMO_SLUG}`);
}
