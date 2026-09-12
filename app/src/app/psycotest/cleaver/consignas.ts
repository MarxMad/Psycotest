/**
 * Consignas de la Autodescripción Cleaver (Self Description).
 * Fuente: Manual Cleaver + Hoja de calificación (Autodescripción).
 */

export interface Consigna {
  titulo: string;
  cuerpo: string[];
}

export const CONSIGNAS: Consigna[] = [
  {
    titulo: "Qué es",
    cuerpo: [
      "Es un inventario de autodescripción basado en cuatro factores de conducta (D, I, S, C). No hay respuestas correctas o incorrectas.",
    ],
  },
  {
    titulo: "Cómo responder cada serie",
    cuerpo: [
      "Se le presentarán 24 series de cuatro adjetivos. En cada serie elija exactamente dos palabras:",
      "MÁS — la que mejor lo describe.",
      "MENOS — la que menos lo describe.",
    ],
  },
  {
    titulo: "Reglas",
    cuerpo: [
      "No puede marcar el mismo adjetivo como MÁS y MENOS.",
      "Debe dejar sin marcar los otros dos adjetivos de la serie.",
      "Conteste de forma espontánea, pensando en usted en el trabajo.",
    ],
  },
  {
    titulo: "Tiempo",
    cuerpo: [
      "No hay límite de tiempo. Por término medio se tardan entre 10 y 15 minutos.",
    ],
  },
];
