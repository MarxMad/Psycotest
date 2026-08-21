export type ConsultorioCourse = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  priceLabel: string;
  duration: string;
  modality: string;
  instructor: string;
  instructorBio: string;
  benefits: string[];
  syllabus: { title: string; items: string[] }[];
  ctaLabel: string;
  featured: boolean;
};

export const CONSULTORIO_COURSES: ConsultorioCourse[] = [
  {
    slug: "primer-curso",
    title: "Primer programa de formación",
    subtitle: "Psicología organizacional aplicada",
    description:
      "Programa en línea para profesionales que quieren profundizar en evaluación, desarrollo humano y consultoría con metodología rigurosa y casos reales.",
    priceLabel: "Precio por confirmar",
    duration: "Por definir",
    modality: "En línea + sesiones en vivo",
    instructor: "Martín Hernández González",
    instructorBio:
      "Psicólogo especializado en psicología organizacional. Evaluación, capacitación y consultoría para sector público e iniciativa privada.",
    benefits: [
      "Acceso a material y replays en la plataforma",
      "Metodología aplicada a la práctica profesional",
      "Certificado de participación",
      "Integración con herramientas de evaluación del consultorio",
    ],
    syllabus: [
      {
        title: "Módulo 1 — Marco y diagnóstico",
        items: ["Fundamentos de psicología organizacional", "Diagnóstico y clasificación", "Instrumentos de evaluación"],
      },
      {
        title: "Módulo 2 — Intervención",
        items: ["Diseño de intervenciones", "Talleres prácticos", "Seguimiento y retroalimentación"],
      },
    ],
    ctaLabel: "Solicitar información",
    featured: true,
  },
];

export function getCourse(slug: string): ConsultorioCourse | undefined {
  return CONSULTORIO_COURSES.find((c) => c.slug === slug);
}
