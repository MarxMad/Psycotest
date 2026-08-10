/**
 * Cuadernillo MABE — 4 bloques según PLANTILLA MABE.ppt / formularios en papel.
 * Cada ítem tiene id único; `scoreKey` alimenta el motor en mabe-keys.json.
 */

export const MABE_ESCALA = [
  { valor: 5, etiqueta: "De importancia crítica" },
  { valor: 4, etiqueta: "Importante la mayor parte del tiempo" },
  { valor: 3, etiqueta: "De importancia promedio o relativa" },
  { valor: 2, etiqueta: "Ocasionalmente importante" },
  { valor: 1, etiqueta: "Importante rara vez o nunca" },
] as const;

export interface ItemMabe {
  id: string;
  numero: number;
  texto: string;
  scoreKey: string;
  tag?: string;
}

export interface SeccionMabe {
  id: string;
  titulo: string;
  items: ItemMabe[];
}

export interface BloqueMabe {
  id: string;
  titulo: string;
  subtitulo: string;
  instrucciones: string[];
  /** Campos de encabezado del formulario en papel */
  encabezado?: string[];
  secciones: SeccionMabe[];
}

/** Procesos pensantes preferidos del PUESTO — 24 ítems (2 columnas × 12) */
const PROC_PUESTO: ItemMabe[] = [
  { id: "pp-01", numero: 1, texto: "Usar hechos para explicar", scoreKey: "pp-01" },
  { id: "pp-02", numero: 2, texto: "Ser un administrador cuidadoso", scoreKey: "pp-02" },
  { id: "pp-03", numero: 3, texto: "Manejar conceptos o ideas complejas", scoreKey: "pp-03" },
  { id: "pp-04", numero: 4, texto: "Expresar sentimientos hacia otros", scoreKey: "pp-04" },
  { id: "pp-05", numero: 5, texto: "Llevar el control del flujo de trabajo", scoreKey: "pp-05" },
  { id: "pp-06", numero: 6, texto: "Canalizar problemas complicados", scoreKey: "pp-06" },
  { id: "pp-07", numero: 7, texto: "Tomar cursos de acción conservadores", scoreKey: "pp-07" },
  { id: "pp-08", numero: 8, texto: "Desarrollar ideas originales", scoreKey: "pp-08" },
  { id: "pp-09", numero: 9, texto: "Hacer cálculos matemáticos", scoreKey: "pp-09" },
  { id: "pp-10", numero: 10, texto: "Utilizar técnicas o enfoques artísticos", scoreKey: "pp-10" },
  { id: "pp-11", numero: 11, texto: "Organizar gente en el trabajo", scoreKey: "pp-11" },
  { id: "pp-12", numero: 12, texto: "Ser de mentalidad abierta", scoreKey: "pp-12" },
  { id: "pp-13", numero: 13, texto: "Programar operaciones de trabajo", scoreKey: "pp-13" },
  { id: "pp-14", numero: 14, texto: "Mantener relaciones personales favorables", scoreKey: "pp-14" },
  { id: "pp-15", numero: 15, texto: "Utilizar la lógica para resolver problemas", scoreKey: "pp-15" },
  { id: "pp-16", numero: 16, texto: "Pensar en grande (futurear)", scoreKey: "pp-16" },
  { id: "pp-17", numero: 17, texto: "Ser sensible a las necesidades de otros", scoreKey: "pp-17" },
  { id: "pp-18", numero: 18, texto: "Hacer juicios racionales", scoreKey: "pp-18" },
  { id: "pp-19", numero: 19, texto: "Estimular actitudes positivas en otros", scoreKey: "pp-19" },
  { id: "pp-20", numero: 20, texto: "Ordenar mucha información", scoreKey: "pp-20" },
  { id: "pp-21", numero: 21, texto: "Ser accesible a la gente", scoreKey: "pp-21" },
  { id: "pp-22", numero: 22, texto: "Diseñar proyectos, productos o programas", scoreKey: "pp-22" },
  { id: "pp-23", numero: 23, texto: "Evaluar riesgos y probabilidades de resultado", scoreKey: "pp-23" },
  { id: "pp-24", numero: 24, texto: "Actuar en forma sistemática", scoreKey: "pp-24" },
];

