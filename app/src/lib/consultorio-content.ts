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
      "Expedientes formales, evidencias, % de presencia y aprovechamiento, dictamen y constancia verificable con QR.",
    status: "operativo",
    href: "/consultorio/expediente",
    features: ["Expediente digital", "Portafolio de evidencias", "Constancia con QR"],
  },
  {
    id: "evaluacion",
    title: "Pruebas psicológicas en línea",
    description:
      "Batería Hartman, PAPI, MABE, Cleaver y LIFO con acceso controlado, informes y trazabilidad para el consultorio.",
    status: "operativo",
    href: "/evaluacion",
    features: ["5 instrumentos", "Acceso por código", "Informe profesional"],
  },
  {
    id: "formacion",
    title: "Cursos en vivo y grabados",
    description:
      "Sala asíncrona, clases en vivo, pizarra, portafolio, evaluaciones diagnóstica/sumaria/final y constancias.",
    status: "operativo",
    href: "/consultorio/cursos",
    features: ["Catálogo completo", "Progreso por lección", "Cupón DEMO100"],
  },
  {
    id: "clases",
    title: "Sala virtual y dinámicas",
    description:
      "Clases con Jitsi, breakouts, pizarra colaborativa, icebreakers, heartbeats de presencia y grabación → VOD.",
    status: "operativo",
    href: "/consultorio/clases-vivo",
    features: ["Salas en vivo", "Pizarra + breakouts", "% de presencia"],
  },
];

/** Dimensiones / instrumentos del PPTX de servicios en línea. */
export const EVALUATION_DIMENSIONS = [
  { label: "Hartman", desc: "Axiología de valores" },
  { label: "PAPI", desc: "Personalidad y estilo de trabajo" },
  { label: "MABE", desc: "Pensamiento y valores" },
  { label: "Cleaver", desc: "Compatibilidad puesto–persona" },
  { label: "LIFO", desc: "Liderazgo y toma de decisiones" },
] as const;

export const VISUAL_STORIES = [
  {
    title: "Cursos en vivo",
    text: "Liderazgo, NOM-035, inteligencia emocional, negociación, ciberseguridad, IA y más — con salas, pizarra y dinámicas.",
    image: "/ige/serv1.png",
    alt: "Grupo en sesión de capacitación profesional",
  },
  {
    title: "Cursos grabados",
    text: "Técnicas de diagnóstico, clima laboral, DNC, marco lógico, TKJ y evaluación de desempeño bajo demanda.",
    image: "/ige/serv2.png",
    alt: "Consultoría y diagnóstico con equipo directivo",
  },
  {
    title: "Certificación CONOCER",
    text: "Atención al ciudadano, comensales, huésped y adicciones — expediente, evidencias y constancia verificable.",
    image: "/ige/serv3.png",
    alt: "Proceso de selección y evaluación de personal",
  },
] as const;

export const BANNER_STRIP = {
  image: "/ige/banner.png",
  alt: "Profesionales en entorno de capacitación y certificación",
  title: "Servicios en línea del consultorio",
  subtitle:
    "Pruebas, cursos en vivo y grabados, certificaciones CONOCER, consultoría, coaching, mediación y terapia — en una sola plataforma.",
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
    title: "Pruebas psicológicas",
    text: "Hartman, PAPI, MABE, Cleaver y LIFO aplicadas en línea con informes para selección y desarrollo.",
    image: "/ige/download.jpg",
  },
  {
    title: "Cursos y certificaciones",
    text: "Catálogo en vivo y grabado, programas CONOCER, % de aprovechamiento/presencia y constancias digitales.",
    image: "/ige/Imagen-1.png",
  },
  {
    title: "Consultoría y coaching",
    text: "Acompañamiento organizacional, mediación, terapia y coaching empresarial para equipos y líderes.",
    image: "/ige/download-1.jpg",
  },
  {
    title: "Sala virtual integrada",
    text: "Una sala para cursos asíncronos, clases en vivo, chat, pizarra, portafolio y seguimiento por correo.",
    image: "/ige/1.png",
  },
] as const;

/** Destacados del catálogo sembrado desde el PPTX de servicios en línea. */
export const CATALOG_HIGHLIGHTS = {
  live: [
    "Liderazgo",
    "Inteligencia Emocional",
    "Comunicación efectiva",
    "Trabajo en equipo",
    "Resolución de conflictos",
    "Negociación",
    "NOM-035",
    "Aspectos legales en RH",
    "Marketing digital",
    "Ciberseguridad",
    "Inteligencia Artificial",
    "Primeros auxilios",
    "Seguridad e higiene",
  ],
  recorded: [
    "Técnicas de diagnóstico",
    "Clima laboral",
    "Evaluación de desempeño",
    "Evaluación de servicio",
    "DNC",
    "Manejo de conflictos",
    "Campo de fuerzas",
    "Método TKJ",
    "Marco lógico",
  ],
  conocer: [
    "Atención al ciudadano",
    "Atención a comensales",
    "Recepción y atención al huésped",
    "Atención en adicciones",
  ],
  tests: ["Hartman", "PAPI", "MABE", "Cleaver", "LIFO"],
} as const;

export const ROADMAP = [
  { month: "Sep 2026", label: "Landing + catálogo completo + evaluación + clases en vivo", done: true },
  { month: "Oct 2026", label: "Expediente CONOCER + constancias + legales", done: true },
  { month: "Nov 2026", label: "Cobro Stripe + price_id por curso en producción", done: false },
  { month: "Dic 2026", label: "Contenido VOD propio y campañas de promoción", done: false },
] as const;

export const NAV_SCROLL = [
  { label: "CONOCER", href: "/#conocer" },
  { label: "Plataforma", href: "/#plataforma" },
  { label: "Experiencias", href: "/#experiencias" },
  { label: "Contacto", href: "/#contacto" },
] as const;

/** Botones siempre visibles en el header */
export const NAV_PRIMARY = [
  { label: "Acceder", href: "/login" },
  { label: "Cursos", href: "/consultorio/cursos" },
] as const;

/** Ítems del desplegable «Plataforma» */
export const NAV_MORE = [
  { label: "En vivo", href: "/consultorio/clases-vivo" },
  { label: "Constancias", href: "/consultorio/constancias" },
  { label: "Expediente", href: "/consultorio/expediente" },
  { label: "Evaluación", href: "/evaluacion" },
] as const;

/** @deprecated Prefer NAV_PRIMARY + NAV_MORE */
export const NAV_ACTIONS = [...NAV_PRIMARY, ...NAV_MORE] as const;

/** @deprecated Prefer NAV_SCROLL + NAV_ACTIONS */
export const NAV_LINKS = [
  ...NAV_SCROLL,
  { label: "Cursos", href: "/consultorio/cursos" },
  { label: "Evaluación", href: "/#evaluacion" },
] as const;

export const HERO_STATS = [
  { value: "5", label: "Pruebas en línea" },
  { value: "CONOCER", label: "Certificación oficial" },
  { value: "24/7", label: "Cursos grabados" },
] as const;
