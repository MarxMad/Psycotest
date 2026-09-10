import bcrypt from "bcryptjs";
import { count, eq } from "drizzle-orm";
import type { AppDb } from "./index";
import * as schema from "./schema";
import { buildJitsiRoom } from "@/lib/live-classes";

function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

/** ID estable y único (evita colisiones por truncado en títulos largos). */
function id(prefix: string, key: string) {
  const base = slugify(key).replace(/-/g, "") || "x";
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const hash = (h >>> 0).toString(36);
  return `${prefix}_${base.slice(0, 28)}_${hash}`;
}

type LessonSeed = { title: string; type?: "video" | "reading" | "quiz"; minutes?: number; preview?: boolean };
type ModuleSeed = { title: string; lessons: LessonSeed[] };
type CourseSeed = {
  title: string;
  category: string;
  subtitle: string;
  description: string;
  level: "basico" | "intermedio" | "avanzado";
  priceMxn: number; // centavos
  durationMinutes: number;
  modules: ModuleSeed[];
  live?: boolean;
  conocer?: boolean;
};

const CATEGORIES = [
  {
    id: "cat_pruebas",
    slug: "pruebas-psicologicas",
    name: "Pruebas psicológicas",
    description: "Instrumentos de evaluación: Hartman, PAPI, MABE, Cleaver y LIFO.",
    sortOrder: 1,
  },
  {
    id: "cat_vivo",
    slug: "cursos-en-vivo",
    name: "Cursos en vivo",
    description: "Capacitación sincrónica con salas, pizarra y dinámicas de grupo.",
    sortOrder: 2,
  },
  {
    id: "cat_grabados",
    slug: "cursos-grabados",
    name: "Cursos grabados",
    description: "Sala asíncrona de cursos bajo demanda con portafolio y evaluación.",
    sortOrder: 3,
  },
  {
    id: "cat_conocer",
    slug: "certificaciones-conocer",
    name: "Certificaciones CONOCER",
    description: "Evaluación de competencias y expedientes formales tipo EC.",
    sortOrder: 4,
  },
  {
    id: "cat_servicios",
    slug: "servicios-profesionales",
    name: "Servicios profesionales",
    description: "Consultoría, coaching, mediación, terapia y promoción empresarial.",
    sortOrder: 5,
  },
] as const;

function stdModules(topic: string): ModuleSeed[] {
  return [
    {
      title: "Diagnóstico e integración",
      lessons: [
        { title: `Bienvenida: ${topic}`, type: "reading", minutes: 8, preview: true },
        { title: "Evaluación diagnóstica", type: "reading", minutes: 15 },
        { title: "Expectativas y acuerdos de grupo", type: "reading", minutes: 10 },
      ],
    },
    {
      title: "Desarrollo de competencias",
      lessons: [
        { title: `Marco conceptual de ${topic}`, type: "video", minutes: 25 },
        { title: "Caso práctico aplicado", type: "video", minutes: 20 },
        { title: "Dinámica / portafolio", type: "reading", minutes: 20 },
      ],
    },
    {
      title: "Cierre y evidencia",
      lessons: [
        { title: "Evaluación sumaria", type: "reading", minutes: 15 },
        { title: "Encuesta de satisfacción", type: "reading", minutes: 5 },
        { title: "Evaluación final y constancia", type: "reading", minutes: 10 },
      ],
    },
  ];
}

const LIVE_TITLES = [
  "Liderazgo",
  "Inteligencia Emocional",
  "Comunicación efectiva",
  "Trabajo en equipo",
  "Resolución de conflictos",
  "Habilidades de negociación",
  "NOM-035",
  "Aspectos legales en RH",
  "Marketing digital",
  "Ciberseguridad",
  "Inteligencia Artificial",
  "Primeros auxilios",
  "Seguridad e higiene",
];

const RECORDED_TITLES = [
  "Técnicas de diagnóstico",
  "Clima laboral",
  "Evaluación de desempeño y competencias laborales",
  "Evaluación de servicio",
  "DNC — Detección de necesidades de capacitación",
  "Manejo de conflictos",
  "Campo de fuerzas",
  "Método TKJ",
  "Método del Marco Lógico",
];

