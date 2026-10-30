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

export type IconoCategoria = "edificio" | "pulso" | "maleta" | "brujula" | "birrete" | "diploma";

export type Categoria = {
  slug: string;
  nombre: string;
  resumen: string;
  icono: IconoCategoria;
  /** Tono de la portada generada; siempre sobre el azul de fondo. */
  tono: string;
};

/**
 * Los sectores en que CEDUCT agrupa sus estándares de competencia. Son las
 * categorías de las certificaciones; los diplomados van aparte (ver
 * `CATEGORIA_DIPLOMADOS`). Los slugs coinciden con los de la base, que
 * siembra `npm run ceduct:sembrar` desde `oferta.ts`.
 */
export const CATEGORIAS: Categoria[] = [
  {
    slug: "servicio-publico",
    nombre: "Servicio Público",
    resumen: "Atención al ciudadano en dependencias de gobierno.",
    icono: "edificio",
    tono: "#38BDF8",
  },
  {
    slug: "salud-y-bienestar",
    nombre: "Salud y Bienestar",
    resumen: "Consejería en adicciones.",
    icono: "pulso",
    tono: "#34D399",
  },
  {
    slug: "turismo-y-hospitalidad",
    nombre: "Turismo y Hospitalidad",
    resumen: "Recepción de huéspedes y atención al comensal.",
    icono: "maleta",
    tono: "#F97316",
  },
  {
    slug: "desarrollo-personal-y-profesional",
    nombre: "Desarrollo Personal y Profesional",
    resumen: "Evaluación de competencias y coaching.",
    icono: "brujula",
    tono: "#FACC15",
  },
  {
    slug: "capacitacion-y-formacion",
    nombre: "Capacitación y Formación",
    resumen: "Impartición, tutoría y desarrollo de cursos.",
    icono: "birrete",
    tono: "#A78BFA",
  },
];

/** Los diplomados no son de un sector: tienen su propia sección. */
export const CATEGORIA_DIPLOMADOS: Categoria = {
  slug: "diplomados",
  nombre: "Diplomados",
  resumen: "104 horas, mixtos: 60% práctica y 40% teoría.",
  icono: "diploma",
  tono: "#F472B6",
};

export function categoriaPorSlug(slug: string): Categoria {
  if (slug === CATEGORIA_DIPLOMADOS.slug) return CATEGORIA_DIPLOMADOS;
  return CATEGORIAS.find((c) => c.slug === slug) ?? CATEGORIAS[3];
}

/**
 * Las categorías de la base se llaman igual que las del marketplace. Si algún
 * día se crea una a mano con otro nombre, se acomoda por palabras clave; lo
 * que no encaja cae en Desarrollo Personal y Profesional.
 */
export function categoriaDesdeTexto(texto: string | null | undefined): string {
  const t = (texto ?? "").toLowerCase();
  const todas = [...CATEGORIAS, CATEGORIA_DIPLOMADOS];
  const exacta = todas.find((c) => c.slug === t || c.nombre.toLowerCase() === t);
  if (exacta) return exacta.slug;
  if (/diplomad/.test(t)) return "diplomados";
  if (/(públic|public|gobierno|ciudadan)/.test(t)) return "servicio-publico";
  if (/(salud|bienestar|adicci)/.test(t)) return "salud-y-bienestar";
  if (/(turis|hotel|hospital|restaur|comensal)/.test(t)) return "turismo-y-hospitalidad";
  if (/(capacita|formaci|docen|instruc|curso)/.test(t)) return "capacitacion-y-formacion";
  return "desarrollo-personal-y-profesional";
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
    programa: "Diplomado Formador que inspira",
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
