/**
 * Consignas de realización del PAPI.
 *
 * Transcritas de `Prueba PAPI.docx`, sección «EL PAPI: SU APLICACIÓN →
 * 1. CONSIGNAS DE REALIZACIÓN», y del apartado INSTRUCCIONES del cuadernillo.
 *
 * Se omiten únicamente las indicaciones propias del papel — rodear la flecha
 * en la hoja de respuestas, no escribir en el cuadernillo, hacer coincidir la
 * hoja al voltear la página — porque en pantalla no aplican. El contenido
 * sustantivo se conserva literal.
 */

export interface Consigna {
  titulo: string;
  cuerpo: string[];
}

export const CONSIGNAS: Consigna[] = [
  {
    titulo: "Qué es",
    cuerpo: [
      "No se trata tanto de un test como de un cuestionario de preferencias, cuyas respuestas determinarán una entrevista que se llevará a cabo inmediatamente después.",
    ],
  },
  {
    titulo: "Desde dónde responder",
    cuerpo: [
      "Conteste situándose en un contexto profesional: imagínese en su puesto de trabajo.",
    ],
  },
  {
    titulo: "La elección es obligatoria",
    cuerpo: [
      "Se le van a presentar 90 parejas de afirmaciones. Ante cada pareja debe elegir una y sólo una: la que mejor se corresponda con usted.",
      "A veces tendrá la impresión de que ninguna refleja esa afinidad o, al contrario, de que ambas lo hacen. En todo caso debe optar por una de las dos.",
    ],
  },
  {
    titulo: "Son elecciones relativas",
    cuerpo: [
      "Si ambas frases le parecen verdaderas, elija la que más se aproxime a su manera de ser.",
      "Si las dos le parecen falsas, opte por la que menos se aparta de su manera de ser.",
    ],
  },
  {
    titulo: "No busque coherencia",
    cuerpo: [
      "Cada pareja de frases es única. Si se le pide elegir entre el amarillo y el verde, y usted elige el amarillo, y más adelante se le pide elegir entre el amarillo y el rojo, no se crea obligado a escoger de nuevo el amarillo para ser coherente: se trata de una comparación diferente.",
      "Este es el principio general del cuestionario.",
    ],
  },
  {
    titulo: "Tiempo",
    cuerpo: [
      "No existe tiempo límite. Por término medio se tardan entre 10 y 15 minutos. Conteste rápidamente, con sinceridad y de la forma más espontánea posible.",
    ],
  },
  {
    titulo: "Por qué no conviene exagerar",
    cuerpo: [
      "Al final del cuestionario todo el mundo tendrá 90 puntos, distribuidos de distinta manera según sus preferencias profesionales.",
      "Si pretende exagerar alguno de los criterios, lo que hace es inventarse supuestas cualidades, pero también supuestos defectos: los puntos que sume en una pregunta se le restarán de otra. El perfil quedará desequilibrado y acabará usted por no reconocerse en el comentario final.",
    ],
  },
];
