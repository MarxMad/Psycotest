import { IGE } from "./ige-brand";

const base = IGE.siteUrl;

export type IgeNavItem = {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
};

export const IGE_NAV: IgeNavItem[] = [
  {
    label: "Diagnósticos",
    href: `${base}/clasificacion`,
    children: [
      { label: "Clasificación por sector público o privado", href: `${base}/clasificacion` },
      { label: "Otras técnicas", href: `${base}/tecnicas` },
    ],
  },
  {
    label: "Selección de Personal",
    href: `${base}/vinculacion-organizacion`,
    children: [
      { label: "Organización", href: `${base}/vinculacion-organizacion` },
      { label: "Candidato", href: `${base}/vinculacion-postulante` },
    ],
  },
  {
    label: "Capacitación",
    href: "#capacitacion",
    children: [
      { label: "Cursos privados", href: `${base}/cursos-o-talleres` },
      { label: "Cursos públicos", href: `${base}/cursos-publicos` },
      { label: "Diplomados", href: `${base}/diplomados` },
      { label: "Conferencias", href: `${base}/conferencias` },
    ],
  },
  {
    label: "Consultoría",
    href: "#consultoria",
    children: [
      { label: "Coaching empresarial", href: `${base}/coaching-empresarial` },
      { label: "Coaching personal", href: `${base}/coaching-personal` },
      { label: "Atención clínica", href: `${base}/atencion-clinica` },
    ],
  },
  {
    label: "Productos",
    href: "#productos",
    children: [
      { label: "Cursos en línea", href: `${base}/e-learning` },
      { label: "Certificación", href: `${base}/certificacion` },
      { label: "SIEPO", href: `${base}/siepo` },
      { label: "Libros", href: `${base}/libros` },
      { label: "Salas de capacitación", href: `${base}/nuestras-salas` },
    ],
  },
  { label: "Contacto", href: "#contacto" },
];

export const IGE_PILLARS = [
  {
    title: "Psicología del Trabajo",
    text: "Somos especialistas en psicología del trabajo, implementamos métodos de evaluación, desarrollo humano y organizacional para impulsar la efectividad de los entes públicos, la rentabilidad de la iniciativa privada desde micro, pequeña, mediana y gran empresa.",
  },
  {
    title: "Psicología del Turismo",
    text: "Los actores individuales y sociales del turismo sustentan la riqueza sociocultural histórica y natural del país, motivo por el cual, dotamos de habilidades duras y blandas a través de programas de capacitación y metodología para enriquecer su quehacer en las organizaciones públicas y privadas.",
  },
  {
    title: "Derecho Laboral",
    text: "Dar certeza a la empresa familiar o a los diferentes tipos de sociedades es el principal objetivo ya que el cumplimento legal en todas las operaciones de la organización garantiza su permanencia, asegura su capital y/o patrimonio.",
  },
] as const;

export const IGE_COACHING = [
  {
    title: "Coaching empresarial",
    text: "Crea una atmósfera de logro a través de un acompañamiento sutil que propicie el resultado que esperas.",
    cta: "Conoce más",
    href: `${base}/coaching-empresarial`,
  },
  {
    title: "Coaching personal",
    text: "Descubre tu potencial de desarrollo y trasciende las limitaciones con un grupo de especialistas que generen sinergia contigo.",
    cta: "Ver más",
    href: `${base}/coaching-personal`,
  },
  {
    title: "Atención clínica",
    text: "Logra el máximo desempeño de tus colaboradores.",
    cta: "Ver más",
    href: `${base}/atencion-clinica`,
  },
] as const;

export const IGE_CAPACITACION = [
  {
    title: "Taller o curso privado",
    text: "Reciba el agradecimiento de sus colaboradores al mantener actualizados sus conocimientos.",
  },
  {
    title: "Diplomado",
    text: "Otorgue competencias que repercutan en su organización.",
  },
  {
    title: "Cursos públicos",
    text: "Aprovecha al máximo el talento de tus colaboradores.",
  },
  {
    title: "Conferencias",
    text: "Propicie la reflexión en sus colaboradores a través de una convivencia grupal en sus instalaciones.",
  },
] as const;

export const IGE_FOOTER_ABOUT =
  "Somos especialistas en psicología organizacional, implementamos métodos de evaluación, desarrollo humano y organizacional para impulsar la efectividad de los entes públicos, la rentabilidad de la iniciativa privada sea; micro, pequeña, mediana y gran empresa.";