/** Valores del PUESTO — 30 ítems */
const VAL_PUESTO: ItemMabe[] = [
  { id: "vp-01", numero: 1, texto: "Ayudar a otras personas", scoreKey: "vp-01" },
  { id: "vp-02", numero: 2, texto: "Resolver problemas complicados", scoreKey: "vp-02" },
  { id: "vp-03", numero: 3, texto: "Crear impresiones favorables", scoreKey: "vp-03" },
  { id: "vp-04", numero: 4, texto: "Apegarse al presupuesto", scoreKey: "vp-04" },
  { id: "vp-05", numero: 5, texto: "Guiar a otros hacia los objetivos", scoreKey: "vp-05" },
  { id: "vp-06", numero: 6, texto: "Ser creativos o innovadores", scoreKey: "vp-06" },
  { id: "vp-07", numero: 7, texto: "Lograr utilidades", scoreKey: "vp-07" },
  { id: "vp-08", numero: 8, texto: "Buscar promoción en la organización", scoreKey: "vp-08" },
  { id: "vp-09", numero: 9, texto: "Apegarse a principios éticos", scoreKey: "vp-09" },
  { id: "vp-10", numero: 10, texto: "Utilizar color o diseño en el trabajo", scoreKey: "vp-10" },
  { id: "vp-11", numero: 11, texto: "Luchar por mantener las opiniones o creencias", scoreKey: "vp-11" },
  { id: "vp-12", numero: 12, texto: "Conservar los recursos financieros", scoreKey: "vp-12" },
  { id: "vp-13", numero: 13, texto: "Manejar problemas interpersonales", scoreKey: "vp-13" },
  { id: "vp-14", numero: 14, texto: "Utilizar técnicas o toques artísticos", scoreKey: "vp-14" },
  { id: "vp-15", numero: 15, texto: "Implementar o seguir sistemas administrativos", scoreKey: "vp-15" },
  { id: "vp-16", numero: 16, texto: "Controlar la calidad", scoreKey: "vp-16" },
  { id: "vp-17", numero: 17, texto: "Actuar con buena voluntad con los demás", scoreKey: "vp-17" },
  { id: "vp-18", numero: 18, texto: "Hacer presentaciones efectivas", scoreKey: "vp-18" },
  { id: "vp-19", numero: 19, texto: "Conducir investigaciones", scoreKey: "vp-19" },
  { id: "vp-20", numero: 20, texto: "Evaluar relaciones de costo-beneficio", scoreKey: "vp-20" },
  { id: "vp-21", numero: 21, texto: "Utilizar la fuerza personal para guiar a otros", scoreKey: "vp-21" },
  { id: "vp-22", numero: 22, texto: "Ser curioso o inquisitivo", scoreKey: "vp-22" },
  { id: "vp-23", numero: 23, texto: "Cumplir los estándares profesionales", scoreKey: "vp-23" },
  { id: "vp-24", numero: 24, texto: "Tomar decisiones prácticas", scoreKey: "vp-24" },
  { id: "vp-25", numero: 25, texto: "Demostrar sensibilidad con la gente", scoreKey: "vp-25" },
  { id: "vp-26", numero: 26, texto: "Evaluar por la apariencia personal", scoreKey: "vp-26" },
  { id: "vp-27", numero: 27, texto: "Dirigir a los empleados agresivamente", scoreKey: "vp-27" },
  { id: "vp-28", numero: 28, texto: "Hacer juicios lógicos", scoreKey: "vp-28" },
  { id: "vp-29", numero: 29, texto: "Mostrar una conducta personal ejemplar", scoreKey: "vp-29" },
  { id: "vp-30", numero: 30, texto: "Involucrarse en actividades caritativas", scoreKey: "vp-30" },
];

