import type { AppDb } from "./index";
import * as schema from "./schema";

const DEMO_VIDEO =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

export async function seedCoursesIfEmpty(db: AppDb) {
  const existing = await db.select({ id: schema.courses.id }).from(schema.courses).limit(1);
  if (existing.length > 0) return;

  const now = new Date().toISOString();

  await db.insert(schema.courseCategories).values([
    {
      id: "cat-eval",
      slug: "evaluacion",
      name: "Evaluación psicométrica",
      description: "Instrumentos, protocolos e interpretación clínica.",
      sortOrder: 1,
    },
    {
      id: "cat-org",
      slug: "organizacional",
      name: "Psicología organizacional",
      description: "Diagnóstico, desarrollo humano y consultoría.",
      sortOrder: 2,
    },
    {
      id: "cat-formacion",
      slug: "formacion",
      name: "Formación profesional",
      description: "Programas para psicólogos y equipos de RH.",
      sortOrder: 3,
    },
  ]);

  await db.insert(schema.courses).values([
    {
      id: "course-intro-eval",
      slug: "introduccion-evaluacion-organizacional",
      categoryId: "cat-org",
      title: "Introducción a la evaluación organizacional",
      subtitle: "Diagnóstico, clasificación y primeros instrumentos",
      description:
        "Aprende a diseñar y aplicar evaluaciones organizacionales con criterio clínico: desde la clasificación de empresas hasta la lectura de resultados con PAPI, Hartman y MABE.",
      thumbnailUrl: null,
      instructorName: "Martín Hernández González",
      instructorBio: "Psicólogo especializado en psicología organizacional y evaluación psicométrica.",
      priceMxn: 4500,
      stripePriceId: process.env.STRIPE_PRICE_COURSE_INTRO ?? null,
      level: "basico",
      durationMinutes: 180,
      published: true,
      sortOrder: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "course-papi",
      slug: "papi-practica-clinica",
      categoryId: "cat-eval",
      title: "PAPI en la práctica clínica",
      subtitle: "Perfil de personalidad aplicado al trabajo",
      description:
        "Domina la aplicación, calificación e interpretación del PAPI en contextos de selección y desarrollo organizacional.",
      thumbnailUrl: null,
      instructorName: "Martín Hernández González",
      instructorBio: "Experiencia en aplicación PAPI para sector público e iniciativa privada.",
      priceMxn: 5900,
      stripePriceId: process.env.STRIPE_PRICE_COURSE_PAPI ?? null,
      level: "intermedio",
      durationMinutes: 240,
      published: true,
      sortOrder: 2,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "course-mabe",
      slug: "mabe-seleccion-puestos",
      categoryId: "cat-eval",
      title: "MABE y selección por puestos",
      subtitle: "Comparación candidato vs. puesto",
      description:
        "Curso avanzado sobre MABE: calificación del puesto, perfil del candidato y lectura de brechas.",
      thumbnailUrl: null,
      instructorName: "Martín Hernández González",
      instructorBio: "Consultor en evaluación de personal y desarrollo organizacional.",
      priceMxn: 6900,
      stripePriceId: process.env.STRIPE_PRICE_COURSE_MABE ?? null,
      level: "avanzado",
      durationMinutes: 300,
      published: true,
      sortOrder: 3,
      createdAt: now,
      updatedAt: now,
    },
  ]);

  await db.insert(schema.courseModules).values([
    { id: "mod-intro-1", courseId: "course-intro-eval", title: "Fundamentos", sortOrder: 1 },
    { id: "mod-intro-2", courseId: "course-intro-eval", title: "Aplicación práctica", sortOrder: 2 },
    { id: "mod-papi-1", courseId: "course-papi", title: "Protocolo PAPI", sortOrder: 1 },
    { id: "mod-papi-2", courseId: "course-papi", title: "Interpretación", sortOrder: 2 },
    { id: "mod-mabe-1", courseId: "course-mabe", title: "Puesto y candidato", sortOrder: 1 },
  ]);

  await db.insert(schema.courseLessons).values([
    {
      id: "les-intro-1",
      moduleId: "mod-intro-1",
      slug: "bienvenida",
      title: "Bienvenida al curso",
      description: "Objetivos, metodología y cómo usar la plataforma.",
      videoUrl: DEMO_VIDEO,
      durationSeconds: 420,
      sortOrder: 1,
      freePreview: true,
    },
    {
      id: "les-intro-2",
      moduleId: "mod-intro-1",
      slug: "clasificacion-empresas",
      title: "Clasificación de empresas",
      description: "Sector público vs. iniciativa privada y tipos de organización.",
      videoUrl: DEMO_VIDEO,
      durationSeconds: 900,
      sortOrder: 2,
      freePreview: false,
    },
    {
      id: "les-intro-3",
      moduleId: "mod-intro-2",
      slug: "escala-likert",
      title: "Escala Likert organizacional",
      description: "Diagnóstico de potencial de desarrollo.",
      videoUrl: DEMO_VIDEO,
      durationSeconds: 780,
      sortOrder: 1,
      freePreview: false,
    },
    {
      id: "les-intro-4",
      moduleId: "mod-intro-2",
      slug: "integracion-psycotest",
      title: "Integración con PsycoTest",
      description: "Flujo de evaluación en línea y panel del psicólogo.",
      videoUrl: DEMO_VIDEO,
      durationSeconds: 660,
      sortOrder: 2,
      freePreview: false,
    },
    {
      id: "les-papi-1",
      moduleId: "mod-papi-1",
      slug: "aplicacion-papi",
      title: "Aplicación del PAPI",
      description: "Instrucciones, tiempos y validez del protocolo.",
      videoUrl: DEMO_VIDEO,
      durationSeconds: 840,
      sortOrder: 1,
      freePreview: true,
    },
    {
      id: "les-papi-2",
      moduleId: "mod-papi-2",
      slug: "perfil-20-factores",
      title: "Perfil de 20 factores",
      description: "Lectura clínica del perfil gráfico.",
      videoUrl: DEMO_VIDEO,
      durationSeconds: 960,
      sortOrder: 1,
      freePreview: false,
    },
    {
      id: "les-mabe-1",
      moduleId: "mod-mabe-1",
      slug: "brechas-mabe",
      title: "Brechas candidato–puesto",
      description: "Superposición de curvas y criterio clínico.",
      videoUrl: DEMO_VIDEO,
      durationSeconds: 1020,
      sortOrder: 1,
      freePreview: true,
    },
  ]);

  console.info("[psycotest] Cursos de demostración insertados");
}
