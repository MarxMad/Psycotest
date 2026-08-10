/**
 * Textos de interpretación de los tres axiogramas del Inventario Hartman.
 * Transcritos de `Plantillas Hartman.docx`.
 *
 * El mismo indicador significa cosas distintas según el axiograma: DIM I en el
 * mundo externo es el juicio sobre los demás; en el consigo mismo, el juicio
 * sobre la propia individualidad. Por eso las reglas de interpretación se
 * indexan por (axiograma, indicador, nivel) y no solo por indicador.
 */

export type Axiograma = "externo" | "propio" | "sumario";

export interface Indicador {
  /** Clave usada por el motor de calificación. */
  clave: string;
  /** Etiqueta tal como aparece en el axiograma. */
  sigla: string;
  texto: string;
}

export const AXIOGRAMAS: Record<Axiograma, { titulo: string; indicadores: Indicador[] }> = {
  externo: {
    titulo: "Valoración con el mundo externo",
    indicadores: [
      { clave: "DIF", sigla: "DIF", texto: "Es la capacidad de juicio en general. Es la capacidad para medir los tres aspectos valorativos: el personal, el práctico y el abstracto, con el mundo que nos rodea." },
      { clave: "DIM_I", sigla: "DIM I", texto: "El juicio de la individualidad y el mundo propio de los demás." },
      { clave: "DIM_E", sigla: "DIM E", texto: "El juicio de las circunstancias prácticas concretas y materiales, y lo tangible de las cosas y objetivos." },
      { clave: "DIM_S", sigla: "DIM S", texto: "Juicio de conceptos, reglas, teorías, la lógica, el aspecto legal, matemáticas, las ideas abstractas en general." },
      { clave: "DIM", sigla: "DIM", texto: "La capacidad para mantener el sentido de proporción al hacer juicios en las tres dimensiones valorativas." },
      { clave: "DIM_PCT", sigla: "DIM %", texto: "La capacidad para aceptar el mundo que nos rodea tal como es. La conciencia de la realidad del mundo externo." },
      { clave: "INT_I", sigla: "INT I", texto: "La capacidad para resolver problemas y tomar decisiones concernientes al aspecto personal y espiritual de otras personas, a su riqueza interior; la capacidad para ayudar a otros a resolver sus problemas." },
      { clave: "INT_E", sigla: "INT E", texto: "La capacidad para resolver problemas y tomar decisiones concernientes a las circunstancias prácticas de todos los días, acerca de cosas y objetos." },
      { clave: "INT_S", sigla: "INT S", texto: "La capacidad para resolver problemas y tomar decisiones concernientes a abstracciones creadas en el medio ambiente. La capacidad para discernir lo relevante de una situación compleja." },
      { clave: "INT", sigla: "INT", texto: "La capacidad general para resolver problemas y tomar decisiones al evaluar situaciones problema creadas en el medio ambiente. La capacidad para discernir lo relevante de una situación compleja." },
      { clave: "INT_PCT", sigla: "INT %", texto: "La capacidad para organizar y controlar las relaciones emocionales al enfrentarse a los problemas del mundo externo." },
      { clave: "DI", sigla: "DI", texto: "La capacidad para concentrarse al resolver problemas concernientes al mundo externo." },
      { clave: "DIS", sigla: "DIS", texto: "La capacidad para distinguir entre el bien y el mal." },
      { clave: "AI_PCT", sigla: "AI %", texto: "La capacidad para presentar una actitud positiva, abierta y dinámica en la interacción con el mundo externo." },
    ],
  },

  propio: {
    titulo: "Valoraciones consigo mismo",
    indicadores: [
      { clave: "DIF", sigla: "DIF", texto: "La capacidad para juzgarse a sí mismo: la capacidad propia para medir los tres aspectos valorativos en nosotros mismos, el personal, el práctico y el abstracto." },
      { clave: "DIM_I", sigla: "DIM I", texto: "Juicios de la individualidad y unidad de nosotros mismos. La riqueza personal de cada uno de sí mismo. Conocimiento y aceptación del yo." },
      { clave: "DIM_E", sigla: "DIM E", texto: "Juicio de nuestro rol o papel en el mundo: cómo se clasifica uno mismo como trabajador, miembro de una sociedad o institución del mundo en general." },
      { clave: "DIM_S", sigla: "DIM S", texto: "Juicio de la capacidad para organizarse y disciplinarse a sí mismo, alcanzar metas y tener ideales para el propio desarrollo." },
      { clave: "DIM", sigla: "DIM", texto: "La capacidad para mantener el sentido de proporción al hacer juicios en los tres aspectos valorativos." },
      { clave: "DIM_PCT", sigla: "DIM %", texto: "La capacidad para aceptarnos tal como somos. La conciencia de la realidad de nosotros mismos." },
      { clave: "INT_I", sigla: "INT I", texto: "La capacidad para resolver problemas y tomar decisiones referentes a nosotros mismos. La capacidad para resolver nuestros propios problemas." },
      { clave: "INT_E", sigla: "INT E", texto: "La capacidad para resolver problemas y tomar decisiones referentes a nuestro papel en el mundo, a cómo nos clasificamos como miembros de la institución social del mundo, referentes a nuestras funciones." },
      { clave: "INT_S", sigla: "INT S", texto: "La capacidad para resolver problemas y tomar decisiones concernientes a nuestra autoorganización y autodisciplina. El logro de las metas propias a corto y largo plazo, referentes a nuestros ideales y propio desarrollo." },
      { clave: "INT", sigla: "INT", texto: "La capacidad general para resolver problemas y tomar decisiones acerca de nosotros mismos, para ver lo relevante dentro de lo complejo consigo mismo." },
      { clave: "INT_PCT", sigla: "INT %", texto: "La capacidad para controlar y disciplinar nuestras reacciones emotivas al enfrentarnos a problemas personales." },
      { clave: "DI", sigla: "DI", texto: "Es la capacidad de concentración al resolver los propios problemas." },
      { clave: "DIS", sigla: "DIS", texto: "La capacidad para distinguir entre el bien y el mal con nosotros mismos." },
      { clave: "AI_PCT", sigla: "AI %", texto: "La capacidad para una actitud positiva, dinámica y abierta hacia uno mismo." },
    ],
  },

  sumario: {
    titulo: "Sumario de conclusiones",
    indicadores: [
      { clave: "DIF_1_2", sigla: "DIF 1 / DIF 2", texto: "La madurez se obtiene en la medida en que se hace uso de la actual capacidad relativa en comparación con el potencial total." },
      { clave: "BQr_1", sigla: "BQr 1", texto: "Es el balance entre las capacidades para valorar tanto el mundo externo como el propio." },
      { clave: "BQa_1", sigla: "BQa 1", texto: "Es la propia capacidad para valorar, según es medida por la escala axiológica de valores." },
      { clave: "CQ_1", sigla: "CQ 1", texto: "Las capacidades combinadas para valorar tanto el mundo externo como el interno, medidas por la escala de valores fijada por el sujeto al tomar la prueba." },
    ],
  },
};

/**
 * En el original, el texto de DIS del axiograma del mundo externo repite
 * literalmente el del axiograma consigo mismo («…con nosotros mismos»).
 * Aquí se dejó sin ese cierre a la espera de que el psicólogo confirme
 * la redacción correcta para el mundo externo.
 */
export const REVISAR = ["externo.DIS"];