/** Proceso pensante PERSONAL — 60 ítems en 3 secciones */
const PS_I: ItemMabe[] = [
  { id: "ps-i-01", numero: 1, texto: "Pasatiempos artísticos", scoreKey: "ps-i-01", tag: "Intereses" },
  { id: "ps-i-02", numero: 2, texto: "Pasatiempos sociales", scoreKey: "ps-i-02", tag: "Intereses" },
  { id: "ps-i-03", numero: 3, texto: "Pasatiempos científicos", scoreKey: "ps-i-03", tag: "Intereses" },
  { id: "ps-i-04", numero: 4, texto: "Pasatiempos deportivos", scoreKey: "ps-i-04", tag: "Intereses" },
  { id: "ps-i-05", numero: 5, texto: "Materias: matemáticas", scoreKey: "ps-i-05", tag: "Intereses" },
  { id: "ps-i-06", numero: 6, texto: "Materias: música", scoreKey: "ps-i-06", tag: "Intereses" },
  { id: "ps-i-07", numero: 7, texto: "Materias: filosofía", scoreKey: "ps-i-07", tag: "Intereses" },
  { id: "ps-i-08", numero: 8, texto: "Materias: idiomas", scoreKey: "ps-i-08", tag: "Intereses" },
  { id: "ps-i-09", numero: 9, texto: "Gente divertida", scoreKey: "ps-i-09", tag: "Intereses" },
  { id: "ps-i-10", numero: 10, texto: "Gente organizada", scoreKey: "ps-i-10", tag: "Intereses" },
  { id: "ps-i-11", numero: 11, texto: "Gente soñadora", scoreKey: "ps-i-11", tag: "Intereses" },
  { id: "ps-i-12", numero: 12, texto: "Gente objetiva", scoreKey: "ps-i-12", tag: "Intereses" },
  { id: "ps-i-13", numero: 13, texto: "Maestros: aprendí con fórmulas", scoreKey: "ps-i-13", tag: "Intereses" },
  { id: "ps-i-14", numero: 14, texto: "Maestros: aprendí con procedimientos", scoreKey: "ps-i-14", tag: "Intereses" },
  { id: "ps-i-15", numero: 15, texto: "Maestros: aprendí con visión de futuro", scoreKey: "ps-i-15", tag: "Intereses" },
  { id: "ps-i-16", numero: 16, texto: "Maestros: aprendí con sentimientos", scoreKey: "ps-i-16", tag: "Intereses" },
  { id: "ps-i-17", numero: 17, texto: "Líderes imaginativos", scoreKey: "ps-i-17", tag: "Intereses" },
  { id: "ps-i-18", numero: 18, texto: "Líderes inspiradores", scoreKey: "ps-i-18", tag: "Intereses" },
  { id: "ps-i-19", numero: 19, texto: "Líderes inquisitivos", scoreKey: "ps-i-19", tag: "Intereses" },
  { id: "ps-i-20", numero: 20, texto: "Líderes disciplinados", scoreKey: "ps-i-20", tag: "Intereses" },
];

const PS_II: ItemMabe[] = [
  { id: "ps-ii-01", numero: 1, texto: "Creativo", scoreKey: "ps-ii-01", tag: "Descripción" },
  { id: "ps-ii-02", numero: 2, texto: "Comunicativo", scoreKey: "ps-ii-02", tag: "Descripción" },
  { id: "ps-ii-03", numero: 3, texto: "Controlado", scoreKey: "ps-ii-03", tag: "Descripción" },
  { id: "ps-ii-04", numero: 4, texto: "Intuitivo", scoreKey: "ps-ii-04", tag: "Descripción" },
  { id: "ps-ii-05", numero: 5, texto: "Músico", scoreKey: "ps-ii-05", tag: "Descripción" },
  { id: "ps-ii-06", numero: 6, texto: "Inteligente", scoreKey: "ps-ii-06", tag: "Descripción" },
  { id: "ps-ii-07", numero: 7, texto: "Conceptual", scoreKey: "ps-ii-07", tag: "Descripción" },
  { id: "ps-ii-08", numero: 8, texto: "Emotivo", scoreKey: "ps-ii-08", tag: "Descripción" },
  { id: "ps-ii-09", numero: 9, texto: "Organizado", scoreKey: "ps-ii-09", tag: "Descripción" },
  { id: "ps-ii-10", numero: 10, texto: "Cuantitativo", scoreKey: "ps-ii-10", tag: "Descripción" },
  { id: "ps-ii-11", numero: 11, texto: "Científico", scoreKey: "ps-ii-11", tag: "Descripción" },
  { id: "ps-ii-12", numero: 12, texto: "Detallista", scoreKey: "ps-ii-12", tag: "Descripción" },
  { id: "ps-ii-13", numero: 13, texto: "Matemático", scoreKey: "ps-ii-13", tag: "Descripción" },
  { id: "ps-ii-14", numero: 14, texto: "Afectivo", scoreKey: "ps-ii-14", tag: "Descripción" },
  { id: "ps-ii-15", numero: 15, texto: "Técnico", scoreKey: "ps-ii-15", tag: "Descripción" },
  { id: "ps-ii-16", numero: 16, texto: "Conservador", scoreKey: "ps-ii-16", tag: "Descripción" },
  { id: "ps-ii-17", numero: 17, texto: "Analítico", scoreKey: "ps-ii-17", tag: "Descripción" },
  { id: "ps-ii-18", numero: 18, texto: "Imaginativo", scoreKey: "ps-ii-18", tag: "Descripción" },
  { id: "ps-ii-19", numero: 19, texto: "Racional", scoreKey: "ps-ii-19", tag: "Descripción" },
  { id: "ps-ii-20", numero: 20, texto: "Original", scoreKey: "ps-ii-20", tag: "Descripción" },
];

