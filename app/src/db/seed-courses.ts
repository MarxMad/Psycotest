import { eq } from "drizzle-orm";
import type { AppDb } from "./index";
import * as schema from "./schema";

const DEMO_VIDEO =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

const NOW = () => new Date().toISOString();

/** Actualiza textos de catálogo sin nombrar instrumentos (PAPI, Hartman, MABE). */
export async function syncCourseMarketingContent(db: AppDb) {
  const ts = NOW();

  await db
    .update(schema.courseCategories)
    .set({
      description: "Protocolos, interpretación clínica y enfoque por competencias — sin exponer el instrumento al evaluado.",
    })
    .where(eq(schema.courseCategories.id, "cat-eval"));

  const courses = [
    {
      id: "course-intro-eval",
      slug: "introduccion-evaluacion-organizacional",
      title: "Introducción a la evaluación organizacional",
      subtitle: "Diagnóstico, clasificación y primeros criterios",
      description:
        "Aprende a diseñar evaluaciones organizacionales con rigor clínico: clasificación de empresas, escalas de diagnóstico e integración con evaluación en línea y certificación CONOCER.",
      instructorBio: "Psicólogo especializado en psicología organizacional y certificación de competencias.",
      thumbnailUrl: "/ige/banner.png",
      sortOrder: 1,
    },
    {
      id: "course-papi",
      slug: "perfil-conductual-organizacional",
      title: "Perfil conductual en el trabajo",
      subtitle: "Estilo de relación, liderazgo y adaptación al puesto",
      description:
        "Domina la aplicación, calificación e interpretación de perfiles conductuales en selección, desarrollo y certificación — enfocado en lo que la persona hace y cómo se relaciona en el trabajo.",
      instructorBio: "Experiencia en evaluación de personal para sector público e iniciativa privada.",
      thumbnailUrl: "/ige/serv1.png",
      sortOrder: 2,
    },
    {
      id: "course-hartman",
      slug: "valores-motivacion-organizacional",
      title: "Valores y motivación organizacional",
      subtitle: "Alineación persona–cultura–puesto",
      description:
        "Interpreta sistemas de valores, motivación intrínseca y compatibilidad con la cultura organizacional para decisiones de selección, desarrollo y certificación de competencias.",
      instructorBio: "Consultor en diagnóstico de clima, valores y desarrollo humano.",
      thumbnailUrl: "/ige/serv2.png",
      sortOrder: 3,
    },
    {
      id: "course-mabe",
      slug: "ajuste-candidato-puesto",
      title: "Ajuste candidato–puesto de trabajo",
      subtitle: "Brechas entre perfil del puesto y la persona",
      description:
        "Califica el puesto, perfila al candidato y lee brechas de ajuste con criterio clínico — ideal para procesos de selección y certificación por competencias.",
      instructorBio: "Consultor en evaluación de personal y desarrollo organizacional.",
      thumbnailUrl: "/ige/serv3.png",
      sortOrder: 4,
    },
  ] as const;

  for (const c of courses) {
    await db
      .update(schema.courses)
      .set({
        slug: c.slug,
        title: c.title,
        subtitle: c.subtitle,
        description: c.description,
        instructorBio: c.instructorBio,
        thumbnailUrl: c.thumbnailUrl,
        sortOrder: c.sortOrder,
        updatedAt: ts,
      })
      .where(eq(schema.courses.id, c.id));
  }

  const modules = [
    { id: "mod-intro-1", title: "Fundamentos" },
    { id: "mod-intro-2", title: "Aplicación práctica" },
    { id: "mod-papi-1", title: "Perfil conductual" },
    { id: "mod-papi-2", title: "Interpretación clínica" },
    { id: "mod-hartman-1", title: "Sistema de valores" },
    { id: "mod-hartman-2", title: "Motivación y cultura" },
    { id: "mod-mabe-1", title: "Puesto y candidato" },
  ] as const;

  for (const m of modules) {
    await db.update(schema.courseModules).set({ title: m.title }).where(eq(schema.courseModules.id, m.id));
  }

  const lessons = [
    { id: "les-intro-1", title: "Bienvenida al curso", description: "Objetivos, metodología y uso de la plataforma." },
    { id: "les-intro-2", title: "Clasificación de empresas", description: "Sector público vs. privado y tipos de organización." },
    { id: "les-intro-3", title: "Escala Likert organizacional", description: "Diagnóstico de potencial de desarrollo." },
    {
      id: "les-intro-4",
      slug: "evaluacion-en-linea",
      title: "Evaluación en línea integrada",
      description: "Flujo confidencial para evaluados y panel del profesional.",
    },
    {
      id: "les-papi-1",
      slug: "aplicacion-perfil",
      title: "Aplicación del perfil conductual",
      description: "Instrucciones, tiempos y validez del protocolo.",
    },
    {
      id: "les-papi-2",
      slug: "lectura-perfil",
      title: "Lectura de dimensiones conductuales",
      description: "Interpretación clínica del perfil gráfico en contexto laboral.",
    },
    {
      id: "les-mabe-1",
      slug: "brechas-ajuste",
      title: "Brechas de ajuste al puesto",
      description: "Superposición de perfiles y criterio clínico.",
    },
  ] as const;

  for (const l of lessons) {
    const patch: Partial<typeof schema.courseLessons.$inferInsert> = {
      title: l.title,
      description: l.description,
    };
    if ("slug" in l && l.slug) patch.slug = l.slug;
    await db.update(schema.courseLessons).set(patch).where(eq(schema.courseLessons.id, l.id));
  }

  // Curso valores (Hartman) — insertar si no existe
  const [hartmanCourse] = await db
    .select({ id: schema.courses.id })
    .from(schema.courses)
    .where(eq(schema.courses.id, "course-hartman"))
    .limit(1);

  if (!hartmanCourse) {
    await db.insert(schema.courses).values({
      id: "course-hartman",
      slug: "valores-motivacion-organizacional",
      categoryId: "cat-eval",
      title: "Valores y motivación organizacional",
      subtitle: "Alineación persona–cultura–puesto",
      description:
        "Interpreta sistemas de valores, motivación intrínseca y compatibilidad con la cultura organizacional.",
      thumbnailUrl: "/ige/serv2.png",
      instructorName: "Martín Hernández González",
      instructorBio: "Consultor en diagnóstico de clima, valores y desarrollo humano.",
      priceMxn: 6200,
      stripePriceId: process.env.STRIPE_PRICE_COURSE_HARTMAN ?? null,
      level: "intermedio",
      durationMinutes: 210,
      published: true,
      sortOrder: 3,
      createdAt: ts,
      updatedAt: ts,
    });

    await db.insert(schema.courseModules).values([
      { id: "mod-hartman-1", courseId: "course-hartman", title: "Sistema de valores", sortOrder: 1 },
      { id: "mod-hartman-2", courseId: "course-hartman", title: "Motivación y cultura", sortOrder: 2 },
    ]);

    await db.insert(schema.courseLessons).values([
      {
        id: "les-hartman-1",
        moduleId: "mod-hartman-1",
        slug: "mapa-valores",
        title: "Mapa de valores personales",
        description: "Jerarquía de valores y lectura clínica.",
        videoUrl: DEMO_VIDEO,
        durationSeconds: 780,
        sortOrder: 1,
        freePreview: true,
      },
      {
        id: "les-hartman-2",
        moduleId: "mod-hartman-2",
        slug: "motivacion-cultura",
        title: "Motivación y cultura organizacional",
        description: "Compatibilidad persona–organización.",
        videoUrl: DEMO_VIDEO,
        durationSeconds: 840,
        sortOrder: 1,
        freePreview: false,
      },
    ]);
  }

  // Reordenar curso mabe sort
  await db.update(schema.courses).set({ sortOrder: 4, updatedAt: ts }).where(eq(schema.courses.id, "course-mabe"));
}