const CONOCER_TITLES = [
  "Atención al ciudadano",
  "Atención a comensales",
  "Recepción y atención al huésped",
  "Atención en adicciones",
];

const SERVICE_TITLES = [
  { title: "Consultoría organizacional", subtitle: "Diagnóstico y acompañamiento a equipos" },
  { title: "Coaching empresarial", subtitle: "Sesiones de coach para líderes y colaboradores" },
  { title: "Mediación", subtitle: "Resolución dialogada de conflictos" },
  { title: "Terapia", subtitle: "Acompañamiento clínico profesional" },
];

function buildCourseCatalog(): CourseSeed[] {
  const courses: CourseSeed[] = [];

  courses.push({
    title: "Batería de pruebas psicológicas en línea",
    category: "cat_pruebas",
    subtitle: "Hartman · PAPI · MABE · Cleaver · LIFO",
    description:
      "Acceso a las 5 pruebas psicológicas del consultorio: axiología de valores (Hartman), personalidad (PAPI), pensamiento y valores (MABE), compatibilidad puesto-persona (Cleaver) y liderazgo/toma de decisiones (LIFO).",
    level: "intermedio",
    priceMxn: 0,
    durationMinutes: 180,
    modules: [
      {
        title: "Introducción a la batería",
        lessons: [
          { title: "Cómo aplicar las pruebas", type: "reading", minutes: 12, preview: true },
          { title: "Interpretación ética de resultados", type: "reading", minutes: 15 },
        ],
      },
      {
        title: "Instrumentos",
        lessons: [
          { title: "Hartman — Axiología de valores", type: "reading", minutes: 20 },
          { title: "PAPI — Personalidad", type: "reading", minutes: 20 },
          { title: "MABE — Pensamiento y valores", type: "reading", minutes: 20 },
          { title: "Cleaver — Compatibilidad puesto-persona", type: "reading", minutes: 20 },
          { title: "LIFO — Liderazgo y decisiones", type: "reading", minutes: 20 },
        ],
      },
    ],
  });

  for (const title of LIVE_TITLES) {
    courses.push({
      title,
      category: "cat_vivo",
      subtitle: "Curso en vivo · salas, pizarra y dinámicas",
      description: `Capacitación en vivo de ${title}. Incluye división de salas, pizarra colaborativa, portafolio, evaluación diagnóstica/sumaria/final, encuesta de satisfacción, % de aprovechamiento y presencia, e interacción total con constancia.`,
      level: "basico",
      priceMxn: title === "Liderazgo" || title === "NOM-035" ? 0 : 149900,
      durationMinutes: 480,
      modules: stdModules(title),
      live: true,
      conocer: title === "NOM-035" || title === "Liderazgo",
    });
  }

  for (const title of RECORDED_TITLES) {
    courses.push({
      title,
      category: "cat_grabados",
      subtitle: "Curso grabado · sala asíncrona",
      description: `Curso grabado de ${title} con permanencia VOD, portafolio de evidencias, evaluación y constancia digital.`,
      level: "intermedio",
      priceMxn: title.startsWith("DNC") || title === "Clima laboral" ? 0 : 99900,
      durationMinutes: 360,
      modules: stdModules(title),
      conocer: title.includes("competencias"),
    });
  }

  for (const title of CONOCER_TITLES) {
    courses.push({
      title: `Evaluación CONOCER — ${title}`,
      category: "cat_conocer",
      subtitle: "Expediente formal · evidencias · dictamen",
      description: `Ruta de evaluación de competencias CONOCER en ${title}: diagnóstico, evidencias de portafolio, presencia, aprovechamiento y constancia verificable.`,
      level: "avanzado",
      priceMxn: title === "Atención al ciudadano" ? 0 : 249900,
      durationMinutes: 600,
      modules: stdModules(title),
      conocer: true,
    });
  }

  for (const s of SERVICE_TITLES) {
    courses.push({
      title: s.title,
      category: "cat_servicios",
      subtitle: s.subtitle,
      description: `${s.title}: servicio profesional del consultorio. Agenda, seguimiento y evidencia de sesión.`,
      level: "basico",
      priceMxn: 0,
      durationMinutes: 120,
      modules: [
        {
          title: "Servicio",
          lessons: [
            { title: "Descripción del servicio", type: "reading", minutes: 10, preview: true },
            { title: "Cómo agendar", type: "reading", minutes: 8 },
            { title: "Acuerdos y confidencialidad", type: "reading", minutes: 10 },
          ],
        },
      ],
    });
  }

  return courses;
}