const PS_III: ItemMabe[] = [
  { id: "ps-iii-01", numero: 1, texto: "Juzgar con base en hechos en lugar de sentimientos", scoreKey: "ps-iii-01", tag: "Preferencias" },
  { id: "ps-iii-02", numero: 2, texto: "Ser confiable y seguro", scoreKey: "ps-iii-02", tag: "Preferencias" },
  { id: "ps-iii-03", numero: 3, texto: "Pensar en grande sobre el futuro", scoreKey: "ps-iii-03", tag: "Preferencias" },
  { id: "ps-iii-04", numero: 4, texto: "Evaluar problemas complejos", scoreKey: "ps-iii-04", tag: "Preferencias" },
  { id: "ps-iii-05", numero: 5, texto: "Usar diagramas para explicar o enseñar", scoreKey: "ps-iii-05", tag: "Preferencias" },
  { id: "ps-iii-06", numero: 6, texto: "Trabajar en equipos o grupos de tarea", scoreKey: "ps-iii-06", tag: "Preferencias" },
  { id: "ps-iii-07", numero: 7, texto: "Poner orden cuando existe caos", scoreKey: "ps-iii-07", tag: "Preferencias" },
  { id: "ps-iii-08", numero: 8, texto: "Diseñar productos o programas originales", scoreKey: "ps-iii-08", tag: "Preferencias" },
  { id: "ps-iii-09", numero: 9, texto: "Analizar resultados científicamente", scoreKey: "ps-iii-09", tag: "Preferencias" },
  { id: "ps-iii-10", numero: 10, texto: "Sentirse atraído por ideas audaces", scoreKey: "ps-iii-10", tag: "Preferencias" },
  { id: "ps-iii-11", numero: 11, texto: "Ser filosófico sobre lo ocurrido", scoreKey: "ps-iii-11", tag: "Preferencias" },
  { id: "ps-iii-12", numero: 12, texto: "Ser sistemático y bien organizado", scoreKey: "ps-iii-12", tag: "Preferencias" },
  { id: "ps-iii-13", numero: 13, texto: "Ser adaptable con otras personas", scoreKey: "ps-iii-13", tag: "Preferencias" },
  { id: "ps-iii-14", numero: 14, texto: "Seguir métodos de prueba y error", scoreKey: "ps-iii-14", tag: "Preferencias" },
  { id: "ps-iii-15", numero: 15, texto: "Desarrollar nuevas formas de resolver problemas", scoreKey: "ps-iii-15", tag: "Preferencias" },
  { id: "ps-iii-16", numero: 16, texto: "Explorar ideas y teorías nuevas", scoreKey: "ps-iii-16", tag: "Preferencias" },
  { id: "ps-iii-17", numero: 17, texto: "Compartir sentimientos con otros", scoreKey: "ps-iii-17", tag: "Preferencias" },
  { id: "ps-iii-18", numero: 18, texto: "Trabajar con ideas complicadas", scoreKey: "ps-iii-18", tag: "Preferencias" },
  { id: "ps-iii-19", numero: 19, texto: "Divertirse con la gente", scoreKey: "ps-iii-19", tag: "Preferencias" },
  { id: "ps-iii-20", numero: 20, texto: "Planear el trabajo y trabajar conforme al plan", scoreKey: "ps-iii-20", tag: "Preferencias" },
];

