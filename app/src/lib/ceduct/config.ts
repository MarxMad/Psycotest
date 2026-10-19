/**
 * Configuración del marketplace de CEDUCT: impuestos, categorías y textos
 * de la portada. Todo lo que el equipo comercial querría cambiar sin tocar
 * componentes vive aquí.
 */

/* ------------------------------------------------------------------ */
/* Impuestos                                                           */
/* ------------------------------------------------------------------ */

function numeroEnv(valor: string | undefined, porDefecto: number): number {
  const n = Number(valor);
  return Number.isFinite(n) && n >= 0 && n < 1 ? n : porDefecto;
}

/**
 * IVA. Por ley (LFPC) el precio que ve el consumidor en México debe incluir
 * impuestos, así que por defecto los precios del catálogo ya lo traen y el
 * carrito sólo lo desglosa. Si algún día se publican precios sin IVA, basta
 * con `NEXT_PUBLIC_CEDUCT_IVA_INCLUIDO=0` y el carrito lo suma encima.
 *
 * Ojo: el cobro real lo calcula /api/pedidos con los precios de la base; con
 * IVA «encima» hay que ajustar también ese cálculo.
 */
export const IMPUESTOS = {
  tasa: numeroEnv(process.env.NEXT_PUBLIC_CEDUCT_IVA, 0.16),
  incluidoEnPrecio: process.env.NEXT_PUBLIC_CEDUCT_IVA_INCLUIDO !== "0",
  etiqueta: "IVA",
} as const;

/* ------------------------------------------------------------------ */
/* Categorías                                                          */
/* ------------------------------------------------------------------ */

export type IconoCategoria = "megafono" | "chip" | "maletin" | "pulso" | "birrete" | "personas";

export type Categoria = {
  slug: string;
  nombre: string;
  resumen: string;
  icono: IconoCategoria;
  /** Tono de la portada generada; siempre sobre el azul de fondo. */
  tono: string;
};

export const CATEGORIAS: Categoria[] = [
  {
    slug: "marketing-digital",
    nombre: "Marketing Digital",
    resumen: "Estrategia, contenido, pauta y analítica.",
    icono: "megafono",
    tono: "#F97316",
  },
  {
    slug: "tecnologia",
    nombre: "Tecnología",
    resumen: "Datos, desarrollo, nube y ciberseguridad.",
    icono: "chip",
    tono: "#38BDF8",
  },
  {
    slug: "negocios",
    nombre: "Negocios",
    resumen: "Dirección, finanzas, ventas y proyectos.",
    icono: "maletin",
    tono: "#FACC15",
  },
  {
    slug: "salud",
    nombre: "Salud",
    resumen: "Atención, seguridad y bienestar laboral.",
    icono: "pulso",
    tono: "#34D399",
  },
  {
    slug: "educacion",
    nombre: "Educación",
    resumen: "Diseño instruccional, docencia y evaluación.",
    icono: "birrete",
    tono: "#A78BFA",
  },
  {
    slug: "recursos-humanos",
    nombre: "Recursos Humanos",
    resumen: "Selección, capacitación y clima laboral.",
    icono: "personas",
    tono: "#F472B6",
  },
];

export function categoriaPorSlug(slug: string): Categoria {
  return CATEGORIAS.find((c) => c.slug === slug) ?? CATEGORIAS[2];
}

/**
 * Las categorías de la base tienen nombres libres («Capacitación», «RH»…).
 * Se acomodan en las del marketplace por palabras clave; lo que no encaja
 * cae en Negocios.
 */
export function categoriaDesdeTexto(texto: string | null | undefined): string {
  const t = (texto ?? "").toLowerCase();
  if (!t) return "negocios";
  const exacta = CATEGORIAS.find((c) => c.slug === t || c.nombre.toLowerCase() === t);
  if (exacta) return exacta.slug;
  if (/(market|digital|redes|publicidad|ventas en l)/.test(t)) return "marketing-digital";
  if (/(tecno|datos|program|software|ciber|nube|ti\b|inform)/.test(t)) return "tecnologia";
  if (/(salud|enferm|clínic|clinic|seguridad e hig|primeros)/.test(t)) return "salud";
  if (/(educa|docen|instruc|capacita|formaci|ec0217|enseñ)/.test(t)) return "educacion";
  if (/(recursos humanos|\brh\b|personal|selecci|talento|psico)/.test(t)) return "recursos-humanos";
  return "negocios";
}

/* ------------------------------------------------------------------ */
/* Contenido de la portada                                             */
/* ------------------------------------------------------------------ */

export const PROPUESTA = {
  titular: "Certifica lo que ya sabes hacer.",
  subtitulo:
    "Diplomados y certificaciones de competencias laborales con validez oficial CONOCER. Inscríbete en línea y empieza hoy.",
  publico: "Profesionales en activo, egresados y empresas que capacitan a su equipo.",
} as const;

export const PASOS = [
  {
    titulo: "Elige",
    texto: "Explora el catálogo por área, modalidad o precio y compara temarios.",
  },
  {
    titulo: "Paga",
    texto: "Tarjeta, transferencia u OXXO. Factura con tu RFC si la necesitas.",
  },
  {
    titulo: "Accede",
    texto: "Recibes tu acceso al instante y avanzas a tu ritmo hasta tu constancia.",
  },
] as const;

/**
 * Testimonios. LOS DE ABAJO SON DE EJEMPLO: hay que sustituirlos por
 * testimonios reales (con permiso de la persona) antes de publicar.
 * Mientras `TESTIMONIOS_SON_EJEMPLO` sea true, la portada lo indica.
 */
export const TESTIMONIOS_SON_EJEMPLO = true;

