/**
 * Consignas de aplicación del Inventario de Valores Hartman.
 * Transcritas de `Plantillas Hartman.docx`.
 *
 * Las dos partes tienen instrucciones distintas y no son intercambiables:
 * la Parte I ordena por bondad y maldad; la Parte II, por grado de acuerdo.
 */

export interface Consigna {
  titulo: string;
  cuerpo: string[];
}

export const PARTE_I: Consigna[] = [
  {
    titulo: "Qué se le presenta",
    cuerpo: [
      "Encontrará 18 frases. Cada una representa algo a lo cual una persona puede asignarle diferentes «valores» —bueno o malo— dependiendo de sus propias consideraciones acerca de cuán bueno o malo es.",
      "Lea cuidadosamente todas las frases. Si hay alguna palabra que no entienda, pregunte por su significado.",
    ],
  },
  {
    titulo: "Cómo ordenarlas",
    cuerpo: [
      "Asigne el número 1 a la frase que, en su opinión, representa el valor más alto: la que usted considera que expresa el mejor valor.",
      "El número 2 corresponde a la que le sigue en valor, y así sucesivamente en sentido descendente, usando un número diferente para cada una de las 18 frases, hasta llegar al 18, que deberá presentar aquella que usted considera que expresa lo peor.",
    ],
  },
  {
    titulo: "El criterio",
    cuerpo: [
      "No juzgue las frases por su importancia, sino por la bondad y maldad que contienen.",
    ],
  },
  {
    titulo: "Tiempo y cuidado",
    cuerpo: [
      "Concéntrese en su tarea. Decida rápidamente qué número le va a asignar a cada frase. No hay tiempo límite, pero la mayoría de la gente puede enumerar todas estas frases en 10 minutos.",
      "No deje de calificar ninguna de las frases. Tenga cuidado de que cada número aparezca una sola vez.",
    ],
  },
];

export const PARTE_II: Consigna[] = [
  {
    titulo: "Qué se le presenta",
    cuerpo: [
      "Encontrará 18 citas. Cada una concierne algo sobre lo cual una persona puede asignar diferentes «valores» —bueno o malo— dependiendo de en qué grado esté de acuerdo o en desacuerdo con lo que dice la cita.",
      "Lea cuidadosamente todas las citas. Si hay alguna palabra que no entienda, pregunte por su significado.",
    ],
  },
  {
    titulo: "Qué significa «mi trabajo»",
    cuerpo: [
      "La frase «mi trabajo» no se refiere a ningún trabajo específico, sino a aquello que usted hace actualmente: su ocupación presente o la clase de trabajo que desempeña.",
      "Si no tiene un trabajo fijo, puede sustituir «mi trabajo» por «lo que estoy haciendo».",
    ],
  },
  {
    titulo: "Cómo ordenarlas",
    cuerpo: [
      "Asigne el número 1 a la cita con la que usted está más de acuerdo, o sea aquella que representa lo más importante para usted en su vida.",
      "El número 2 corresponde a la que considera en segundo término, y así sucesivamente hasta llegar a aquella con la que está más en desacuerdo, la que representa el menor valor para usted, a la que asignará el número 18.",
    ],
  },
  {
    titulo: "Tiempo y cuidado",
    cuerpo: [
      "Concéntrese en su tarea. Decida rápidamente qué número le va a asignar a cada una de las citas. No hay tiempo límite, pero la mayoría de la gente puede enumerarlas en unos 10 minutos.",
      "No deje de calificar ninguna de las citas. Tenga cuidado de que cada número aparezca una sola vez.",
    ],
  },
];
