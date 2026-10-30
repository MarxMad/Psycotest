/**
 * La oferta de CEDUCT: los estándares de competencia SEP-CONOCER con los que
 * certifica y los diplomados que preparan para ellos.
 *
 * Vive en el repositorio y se siembra en la base con `npm run ceduct:sembrar`.
 * El marketplace lee de la base —no de aquí— para que lo que se edite en
 * /admin/cursos mande; esta lista es la semilla y el orden del catálogo.
 *
 * Las certificaciones se agrupan por sector (las categorías de `config.ts`);
 * los diplomados van en su propia sección.
 */

import { CATEGORIA_DIPLOMADOS, CATEGORIAS } from "./config";
import type { Modalidad, Nivel, TipoPrograma } from "./tipos";

export type ProgramaCeduct = {
  id: string;
  slug: string;
  tipo: TipoPrograma;
  titulo: string;
  /** Una línea para la tarjeta. */
  resumen: string;
  descripcion: string;
  /** Slug de la categoría: un sector de `CATEGORIAS` o `diplomados`. */
  categoria: string;
  /** Sólo las certificaciones: el estándar que se evalúa. */
  estandarClave: string | null;
  modalidad: Modalidad;
  nivel: Nivel;
  /** 0 en las certificaciones: no se cursan, se evalúan. */
  horas: number;
  orden: number;
};

/** Las categorías que se siembran en la base para el canal `ceduct`. */
export const CATEGORIAS_CEDUCT = [...CATEGORIAS, CATEGORIA_DIPLOMADOS].map((c, i) => ({
  id: `ceduct-${c.slug}`,
  slug: c.slug,
  nombre: c.nombre,
  descripcion: c.resumen,
  orden: i + 1,
}));

function certificacion(
  clave: string,
  slug: string,
  titulo: string,
  categoria: string,
  resumen: string,
  descripcion: string,
  orden: number,
): ProgramaCeduct {
  return {
    id: `ceduct-${clave.toLowerCase().replace(".", "-")}`,
    slug,
    tipo: "certificacion",
    titulo,
    resumen,
    descripcion,
    categoria,
    estandarClave: clave,
    modalidad: "mixta",
    nivel: "intermedio",
    horas: 0,
    orden,
  };
}

