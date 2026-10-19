/**
 * El catálogo de la academia de Ingeniería de Grupos Efectivos.
 *
 * Vive en el repositorio y se siembra en la base con `npm run ige:sembrar`.
 * El sitio lee de la base —no de aquí— para que lo que se edite en /admin/cursos
 * mande; esta lista es la semilla y el orden en que se presenta el catálogo.
 *
 * Los cursos en vivo se cotizan por grupo, así que salen con precio 0 y la
 * ficha pide cotización. En cuanto alguien les ponga precio en el panel, la
 * tarjeta cambia sola a botón de compra.
 */

export type FormatoIge = "vivo" | "grabado";

export type CategoriaIge = {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string;
  formato: FormatoIge;
  /** Foto de cabecera del bloque. */
  imagen: string;
  orden: number;
};

export type CursoIge = {
  id: string;
  slug: string;
  titulo: string;
  /** Una línea para la tarjeta. */
  resumen: string;
  /** Lo que se lleva quien lo toma, para la ficha del curso. */
  descripcion: string;
  categoria: string;
  nivel: "basico" | "intermedio" | "avanzado";
  horas: number;
  imagen: string;
  orden: number;
};

const FOTO = {
  mesa: "/media/hero-poster.jpg",
  grupo: "/ige/download.jpg",
  circulo: "/ige/download-1.jpg",
  acuerdo: "/ige/banner.png",
  junta: "/ige/1.png",
  dupla: "/ige/serv1.png",
  pizarra: "/ige/serv2.png",
  escritorio: "/ige/serv3.png",
  retrato: "/ige/Imagen-1.png",
} as const;

export const CATEGORIAS_IGE: CategoriaIge[] = [
  {
    id: "ige-direccion",
    slug: "direccion-y-clima",
    nombre: "Dirección y clima laboral",
    descripcion:
      "Los ocho temas que más se piden cuando el equipo trabaja pero no se entiende. Se dan en vivo, con los casos de tu operación.",
    formato: "vivo",
    imagen: FOTO.circulo,
    orden: 1,
  },
  {
    id: "ige-actualizacion",
    slug: "actualizacion-y-cumplimiento",
    nombre: "Actualización y cumplimiento",
    descripcion:
      "Lo que la organización necesita tener al día: herramientas nuevas, seguridad y la obligación que ya está en la ley.",
    formato: "vivo",
    imagen: FOTO.junta,
    orden: 2,
  },
  {
    id: "ige-diagnostico",
    slug: "tecnicas-de-diagnostico",
    nombre: "Técnicas de diagnóstico",
    descripcion:
      "Medir antes de intervenir. Cuatro instrumentos grabados, con formatos listos para aplicar en tu organización.",
    formato: "grabado",
    imagen: FOTO.escritorio,
    orden: 3,
  },
  {
    id: "ige-conflictos",
    slug: "manejo-de-conflictos",
    nombre: "Manejo de conflictos",
    descripcion:
      "Tres métodos probados para destrabar un acuerdo entre áreas sin que el conflicto se vuelva personal.",
    formato: "grabado",
    imagen: FOTO.grupo,
    orden: 4,
  },
];