export async function seedPlatformCatalog(db: AppDb): Promise<void> {
  const [existing] = await db.select({ n: count() }).from(schema.courses);
  if ((existing?.n ?? 0) > 0) {
    console.info("[sistemapsic] Catálogo ya existe — seed omitido");
    return;
  }

  const now = new Date().toISOString();
  console.info("[sistemapsic] Sembrando catálogo desde servicios en línea…");

  // Demo student (usa rol psicologo como alumno LMS)
  const alumnoEmail = "alumno@sistemapsic.local";
  let alumnoId = "user-alumno-demo";
  const [alumnoExists] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, alumnoEmail))
    .limit(1);
  if (!alumnoExists) {
    await db.insert(schema.users).values({
      id: alumnoId,
      email: alumnoEmail,
      nombre: "Alumno Demo",
      passwordHash: await bcrypt.hash("alumno2026", 10),
      rol: "psicologo",
      emailVerified: true,
      createdAt: now,
    });
  } else {
    alumnoId = alumnoExists.id;
  }

  for (const cat of CATEGORIES) {
    await db
      .insert(schema.courseCategories)
      .values({
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        description: cat.description,
        sortOrder: cat.sortOrder,
      })
      .onConflictDoNothing();
  }

  const catalog = buildCourseCatalog();
  let sort = 0;
  const createdCourseIds: Array<{ id: string; title: string; live?: boolean; conocer?: boolean }> =
    [];

  for (const course of catalog) {
    sort += 1;
    const courseId = id("course", course.title);
    const courseSlug = slugify(course.title);

    await db
      .insert(schema.courses)
      .values({
        id: courseId,
        title: course.title,
        slug: courseSlug,
        description: course.description,
        subtitle: course.subtitle,
        categoryId: course.category,
        priceMxn: course.priceMxn,
        instructorName: "Martín Hernández",
        instructorBio: "Centro certificador CONOCER · Psicología organizacional",
        level: course.level,
        durationMinutes: course.durationMinutes,
        published: true,
        status: "published",
        sortOrder: sort,
        requireQuizPass: false,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing();

    createdCourseIds.push({
      id: courseId,
      title: course.title,
      live: course.live,
      conocer: course.conocer,
    });

    let mOrder = 0;
    for (const mod of course.modules) {
      mOrder += 1;
      const moduleId = id("mod", `${courseSlug}-${mOrder}`);
      await db
        .insert(schema.courseModules)
        .values({
          id: moduleId,
          courseId,
          title: mod.title,
          sortOrder: mOrder,
        })
        .onConflictDoNothing();

      let lOrder = 0;
      for (const lesson of mod.lessons) {
        lOrder += 1;
        const lessonId = id("les", `${courseSlug}-m${mOrder}-l${lOrder}`);
        const minutes = lesson.minutes ?? 15;
        await db
          .insert(schema.courseLessons)
          .values({
            id: lessonId,
            moduleId,
            slug: slugify(lesson.title) || `leccion-${lOrder}`,
            title: lesson.title,
            description: lesson.title,
            type: lesson.type ?? "reading",
            contentMarkdown: `## ${lesson.title}\n\nContenido de formación del consultorio.\n\n- Objetivo de la sesión\n- Actividad / evidencia\n- Criterios de aprovechamiento\n`,
            durationSeconds: minutes * 60,
            sortOrder: lOrder,
            freePreview: Boolean(lesson.preview),
          })
          .onConflictDoNothing();
      }
    }

    if (course.conocer) {
      const programId = id("prog", courseSlug);
      await db
        .insert(schema.certificationPrograms)
        .values({
          id: programId,
          courseId,
          code: `EC-${slugify(course.title).slice(0, 12).toUpperCase()}`,
          title: `Programa CONOCER — ${course.title}`,
          version: "1.0",
          description: course.description,
          minPresencePercent: 80,
          minAprovechamientoPercent: 70,
          active: true,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing();
    }
  }

  // Clases en vivo próximas (muestra)
  const liveSamples = createdCourseIds.filter((c) => c.live).slice(0, 5);
  let i = 0;
  for (const sample of liveSamples) {
    i += 1;
    const liveId = id("live", `${sample.title}-${i}`);
    const { roomUrl } = buildJitsiRoom(liveId);
    const when = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
    when.setHours(10, 0, 0, 0);
    await db
      .insert(schema.liveClasses)
      .values({
        id: liveId,
        courseId: sample.id,
        title: `Sesión en vivo — ${sample.title}`,
        scheduledAt: when.toISOString(),
        durationMinutes: 90,
        provider: "jitsi",
        roomUrl,
        dailyRoomUrl: roomUrl,
        status: "scheduled",
        createdAt: now,
      })
      .onConflictDoNothing();
  }

  // Cupones
  await db
    .insert(schema.coupons)
    .values({
      id: "coupon_demo100",
      code: "DEMO100",
      type: "percentage",
      value: 100,
      maxUses: 1000,
      currentUses: 0,
      expiresAt: null,
      active: true,
      grantOnCourseComplete: false,
      sourceEnrollmentId: null,
      createdAt: now,
    })
    .onConflictDoNothing();

  await db
    .insert(schema.coupons)
    .values({
      id: "coupon_bienvenida20",
      code: "BIENVENIDA20",
      type: "percentage",
      value: 20,
      maxUses: 500,
      currentUses: 0,
      expiresAt: null,
      active: true,
      grantOnCourseComplete: false,
      sourceEnrollmentId: null,
      createdAt: now,
    })
    .onConflictDoNothing();

  // Documentos legales base
  const legales = [
    {
      id: "legal_aviso",
      type: "aviso_privacidad" as const,
      title: "Aviso de privacidad",
      body: "## Aviso de privacidad\n\nLos datos personales se tratan conforme a la LFPDPPP para formación, evaluación y emisión de constancias.",
    },
    {
      id: "legal_terminos",
      type: "terminos" as const,
      title: "Términos de uso",
      body: "## Términos\n\nEl acceso a cursos y evaluaciones está sujeto a inscripción activa y al reglamento interno del consultorio.",
    },
    {
      id: "legal_finiquito",
      type: "finiquito" as const,
      title: "Finiquito de participación",
      body: "## Finiquito\n\nAl concluir el programa, el participante declara haber recibido la formación y evidencias correspondientes.",
    },
  ];
  for (const doc of legales) {
    await db
      .insert(schema.legalDocuments)
      .values({
        id: doc.id,
        type: doc.type,
        title: doc.title,
        bodyMarkdown: doc.body,
        version: "1.0",
        active: true,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing();
  }

  // Inscribir alumno demo a cursos gratuitos
  const freeCourses = catalog.filter((c) => c.priceMxn === 0);
  for (const course of freeCourses.slice(0, 6)) {
    const courseId = id("course", course.title);
    const enrollId = id("enroll", `demo-${course.title}`);
    await db
      .insert(schema.courseEnrollments)
      .values({
        id: enrollId,
        userId: alumnoId,
        courseId,
        status: "active",
        progressPercent: 0,
        enrolledAt: now,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing();
  }

  console.info(
    `[sistemapsic] Catálogo listo: ${catalog.length} cursos, ${liveSamples.length} clases en vivo, cupón DEMO100`,
  );
}