export const TESTIMONIOS = [
  {
    nombre: "[Nombre del alumno]",
    rol: "Coordinadora de capacitación",
    programa: "EC0217.01 Impartición de cursos",
    texto:
      "Llegué con años dando cursos y sin nada que lo acreditara. En seis semanas tenía mi evaluación lista y hoy mi constancia abre puertas en licitaciones.",
  },
  {
    nombre: "[Nombre del alumno]",
    rol: "Analista de datos",
    programa: "Diplomado en Ciencia de Datos para Negocios",
    texto:
      "El temario va directo a lo que usas en el trabajo. Los proyectos del módulo cuatro los presenté tal cual a mi dirección.",
  },
  {
    nombre: "[Nombre de la empresa]",
    rol: "Gerencia de Recursos Humanos",
    programa: "Programa para empresas",
    texto:
      "Certificamos a 18 instructores internos con un solo calendario y una sola factura. El seguimiento por persona nos ahorró semanas.",
  },
] as const;

export const PREGUNTAS = [
  {
    pregunta: "¿Qué diferencia hay entre un diplomado y una certificación?",
    respuesta:
      "El diplomado es formación: aprendes un tema a fondo y obtienes una constancia de horas. La certificación evalúa que ya dominas un estándar de competencia (por ejemplo EC0217.01) y, si resultas competente, recibes el certificado oficial CONOCER con validez en todo el país.",
  },
  {
    pregunta: "¿Los certificados tienen validez oficial?",
    respuesta:
      "Sí. CEDUCT A.C. es Entidad de Certificación y Evaluación acreditada ante CONOCER con la clave ECE 002-10. Los certificados de competencia los emite la SEP a través de CONOCER y se pueden verificar públicamente.",
  },
  {
    pregunta: "¿Cuándo tengo acceso después de pagar?",
    respuesta:
      "Con tarjeta el acceso es inmediato: te llega un correo y el programa aparece en «Mis cursos». Con transferencia u OXXO el acceso se activa en cuanto se confirma el pago, normalmente el mismo día hábil.",
  },
  {
    pregunta: "¿Puedo facturar?",
    respuesta:
      "Sí. Al pagar captura tu RFC y razón social; la factura se emite a nombre de la persona o empresa que indiques.",
  },
  {
    pregunta: "¿Tienen planes para empresas?",
    respuesta:
      "Sí. Armamos grupos cerrados con calendario propio, precio por volumen y reporte de avance por colaborador. Escríbenos desde la página de contacto.",
  },
  {
    pregunta: "¿Qué pasa si no resulto competente en la evaluación?",
    respuesta:
      "Recibes retroalimentación puntual de qué evidencias faltaron y puedes presentar de nuevo la parte pendiente sin repetir todo el proceso.",
  },
] as const;

/** Respaldo institucional (no son cifras de venta: son hechos verificables). */
export const RESPALDO = [
  { dato: "ECE 002-10", texto: "Clave de acreditación CONOCER" },
  { dato: "SEP · CONOCER", texto: "Emisión de certificados oficiales" },
  { dato: "100% en línea", texto: "Inscripción, pago y acceso" },
] as const;

/**
 * El camino a la certificación, en tres etapas.
 *
 * Es el esquema con el que CEDUCT lo explica desde siempre: primero se
 * reconoce lo que la persona ya sabe hacer, luego cursa sólo lo que le falta,
 * y al final un evaluador acreditado dictamina su competencia.
 *
 * No confundir con `PASOS`, que es el camino comercial (elegir, pagar,
 * acceder). Éste es el formativo, y es el que justifica el precio.
 */
export const ETAPAS = [
  {
    ordinal: "uno",
    titulo: "Reconoce lo que ya sabes",
    resumen: "Antes de estudiar nada, ponemos en claro qué sabes hacer y cuánto de eso ya vale.",
    pasos: [
      { titulo: "Valida tus conocimientos", texto: "Vemos qué dominas de verdad, no qué cursos tomaste." },
      { titulo: "Capitaliza tu experiencia", texto: "Los años de oficio cuentan como evidencia, no se tiran." },
      { titulo: "Ubica tu dominio", texto: "Identificamos el estándar de competencia que te corresponde." },
    ],
  },
  {
    ordinal: "dos",
    titulo: "Cursa el programa",
    resumen: "El diplomado cubre lo que te falta para el estándar, ni más ni menos.",
    pasos: [
      { titulo: "Ingresa a los módulos", texto: "Sólo los que te corresponden según tu diagnóstico." },
      { titulo: "Participa", texto: "Clases en vivo, pizarra y trabajo con el grupo." },
      { titulo: "Practica", texto: "Ejercicios con los productos que luego serán tu evidencia." },
      { titulo: "Recibe tu constancia", texto: "Al cerrar el programa, con horas y contenido detallados." },
    ],
  },
  {
    ordinal: "tres",
    titulo: "Certifícate",
    resumen: "La parte que da validez oficial: un evaluador acreditado dictamina tu competencia.",
    pasos: [
      { titulo: "Solicita tu evaluación", texto: "Se abre tu expediente y se agenda con el evaluador." },
      { titulo: "Acredita tu competencia", texto: "Presentas evidencias y desempeños conforme al estándar." },
      { titulo: "Obtén tu certificado", texto: "Se emite y se registra ante CONOCER. No caduca." },
    ],
  },
] as const;

/** Lo que se lleva quien termina. El motivo, no el trámite. */
export const LOGROS = [
  "Mejores ingresos",
  "Reconocimiento nacional",
  "Satisfacción por lo que haces",
  "Constancia",
  "Certificado",
] as const;
