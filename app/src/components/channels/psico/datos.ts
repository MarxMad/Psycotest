/**
 * Cómo se presenta cada instrumento en la portada: su color, una muestra de
 * lo que ve el candidato y los ejes del informe.
 *
 * Las muestras son ilustrativas —escritas para la portada—, no reactivos de
 * las pruebas: esos no se publican.
 */

export type Presentacion = {
  /** Fondo pastel y tinta que contrasta sobre él. */
  fondo: string;
  tinta: string;
  muestra: { instruccion: string; opciones: string[] };
  /** Ejes que aparecen en el informe. */
  ejes: string[];
  entrega: string;
  para: string;
};

export const PRESENTACION: Record<string, Presentacion> = {
  papi: {
    fondo: "#d4e4d6",
    tinta: "#163f33",
    muestra: {
      instruccion: "Elige la frase que más se parece a ti",
      opciones: [
        "Me gusta terminar lo que empiezo antes de pasar a otra cosa.",
        "Prefiero tener varios pendientes en marcha a la vez.",
      ],
    },
    ejes: ["Iniciativa", "Trato", "Orden", "Liderazgo", "Presión"],
    entrega: "Perfil de rasgos e interpretación",
    para: "Todos los puestos",
  },
  hartman: {
    fondo: "#e0d7f0",
    tinta: "#35285e",
    muestra: {
      instruccion: "Ordena de lo que más a lo que menos valoras",
      opciones: ["Un buen equipo", "Un plan claro", "Aprender algo nuevo", "Reconocimiento"],
    },
    ejes: ["Empatía", "Juicio práctico", "Autoestima", "Sentido de rol", "Autodirección"],
    entrega: "Mapa de valores y motivación",
    para: "Cultura y permanencia",
  },
  mabe: {
    fondo: "#f6e6a8",
    tinta: "#4f3c0c",
    muestra: {
      instruccion: "Un cliente pide algo fuera de la política. ¿Qué haces primero?",
      opciones: ["Consulto la política", "Pregunto qué necesita", "Lo escalo a mi jefe"],
    },
    ejes: ["Información", "Riesgo", "Consistencia", "Rapidez", "Criterio"],
    entrega: "Estilo de decisión y su consistencia",
    para: "Puestos con autonomía",
  },
  cleaver: {
    fondo: "#d3e5f2",
    tinta: "#173b5e",
    muestra: {
      instruccion: "Marca la palabra que MÁS y la que MENOS te describe",
      opciones: ["Decidido", "Persuasivo", "Paciente", "Preciso"],
    },
    ejes: ["Empuje", "Influencia", "Constancia", "Apego a normas", "Ajuste"],
    entrega: "Ajuste persona–puesto con brechas",
    para: "Contra el perfil del puesto",
  },
  gerenciales: {
    fondo: "#f6d5c3",
    tinta: "#5f2b15",
    muestra: {
      instruccion: "Tu equipo no llegó a la meta del mes. Lo primero que haces es…",
      opciones: ["Reviso el plan con ellos", "Redistribuyo el trabajo", "Hablo uno a uno"],
    },
    ejes: ["Dirigir", "Delegar", "Persuadir", "Participar", "Seguimiento"],
    entrega: "Estilo de conducción de equipos",
    para: "Mandos medios y jefaturas",
  },
  socioeconomico: {
    fondo: "#ebdfcb",
    tinta: "#47361f",
    muestra: {
      instruccion: "Datos del hogar",
      opciones: ["Personas que viven en el domicilio", "Vivienda: propia · rentada · familiar"],
    },
    ejes: ["Economía", "Vivienda", "Referencias", "Documentos", "Dictamen"],
    entrega: "Visita, referencias y dictamen",
    para: "Puestos de confianza",
  },
};

/** Valores de muestra para las barras del informe ilustrativo. */
export const BARRAS = [0.82, 0.58, 0.74, 0.46, 0.67];