export const CERTIFICACIONES_CEDUCT: ProgramaCeduct[] = [
  // ---------- Servicio Público ----------
  certificacion(
    "EC0105",
    "ec0105-atencion-al-ciudadano",
    "Atención al ciudadano en el sector público",
    "servicio-publico",
    "Para quien atiende trámites y servicios en una dependencia.",
    "Certifica que atiendes al ciudadano conforme al estándar: recibirlo, identificar lo que necesita, orientarlo o resolver su trámite y dar seguimiento a lo que quedó pendiente.",
    1,
  ),

  // ---------- Salud y Bienestar ----------
  certificacion(
    "EC0548",
    "ec0548-consejeria-en-adicciones",
    "Consejería en adicciones",
    "salud-y-bienestar",
    "Para quien acompaña a personas con consumo de sustancias.",
    "Certifica tu competencia para brindar consejería en adicciones: entrevista inicial, plan de intervención con la persona y seguimiento de su proceso.",
    1,
  ),

  // ---------- Turismo y Hospitalidad ----------
  certificacion(
    "EC0045",
    "ec0045-recepcion-y-atencion-al-huesped",
    "Prestación del servicio de recepción y atención al huésped para su alojamiento temporal",
    "turismo-y-hospitalidad",
    "Para el personal de recepción de hoteles.",
    "Certifica que llevas la recepción conforme al estándar: registro y salida del huésped, atención de solicitudes durante su estancia y manejo de la información de la estancia.",
    1,
  ),
  certificacion(
    "EC0722",
    "ec0722-atencion-al-comensal",
    "Atención al comensal",
    "turismo-y-hospitalidad",
    "Para meseros y personal de piso en restaurantes.",
    "Certifica tu servicio en sala: recibir al comensal, tomar y servir la orden, atenderlo durante su estancia y cerrar la cuenta.",
    2,
  ),

  // ---------- Desarrollo Personal y Profesional ----------
  certificacion(
    "EC0076",
    "ec0076-evaluacion-de-candidatos",
    "Evaluación de la competencia de candidatos con base en Estándares de Competencia",
    "desarrollo-personal-y-profesional",
    "Para quien quiere evaluar y certificar a otros.",
    "Certifica que puedes evaluar a candidatos con base en un estándar de competencia: planear la evaluación, recoger evidencias, emitir el juicio de competencia y presentar los resultados.",
    1,
  ),
  certificacion(
    "EC0204",
    "ec0204-sesiones-de-coaching",
    "Ejecución de sesiones de coaching",
    "desarrollo-personal-y-profesional",
    "Para coaches que quieren respaldo oficial.",
    "Certifica que conduces sesiones de coaching conforme al estándar: acordar el proceso con el coachee, conducir las sesiones y cerrar el proceso con resultados.",
    2,
  ),

  // ---------- Capacitación y Formación ----------
  certificacion(
    "EC0217.01",
    "ec0217-01-imparticion-de-cursos-presenciales",
    "Impartición de cursos de formación del capital humano de manera presencial grupal",
    "capacitacion-y-formacion",
    "Para instructores que dan cursos presenciales.",
    "Certifica que impartes cursos presenciales grupales conforme al estándar: preparar la sesión, conducirla con técnicas instruccionales y evaluar el aprendizaje del grupo.",
    1,
  ),
  certificacion(
    "EC0336",
    "ec0336-tutoria-en-linea",
    "Tutoría de cursos y diplomados en línea",
    "capacitacion-y-formacion",
    "Para tutores y facilitadores de educación en línea.",
    "Certifica que acompañas a los participantes de un curso en línea: dar la bienvenida, dar seguimiento a su avance, retroalimentar sus actividades y cerrar el curso.",
    2,
  ),
  certificacion(
    "EC0366",
    "ec0366-desarrollo-de-cursos-en-linea",
    "Desarrollo de cursos de formación en línea",
    "capacitacion-y-formacion",
    "Para quien diseña y produce cursos en línea.",
    "Certifica que desarrollas cursos de formación en línea: diseñar el curso, elaborar sus materiales y actividades, y montarlo listo para operar.",
    3,
  ),
];

const DIPLOMADO_FORMATO =
  "104 horas acreditadas. Modalidad mixta, virtual y presencial: 60% práctica y 40% teoría.";

export const DIPLOMADOS_CEDUCT: ProgramaCeduct[] = [
  {
    id: "ceduct-diplomado-coach-en-accion",
    slug: "diplomado-el-coach-en-accion",
    tipo: "diplomado",
    titulo: "El Coach en Acción",
    resumen: "Con opción a certificarte en el EC0204, Ejecución de sesiones de coaching.",
    descripcion: `${DIPLOMADO_FORMATO} Al terminar puedes certificarte en el estándar EC0204, Ejecución de sesiones de coaching.`,
    categoria: "diplomados",
    estandarClave: null,
    modalidad: "mixta",
    nivel: "intermedio",
    horas: 104,
    orden: 1,
  },
  {
    id: "ceduct-diplomado-formador-que-inspira",
    slug: "diplomado-formador-que-inspira",
    tipo: "diplomado",
    titulo: "Formador que inspira",
    resumen: "Con opción a certificarte en el EC0217.01, EC0366 o EC0336.",
    descripcion: `${DIPLOMADO_FORMATO} Al terminar puedes certificarte en los estándares EC0217.01 (impartición presencial), EC0366 (desarrollo de cursos en línea) o EC0336 (tutoría en línea).`,
    categoria: "diplomados",
    estandarClave: null,
    modalidad: "mixta",
    nivel: "intermedio",
    horas: 104,
    orden: 2,
  },
];

export const PROGRAMAS_CEDUCT = [...DIPLOMADOS_CEDUCT, ...CERTIFICACIONES_CEDUCT];
