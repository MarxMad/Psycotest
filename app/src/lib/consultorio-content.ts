export type PlatformModule = {
  id: string;
  title: string;
  description: string;
  status: "operativo" | "construccion" | "proximo";
  href: string;
  features: string[];
};

export const PLATFORM_MODULES: PlatformModule[] = [
  {
    id: "certificacion",
    title: "Certificación CONOCER",
    description:
      "Gestión de estándares de competencia, evaluación, expedientes y constancias con trazabilidad alineada al Sistema Nacional de Competencias.",
    status: "construccion",
    href: "#conocer",
    features: ["Estándares por sector", "Expediente digital", "Constancia SEP"],
  },
  {
    id: "evaluacion",
    title: "Evaluación en línea",
    description:
      "Baterías psicométricas aplicadas con códigos de acceso, calificación automática e informes PDF — sin revelar instrumentos al evaluado.",
    status: "operativo",
    href: "/psycotest",
    features: ["Acceso por código", "Panel del evaluador", "Informe trazable"],
  },
  {
    id: "formacion",
    title: "Formación y cursos",
    description: "Catálogo estilo Platzi, progreso por lección, landings de venta e inscripción con Stripe México.",
    status: "construccion",
    href: "/consultorio/cursos",
    features: ["Video bajo demanda", "Seguimiento de avance", "Cobro en línea"],
  },
  {
    id: "clases",
    title: "Clases en vivo",
    description: "Salas integradas con cámara, chat y pizarra — sin depender de Meet ni Zoom.",
    status: "proximo",
    href: "#roadmap",
    features: ["Hasta ~30 participantes", "Grabación → replay", "Calendario por curso"],
  },
];

/** Dimensiones evaluadas — enfoque comercial sin nombrar instrumentos. */
export const EVALUATION_DIMENSIONS = [
  { label: "Perfil conductual", desc: "Estilo de trabajo y relación interpersonal" },
  { label: "Valores y motivación", desc: "Alineación con la cultura organizacional" },
  { label: "Aptitudes cognitivas", desc: "Razonamiento y toma de decisiones" },
  { label: "Competencias laborales", desc: "Habilidades aplicadas al puesto" },
] as const;

export const VISUAL_STORIES = [
  {
    title: "Capacitación que transforma",
    text: "Programas presenciales y en línea para equipos del sector público y privado, con ruta clara hacia la certificación.",
    image: "/ige/serv1.png",
    alt: "Grupo en sesión de capacitación profesional",
  },
  {
    title: "Diagnóstico organizacional",
    text: "Identificamos áreas de oportunidad en desarrollo humano antes de evaluar y certificar competencias.",
    image: "/ige/serv2.png",
    alt: "Consultoría y diagnóstico con equipo directivo",
  },
  {
    title: "Selección con criterio",
    text: "Vinculamos candidatos y organizaciones con evaluación confidencial y resultados interpretados por especialistas.",
    image: "/ige/serv3.png",
    alt: "Proceso de selección y evaluación de personal",
  },
] as const;

export const BANNER_STRIP = {
  image: "/ige/banner.png",
  alt: "Profesionales en entorno de capacitación y certificación",
  title: "Competencias que el mercado reconoce",
  subtitle:
    "Desde la formación hasta la constancia oficial: un recorrido digital pensado para certificadores, empresas y personas que buscan superación.",
} as const;

/** Beneficios para personas certificadas — alineado al marco CONOCER / SEP. */
export const CONOCER_PERSON_BENEFITS = [
  { title: "Reconocimiento oficial", text: "Constancia con validez en el marco del Sistema Nacional de Competencias y la SEP." },
  { title: "Mejor empleo y salario", text: "Competencias documentadas que abren puertas en el mercado laboral." },
  { title: "Movilidad laboral", text: "Evidencia portable de lo que sabes hacer, más allá de un título." },
  { title: "Superación personal", text: "Ruta clara de capacitación → evaluación → certificación." },
] as const;

/** Beneficios para organizaciones que certifican a su personal. */
export const CONOCER_ORG_BENEFITS = [
  "Ventaja competitiva con personal competente y certificado",
  "Eficacia y eficiencia en procesos productivos",
  "Reducción de riesgos en operación y servicios",
  "Mejora continua de productos, procesos y servicios",
] as const;

export const SERVICES = [
  {
    title: "Certificación de competencias",
    text: "Evaluación y certificación CONOCER para trabajadores, docentes y equipos organizacionales bajo estándares sectoriales.",
    image: "/ige/download.jpg",
  },
  {
    title: "Diagnóstico organizacional",
    text: "Clasificación de empresas, escalas Likert y técnicas para identificar áreas de oportunidad en desarrollo humano.",
    image: "/ige/Imagen-1.png",
  },
  {
    title: "Selección de personal",
    text: "Vinculación organización–candidato con evaluación confidencial integrada al flujo de selección.",
    image: "/ige/download-1.jpg",
  },
  {
    title: "Capacitación y consultoría",
    text: "Cursos en línea, talleres, diplomados y coaching empresarial para sector público e iniciativa privada.",
    image: "/ige/1.png",
  },
] as const;

export const ROADMAP = [
  { month: "Sep 2026", label: "Landing profesional + catálogo de cursos + evaluación en línea", done: true },
  { month: "Oct 2026", label: "Expediente digital CONOCER + clases en vivo", done: false },
  { month: "Nov 2026", label: "Cobro Stripe + inscripción automática a certificación", done: false },
  { month: "Dic 2026", label: "Plataforma certificadora 100% operativa", done: false },
] as const;

export const NAV_LINKS = [
  { label: "CONOCER", href: "#conocer" },
  { label: "Plataforma", href: "#plataforma" },
  { label: "Experiencias", href: "#experiencias" },
  { label: "Cursos", href: "/consultorio/cursos" },
  { label: "Evaluación", href: "#evaluacion" },
  { label: "Contacto", href: "#contacto" },
] as const;

export const HERO_STATS = [
  { value: "CONOCER", label: "Certificación oficial SEP" },
  { value: "4", label: "Dimensiones evaluadas" },
  { value: "24/7", label: "Formación en línea" },
] as const;