/** Valores PERSONALES — 30 adjetivos */
const VAL_PERSONA: ItemMabe[] = [
  { id: "vps-01", numero: 1, texto: "Servicial", scoreKey: "vps-01" },
  { id: "vps-02", numero: 2, texto: "Analítico", scoreKey: "vps-02" },
  { id: "vps-03", numero: 3, texto: "Encantador", scoreKey: "vps-03" },
  { id: "vps-04", numero: 4, texto: "Caritativo", scoreKey: "vps-04" },
  { id: "vps-05", numero: 5, texto: "Inspirador", scoreKey: "vps-05" },
  { id: "vps-06", numero: 6, texto: "Innovador", scoreKey: "vps-06" },
  { id: "vps-07", numero: 7, texto: "Negociante", scoreKey: "vps-07" },
  { id: "vps-08", numero: 8, texto: "Ambicioso", scoreKey: "vps-08" },
  { id: "vps-09", numero: 9, texto: "Ético", scoreKey: "vps-09" },
  { id: "vps-10", numero: 10, texto: "Original", scoreKey: "vps-10" },
  { id: "vps-11", numero: 11, texto: "Asertivo", scoreKey: "vps-11" },
  { id: "vps-12", numero: 12, texto: "Financiero", scoreKey: "vps-12" },
  { id: "vps-13", numero: 13, texto: "Conciliador", scoreKey: "vps-13" },
  { id: "vps-14", numero: 14, texto: "Artístico", scoreKey: "vps-14" },
  { id: "vps-15", numero: 15, texto: "Educado", scoreKey: "vps-15" },
  { id: "vps-16", numero: 16, texto: "Específico", scoreKey: "vps-16" },
  { id: "vps-17", numero: 17, texto: "Bien-intencionado", scoreKey: "vps-17" },
  { id: "vps-18", numero: 18, texto: "Efectivo", scoreKey: "vps-18" },
  { id: "vps-19", numero: 19, texto: "Investigador", scoreKey: "vps-19" },
  { id: "vps-20", numero: 20, texto: "Conservador", scoreKey: "vps-20" },
  { id: "vps-21", numero: 21, texto: "Fuerte", scoreKey: "vps-21" },
  { id: "vps-22", numero: 22, texto: "Curioso", scoreKey: "vps-22" },
  { id: "vps-23", numero: 23, texto: "Profesional", scoreKey: "vps-23" },
  { id: "vps-24", numero: 24, texto: "Práctico", scoreKey: "vps-24" },
  { id: "vps-25", numero: 25, texto: "Sensible", scoreKey: "vps-25" },
  { id: "vps-26", numero: 26, texto: "Pulcro", scoreKey: "vps-26" },
  { id: "vps-27", numero: 27, texto: "Agresivo", scoreKey: "vps-27" },
  { id: "vps-28", numero: 28, texto: "Lógico", scoreKey: "vps-28" },
  { id: "vps-29", numero: 29, texto: "Recto", scoreKey: "vps-29" },
  { id: "vps-30", numero: 30, texto: "Altruista", scoreKey: "vps-30" },
];

const INSTRUCCION_PUESTO =
  "Identifique las preferencias de procesos de pensamiento, estilos de comunicación o formas de analizar problemas requeridos para desempeñar un puesto de trabajo específico. Califique cada factor según su importancia para el desempeño del puesto.";

const INSTRUCCION_VALORES_PUESTO =
  "Permite al evaluador especificar los estándares de valores para un puesto de trabajo, independientemente de quién lo ocupe actualmente. Califique cada factor según su importancia para el puesto.";

const INSTRUCCION_PROC_PS =
  "Identifique sus preferencias personales de procesos de pensamiento. Califique cada reactivo según qué tan frecuentemente o qué tan importante es para usted (no para el puesto).";

const INSTRUCCION_VAL_PS =
  "Identifique sus valores personales. Califique cada adjetivo según qué tan frecuentemente o qué tan importante es para usted.";

export const MABE_BLOQUES: BloqueMabe[] = [
  {
    id: "procPuesto",
    titulo: "Procesos pensantes preferidos del puesto",
    subtitulo: "24 reactivos · escala 1–5",
    encabezado: ["Puesto", "Nombre", "Nombre del evaluador", "Compañía", "Fecha"],
    instrucciones: [INSTRUCCION_PUESTO],
    secciones: [{ id: "main", titulo: "Reactivos del puesto", items: PROC_PUESTO }],
  },
  {
    id: "valPuesto",
    titulo: "Valores del puesto",
    subtitulo: "30 reactivos · escala 1–5",
    encabezado: ["Puesto", "Nombre", "Nombre del evaluador", "Compañía", "Fecha"],
    instrucciones: [INSTRUCCION_VALORES_PUESTO],
    secciones: [{ id: "main", titulo: "Valores requeridos por el puesto", items: VAL_PUESTO }],
  },
  {
    id: "procPs",
    titulo: "Proceso pensante preferido personal",
    subtitulo: "60 reactivos · 3 secciones · escala 1–5",
    encabezado: ["Nombre", "Sexo", "Compañía", "Fecha", "Ocupación", "Puesto"],
    instrucciones: [INSTRUCCION_PROC_PS],
    secciones: [
      { id: "I", titulo: "I. Intereses personales", items: PS_I },
      { id: "II", titulo: "II. Descripción personal", items: PS_II },
      { id: "III", titulo: "III. Preferencias personales", items: PS_III },
    ],
  },
  {
    id: "valPs",
    titulo: "Valores personal",
    subtitulo: "30 reactivos · escala 1–5",
    encabezado: ["Nombre", "Sexo", "Compañía", "Fecha"],
    instrucciones: [INSTRUCCION_VAL_PS],
    secciones: [{ id: "main", titulo: "Adjetivos personales", items: VAL_PERSONA }],
  },
];

/** Ítems planos en el mismo orden que el cuadernillo (144 total). */
export function todosItemsMabe(): ItemMabe[] {
  return MABE_BLOQUES.flatMap((b) => b.secciones.flatMap((s) => s.items));
}