export async function seedCoursesIfEmpty(db: AppDb) {
  const existing = await db.select({ id: schema.courses.id }).from(schema.courses).limit(1);
  if (existing.length > 0) {
    await syncCourseMarketingContent(db);
    return;
  }

  const now = NOW();

  await db.insert(schema.courseCategories).values([
    {
      id: "cat-eval",
      slug: "evaluacion",
      name: "Evaluación por competencias",
      description: "Protocolos e interpretación clínica sin exponer el instrumento al evaluado.",
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
      description: "Programas para psicólogos, certificadores y equipos de RH.",
      sortOrder: 3,
    },
  ]);

  await db.insert(schema.courses).values([
    {
      id: "course-intro-eval",
      slug: "introduccion-evaluacion-organizacional",
      categoryId: "cat-org",
      title: "Introducción a la evaluación organizacional",
      subtitle: "Diagnóstico, clasificación y primeros criterios",
      description:
        "Aprende a diseñar evaluaciones organizacionales con rigor clínico e integración con certificación CONOCER.",
      thumbnailUrl: "/ige/banner.png",
      instructorName: "Martín Hernández González",
      instructorBio: "Psicólogo especializado en psicología organizacional y certificación de competencias.",
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
      slug: "perfil-conductual-organizacional",
      categoryId: "cat-eval",
      title: "Perfil conductual en el trabajo",
      subtitle: "Estilo de relación, liderazgo y adaptación al puesto",
      description:
        "Aplicación, calificación e interpretación de perfiles conductuales en selección y desarrollo organizacional.",
      thumbnailUrl: "/ige/serv1.png",
      instructorName: "Martín Hernández González",
      instructorBio: "Experiencia en evaluación de personal para sector público e iniciativa privada.",
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
      id: "course-hartman",
      slug: "valores-motivacion-organizacional",
      categoryId: "cat-eval",
      title: "Valores y motivación organizacional",
      subtitle: "Alineación persona–cultura–puesto",
      description:
        "Interpreta valores, motivación y compatibilidad cultural para selección y certificación.",
      thumbnailUrl: "/ige/serv2.png",
      instructorName: "Martín Hernández González",
      instructorBio: "Consultor en diagnóstico de clima, valores y desarrollo humano.",
      priceMxn: 6200,
      stripePriceId: process.env.STRIPE_PRICE_COURSE_HARTMAN ?? null,
      level: "intermedio",
      durationMinutes: 210,
      published: true,
      sortOrder: 3,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "course-mabe",
      slug: "ajuste-candidato-puesto",
      categoryId: "cat-eval",
      title: "Ajuste candidato–puesto de trabajo",
      subtitle: "Brechas entre perfil del puesto y la persona",
      description:
        "Califica el puesto, perfila al candidato y lee brechas de ajuste con criterio clínico.",
      thumbnailUrl: "/ige/serv3.png",
      instructorName: "Martín Hernández González",
      instructorBio: "Consultor en evaluación de personal y desarrollo organizacional.",
      priceMxn: 6900,
      stripePriceId: process.env.STRIPE_PRICE_COURSE_MABE ?? null,
      level: "avanzado",
      durationMinutes: 300,
      published: true,
      sortOrder: 4,
      createdAt: now,
      updatedAt: now,
    },
  ]);

  await db.insert(schema.courseModules).values([
    { id: "mod-intro-1", courseId: "course-intro-eval", title: "Fundamentos", sortOrder: 1 },
    { id: "mod-intro-2", courseId: "course-intro-eval", title: "Aplicación práctica", sortOrder: 2 },
    { id: "mod-papi-1", courseId: "course-papi", title: "Perfil conductual", sortOrder: 1 },
    { id: "mod-papi-2", courseId: "course-papi", title: "Interpretación clínica", sortOrder: 2 },
    { id: "mod-hartman-1", courseId: "course-hartman", title: "Sistema de valores", sortOrder: 1 },
    { id: "mod-hartman-2", courseId: "course-hartman", title: "Motivación y cultura", sortOrder: 2 },
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
      slug: "evaluacion-en-linea",
      title: "Evaluación en línea integrada",
      description: "Flujo confidencial para evaluados y panel del profesional.",
      videoUrl: DEMO_VIDEO,
      durationSeconds: 660,
      sortOrder: 2,
      freePreview: false,
    },
    {
      id: "les-papi-1",
      moduleId: "mod-papi-1",
      slug: "aplicacion-perfil",
      title: "Aplicación del perfil conductual",
      description: "Instrucciones, tiempos y validez del protocolo.",
      videoUrl: DEMO_VIDEO,
      durationSeconds: 840,
      sortOrder: 1,
      freePreview: true,
    },
    {
      id: "les-papi-2",
      moduleId: "mod-papi-2",
      slug: "lectura-perfil",
      title: "Lectura de dimensiones conductuales",
      description: "Interpretación clínica del perfil en contexto laboral.",
      videoUrl: DEMO_VIDEO,
      durationSeconds: 960,
      sortOrder: 1,
      freePreview: false,
    },
    {
      id: "les-hartman-1",
      moduleId: "mod-hartman-1",
      slug: "mapa-valores",
      title: "Mapa de valores personales",
      description: "Jerarquía de valores y lectura clínica.",
      videoUrl: DEMO_VIDEO,
      durationSeconds: 780,
      sortOrder: 1,
      freePreview: true,
    },
    {
      id: "les-hartman-2",
      moduleId: "mod-hartman-2",
      slug: "motivacion-cultura",
      title: "Motivación y cultura organizacional",
      description: "Compatibilidad persona–organización.",
      videoUrl: DEMO_VIDEO,
      durationSeconds: 840,
      sortOrder: 1,
      freePreview: false,
    },
    {
      id: "les-mabe-1",
      moduleId: "mod-mabe-1",
      slug: "brechas-ajuste",
      title: "Brechas de ajuste al puesto",
      description: "Superposición de perfiles y criterio clínico.",
      videoUrl: DEMO_VIDEO,
      durationSeconds: 1020,
      sortOrder: 1,
      freePreview: true,
    },
  ]);

  console.info("[psycotest] Cursos de demostración insertados");
}