export const CURSOS_IGE: CursoIge[] = [
  // ---------- En vivo · Dirección y clima laboral ----------
  {
    id: "ige-liderazgo",
    slug: "liderazgo",
    titulo: "Liderazgo",
    resumen: "Dirigir sin apagar fuegos ni cargar con el trabajo de todos.",
    descripcion:
      "Qué hace un jefe que su equipo sigue aunque no esté presente: cómo fijar el estándar, cómo delegar sin soltar el resultado y cómo sostener la exigencia sin desgastar a la gente.",
    categoria: "ige-direccion",
    nivel: "intermedio",
    horas: 16,
    imagen: FOTO.circulo,
    orden: 1,
  },
  {
    id: "ige-inteligencia-emocional",
    slug: "inteligencia-emocional",
    titulo: "Inteligencia emocional",
    resumen: "Lo que pasa en la junta cuando alguien se lo toma personal.",
    descripcion:
      "Reconocer la emoción propia antes de que decida por uno, leer la del otro y conducir una conversación difícil sin romper la relación de trabajo.",
    categoria: "ige-direccion",
    nivel: "basico",
    horas: 12,
    imagen: FOTO.dupla,
    orden: 2,
  },
  {
    id: "ige-comunicacion-efectiva",
    slug: "comunicacion-efectiva",
    titulo: "Comunicación efectiva",
    resumen: "Que la instrucción llegue igual a quien la recibe.",
    descripcion:
      "Cómo se arma un mensaje que no necesita repetirse: pedir con claridad, confirmar entendimiento y dejar por escrito lo que se acordó.",
    categoria: "ige-direccion",
    nivel: "basico",
    horas: 12,
    imagen: FOTO.acuerdo,
    orden: 3,
  },
  {
    id: "ige-trabajo-en-equipo",
    slug: "trabajo-en-equipo",
    titulo: "Trabajo en equipo",
    resumen: "De un grupo que coincide a un equipo que responde.",
    descripcion:
      "Roles, reglas y seguimiento: lo que convierte a varias personas en un equipo con un resultado común y responsabilidades que nadie puede esquivar.",
    categoria: "ige-direccion",
    nivel: "basico",
    horas: 12,
    imagen: FOTO.grupo,
    orden: 4,
  },
  {
    id: "ige-resolucion-de-conflictos",
    slug: "resolucion-de-conflictos",
    titulo: "Resolución de conflictos",
    resumen: "Destrabar el pleito entre áreas antes de que suba a dirección.",
    descripcion:
      "Cómo separar el problema de la persona, encontrar el interés detrás de la postura y cerrar con un acuerdo que las dos partes puedan cumplir.",
    categoria: "ige-direccion",
    nivel: "intermedio",
    horas: 12,
    imagen: FOTO.pizarra,
    orden: 5,
  },
  {
    id: "ige-negociacion",
    slug: "habilidades-de-negociacion",
    titulo: "Habilidades de negociación",
    resumen: "Cerrar sin regalar margen ni quemar la relación.",
    descripcion:
      "Preparación, zona de acuerdo y manejo de concesiones. Aplica igual con un proveedor, con el sindicato o con otra área de la propia empresa.",
    categoria: "ige-direccion",
    nivel: "intermedio",
    horas: 12,
    imagen: FOTO.retrato,
    orden: 6,
  },
  {
    id: "ige-nom-035",
    slug: "nom-035",
    titulo: "NOM-035",
    resumen: "Cumplir la norma y además usarla para algo.",
    descripcion:
      "Qué exige la NOM-035-STPS, qué evidencia pide la autoridad y cómo levantar los factores de riesgo psicosocial sin que el ejercicio se quede en el engargolado.",
    categoria: "ige-direccion",
    nivel: "intermedio",
    horas: 8,
    imagen: FOTO.escritorio,
    orden: 7,
  },
  {
    id: "ige-aspectos-legales-rh",
    slug: "aspectos-legales-en-rh",
    titulo: "Aspectos legales en RH",
    resumen: "Decisiones de personal que se sostienen ante un tribunal.",
    descripcion:
      "Contratación, actas administrativas, rescisión y expediente laboral: lo que hay que documentar y cuándo, para que una decisión correcta no se caiga por la forma.",
    categoria: "ige-direccion",
    nivel: "avanzado",
    horas: 12,
    imagen: FOTO.junta,
    orden: 8,
  },

  // ---------- En vivo · Actualización y cumplimiento ----------
  {
    id: "ige-marketing-digital",
    slug: "marketing-digital",
    titulo: "Marketing digital",
    resumen: "Vender en línea con método, no a base de publicar.",
    descripcion:
      "Audiencia, mensaje y medición: cómo se arma una campaña, qué se mide cada semana y cuándo conviene pagar anuncios.",
    categoria: "ige-actualizacion",
    nivel: "basico",
    horas: 12,
    imagen: FOTO.mesa,
    orden: 1,
  },
  {
    id: "ige-ciberseguridad",
    slug: "ciberseguridad",
    titulo: "Ciberseguridad",
    resumen: "El eslabón débil casi siempre es una persona con prisa.",
    descripcion:
      "Contraseñas, phishing, respaldo y manejo de información sensible. Para todo el personal, no sólo para sistemas.",
    categoria: "ige-actualizacion",
    nivel: "basico",
    horas: 8,
    imagen: FOTO.junta,
    orden: 2,
  },
  {
    id: "ige-inteligencia-artificial",
    slug: "inteligencia-artificial-aplicada",
    titulo: "Inteligencia artificial aplicada",
    resumen: "Usarla en el trabajo diario sin entregarle lo confidencial.",
    descripcion:
      "Qué tareas conviene delegarle a un modelo, cómo se le pide bien, cómo se revisa lo que devuelve y qué información nunca se le pega.",
    categoria: "ige-actualizacion",
    nivel: "basico",
    horas: 8,
    imagen: FOTO.mesa,
    orden: 3,
  },
  {
    id: "ige-primeros-auxilios",
    slug: "primeros-auxilios",
    titulo: "Primeros auxilios",
    resumen: "Los primeros diez minutos, que son los que deciden.",
    descripcion:
      "Valoración inicial, RCP, control de hemorragias y traslado. Práctica con maniquí y protocolo de aviso dentro del centro de trabajo.",
    categoria: "ige-actualizacion",
    nivel: "basico",
    horas: 8,
    imagen: FOTO.grupo,
    orden: 4,
  },
  {
    id: "ige-seguridad-e-higiene",
    slug: "seguridad-e-higiene",
    titulo: "Seguridad e higiene",
    resumen: "La comisión que sí sirve y el recorrido que sí se hace.",
    descripcion:
      "Identificación de riesgos, señalización, equipo de protección y el acta de la comisión mixta, con lo que pide la inspección.",
    categoria: "ige-actualizacion",
    nivel: "basico",
    horas: 8,
    imagen: FOTO.acuerdo,
    orden: 5,
  },

  // ---------- Grabado · Técnicas de diagnóstico ----------
  {
    id: "ige-clima-laboral",
    slug: "clima-laboral",
    titulo: "Clima laboral",
    resumen: "Medir el ambiente sin que la encuesta levante sospecha.",
    descripcion:
      "Cómo se arma el instrumento, cómo se aplica para que la gente conteste de verdad y cómo se lee el resultado por área antes de prometer cambios.",
    categoria: "ige-diagnostico",
    nivel: "intermedio",
    horas: 6,
    imagen: FOTO.escritorio,
    orden: 1,
  },
  {
    id: "ige-evaluacion-desempeno",
    slug: "evaluacion-de-desempeno",
    titulo: "Evaluación de desempeño y competencias",
    resumen: "Calificar el trabajo, no la simpatía.",
    descripcion:
      "Definir el estándar del puesto, elegir el método, entrenar al evaluador y conducir la entrevista de retroalimentación sin que termine en pleito.",
    categoria: "ige-diagnostico",
    nivel: "intermedio",
    horas: 6,
    imagen: FOTO.grupo,
    orden: 2,
  },
  {
    id: "ige-evaluacion-servicio",
    slug: "evaluacion-de-servicio",
    titulo: "Evaluación de servicio",
    resumen: "Qué siente el cliente en cada punto de contacto.",
    descripcion:
      "Cliente misterioso, encuesta de salida e indicadores de atención: cómo se levantan y cómo se convierten en una instrucción concreta para el personal de contacto.",
    categoria: "ige-diagnostico",
    nivel: "basico",
    horas: 4,
    imagen: FOTO.retrato,
    orden: 3,
  },
  {
    id: "ige-dnc",
    slug: "deteccion-de-necesidades-de-capacitacion",
    titulo: "DNC · Detección de necesidades",
    resumen: "Dejar de comprar cursos por corazonada.",
    descripcion:
      "Cómo se detecta la brecha real entre lo que el puesto exige y lo que la persona hace, y cómo se convierte en un plan anual de capacitación defendible.",
    categoria: "ige-diagnostico",
    nivel: "intermedio",
    horas: 6,
    imagen: FOTO.dupla,
    orden: 4,
  },

  // ---------- Grabado · Manejo de conflictos ----------
  {
    id: "ige-campo-de-fuerzas",
    slug: "campo-de-fuerzas",
    titulo: "Campo de fuerzas",
    resumen: "Qué empuja el cambio y qué lo está frenando.",
    descripcion:
      "El método de Lewin aplicado a una decisión real: listar fuerzas, pesarlas y trabajar primero las que detienen, que suelen ser más baratas de mover.",
    categoria: "ige-conflictos",
    nivel: "intermedio",
    horas: 4,
    imagen: FOTO.circulo,
    orden: 1,
  },
  {
    id: "ige-metodo-tkj",
    slug: "metodo-tkj",
    titulo: "Método TKJ",
    resumen: "Ordenar el problema cuando cada quien ve uno distinto.",
    descripcion:
      "Técnica japonesa para recoger hechos de todo el grupo, agruparlos y llegar a una definición del problema que el equipo reconozca como propia.",
    categoria: "ige-conflictos",
    nivel: "intermedio",
    horas: 4,
    imagen: FOTO.pizarra,
    orden: 2,
  },
  {
    id: "ige-marco-logico",
    slug: "metodo-del-marco-logico",
    titulo: "Método del marco lógico",
    resumen: "Del árbol de problemas al proyecto que sí se puede evaluar.",
    descripcion:
      "Causas, efectos, objetivos e indicadores en una sola matriz. El estándar con el que se presentan proyectos en el sector público.",
    categoria: "ige-conflictos",
    nivel: "avanzado",
    horas: 6,
    imagen: FOTO.acuerdo,
    orden: 3,
  },
];

/** Minutos que guarda la base a partir de las horas del temario. */
export function minutosDe(curso: CursoIge) {
  return curso.horas * 60;
}

/** Cómo se cursa, en el vocabulario de la base (`courses.modalidad`). */
export function modalidadDe(formato: FormatoIge) {
  return formato === "vivo" ? ("mixta" as const) : ("online" as const);
}

export function categoriaDe(id: string) {
  return CATEGORIAS_IGE.find((c) => c.id === id);
}
