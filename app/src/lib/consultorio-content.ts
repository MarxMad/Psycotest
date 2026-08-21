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
    title: "Evaluación psicométrica",
    description: "PAPI, Hartman y MABE en línea con calificación automática, gráficas e informes PDF firmables.",
    status: "operativo",
    href: "/psycotest",
    features: ["Códigos para aplicantes", "Panel clínico", "Informe PDF trazable"],
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
  },
  {
    title: "Diagnóstico organizacional",
    text: "Clasificación de empresas, escalas Likert y técnicas para identificar áreas de oportunidad en desarrollo humano.",
  },
  {
    title: "Selección de personal",
    text: "Vinculación organización–candidato con batería psicométrica integrada al flujo de selección.",
  },
  {
    title: "Capacitación y consultoría",
    text: "Cursos en línea, talleres, diplomados y coaching empresarial para sector público e iniciativa privada.",
  },
] as const;

export const ROADMAP = [
  { month: "Sep 2026", label: "Landing profesional + catálogo de cursos + PsycoTest operativo", done: true },
  { month: "Oct 2026", label: "Expediente digital CONOCER + clases en vivo", done: false },
  { month: "Nov 2026", label: "Cobro Stripe + inscripción automática a certificación", done: false },
  { month: "Dic 2026", label: "Plataforma certificadora 100% operativa", done: false },
] as const;

export const NAV_LINKS = [
  { label: "CONOCER", href: "#conocer" },
  { label: "Plataforma", href: "#plataforma" },
  { label: "Cursos", href: "/consultorio/cursos" },
  { label: "PsycoTest", href: "/psycotest" },
  { label: "Contacto", href: "#contacto" },
] as const;

export const HERO_STATS = [
  { value: "CONOCER", label: "Certificación oficial SEP" },
  { value: "100%", label: "Plataforma integrada" },
  { value: "24/7", label: "Formación en línea" },
] as const;
