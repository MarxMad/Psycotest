/**
 * LIFO® — Orientaciones de Vida (Estilos de Vida y Trabajo).
 *
 * Fuentes del cliente:
 *   · LIFO HOJA DE RESPUESTAS.docx — los 72 términos en 18 grupos de cuatro.
 *   · TABLA CALIF OK LIFO.docx — la hoja de calificación (A…L → Da/Ap, Tm/Ct,
 *     Mt/Cs, Ad/Nc; condiciones habituales y de estrés, cada una suma 90).
 *   · MANUAL OK LIFO DE APOYO 26.docx — la guía de interpretación (§6).
 *   · RESULTADOS LIFO.docx — el formato del informe.
 *
 * Este archivo es solo contenido: la calificación vive en src/lib/lifo.ts.
 * Las erratas evidentes del original se corrigieron; el sentido no se tocó.
 */

export type EstiloLifo = "da" | "tc" | "mc" | "an";

/** El orden de la hoja de calificación: columna 1 a 4. */
export const ESTILOS_LIFO: EstiloLifo[] = ["da", "tc", "mc", "an"];

export type GrupoLifo = {
  /** 1–18 */
  id: number;
  enunciado: string;
  /** Cuatro términos en el orden de la hoja: Da/Ap, Tm/Ct, Mt/Cs, Ad/Nc. */
  terminos: [string, string, string, string];
};

/**
 * Los 18 grupos. El ítem n (1–72) es el término (n−1) % 4 del grupo
 * ⌈n/4⌉, y su posición dentro del grupo es el estilo que puntúa.
 */
export const GRUPOS_LIFO: GrupoLifo[] = [
  {
    id: 1,
    enunciado: "Me siento más alegre conmigo cuando:",
    terminos: [
      "Actúo con idealismo y optimismo.",
      "Veo una oportunidad de liderazgo y voy tras ella.",
      "Busco mi propio interés y dejo que los demás busquen el suyo.",
      "Me adapto al grupo en el cual me encuentro.",
    ],
  },
  {
    id: 2,
    enunciado: "Soy sumamente capaz de tratar a otras personas de manera:",
    terminos: [
      "Respetuosa, cortés y con admiración.",
      "Activa, enérgica y con seguridad.",
      "Cuidadosa, reservada y con tranquilidad.",
      "Amable, social y amistosa.",
    ],
  },
  {
    id: 3,
    enunciado: "Hago sentir en los otros:",
    terminos: [
      "Ser bien considerados, capaces y dignos de que se les pida un consejo.",
      "Interés y entusiasmo por asociarse conmigo en lo que deseo hacer.",
      "Que son tratados con justicia, respeto y apreciando la consideración que se les ejerce.",
      "Estar satisfechos, impresionados conmigo y deseosos de tenerme cerca.",
    ],
  },
  {
    id: 4,
    enunciado: "En un desacuerdo con otra persona me va mejor si:",
    terminos: [
      "Me fío del sentido de justicia de la otra persona.",
      "Trato de manejarla por medio de mi astucia y superioridad táctica.",
      "Permanezco ecuánime, metódico e inalterable.",
      "Soy flexible y me adapto a la otra persona.",
    ],
  },
  {
    id: 5,
    enunciado: "En mis relaciones con los demás puedo:",
    terminos: [
      "Volverme confidente y dar mi confianza aun a quienes no parecen buscarla.",
      "Volverme agresivo y aprovecharme de los otros, antes de que se den cuenta de que no he sido muy considerado con ellos.",
      "Volverme suspicaz y prudente, y tratarlos con demasiada reserva.",
      "Volverme demasiado relacionista y ubicarme en medio de la gente, aun cuando no haya recibido invitación.",
    ],
  },
  {
    id: 6,
    enunciado: "Impresiono a los demás al ser:",
    terminos: [
      "Una persona ingenua que tiene poca iniciativa y confianza en sí misma.",
      "Un «agudo corredor de bolsa» que siempre trata de sacar el mejor partido posible de la ganga.",
      "Un individuo obstinado que es frío con los demás.",
      "Una persona inconsistente que nunca toma una verdadera posición personal.",
    ],
  },
  {
    id: 7,
    enunciado: "Siento que puedo inducir a la gente siendo:",
    terminos: [
      "Modesto e idealista.",
      "Persuasivo y triunfante.",
      "Paciente y práctico.",
      "Entretenido y animado.",
    ],
  },
  {
    id: 8,
    enunciado: "En mis relaciones con los demás soy sumamente capaz por tener:",
    terminos: [
      "Actitud creíble, confiable y de apoyo para otras personas.",
      "Rapidez para desarrollar ideas útiles y organizar a los demás para que las lleven a cabo.",
      "Sentido práctico, lógico y cuidadoso en saber con quién estoy tratando.",
      "Interés en saber todo acerca de ellos y preocupación por ajustarme a lo que esperan de mí.",
    ],
  },
  {
    id: 9,
    enunciado: "Siento suma satisfacción cuando los demás me ven como:",
    terminos: [
      "Una persona amigable, leal y de confianza.",
      "Una persona que puede tomar ideas y ponerlas en práctica.",
      "Una persona práctica y que piensa por sí misma.",
      "Una persona digna de atención y significado.",
    ],
  },
  {
    id: 10,
    enunciado: "Si no obtengo lo que quiero de una persona tiendo a:",
    terminos: [
      "Rendirme de buena gana y justificar la inhabilidad de la otra persona para hacer lo mismo.",
      "Reclamar mis derechos y tratar de persuadirla para que lo haga de todas maneras.",
      "Sentirme indiferente y encontrar otra manera de conseguir lo que quiero.",
      "Tomármelo en broma y ser flexible acerca del problema.",
    ],
  },
  {
    id: 11,
    enunciado: "Ante el fracaso siento que lo mejor es:",
    terminos: [
      "Acudir a otros y confiar en su ayuda.",
      "Pelear por mis derechos y tomar lo que realmente merezco.",
      "Mantener lo que ya tengo y desentenderme de los demás.",
      "Conservar la imagen y tratar de venderme al mejor precio posible.",
    ],
  },
  {
    id: 12,
    enunciado: "Temo que a veces los demás pueden verme como una persona:",
    terminos: [
      "Sometida e impresionable.",
      "Agresiva y arrogante.",
      "Fría y obstinada.",
      "Superficial y en busca de atención.",
    ],
  },
  {
    id: 13,
    enunciado: "El mejor modo de triunfar en la vida es:",
    terminos: [
      "Ser una persona digna de recompensa y confiar en quienes tienen autoridad para reconocer mi valor.",
      "Trabajar para establecer un derecho de avanzar, y luego reclamarlo.",
      "Preservar lo que ya tengo y construir sobre ello.",
      "Desarrollar una personalidad triunfante que llame la atención de los demás.",
    ],
  },
  {
    id: 14,
    enunciado: "Al trabajar con una persona difícil:",
    terminos: [
      "Averiguo con otros cómo han resuelto el problema y sigo sus consejos.",
      "Llego a un acuerdo con la persona y sigo junto a ella del mejor modo posible.",
      "Decido por mí lo que es correcto y mantengo mis propias convicciones.",
      "Modifico la forma de adaptarme a la otra persona y hacer la relación más armónica.",
    ],
  },
  {
    id: 15,
    enunciado: "Impresiono a los demás al ser:",
    terminos: [
      "Una persona confiada que aprecia, ayuda y aconseja.",
      "Una persona con seguridad en sí misma, que toma la iniciativa y hace trabajar a la gente.",
      "Una persona estable que trata a los demás de una manera conservadora.",
      "Una persona entusiasta que puede congeniar con casi todo el mundo.",
    ],
  },
  {
    id: 16,
    enunciado: "Siento que en el último análisis es mejor:",
    terminos: [
      "Simplemente aceptar la derrota y buscar lo que deseo en alguna otra parte.",
      "Empeñarme en una lucha de estrategias, antes que perder y no obtener nada.",
      "Ser suspicaz y posesivo antes que renunciar a lo que ya tengo.",
      "Transigir y continuar por el momento.",
    ],
  },
  {
    id: 17,
    enunciado: "A veces puedo ser un individuo:",
    terminos: [
      "Fácilmente influenciable y carente de seguridad.",
      "Agresivo, ambicioso y arrogante.",
      "Desconfiado, frío y crítico.",
      "Infantil y que tiende a tratar de ser la estrella del espectáculo.",
    ],
  },
  {
    id: 18,
    enunciado: "A veces puedo hacer que los demás se sientan:",
    terminos: [
      "Superiores y condescendientes conmigo.",
      "Utilizados por mí y enojados conmigo.",
      "Injustamente tratados y fríos hacia mí.",
      "Impacientes e indiferentes hacia mí.",
    ],
  },
];

/** El ejemplo de práctica de la hoja de respuestas. No se califica. */
export const EJEMPLO_LIFO: Omit<GrupoLifo, "id"> = {
  enunciado: "Casi siempre soy:",
  terminos: [
    "Benévolo, agradable y útil.",
    "Productivo y lleno de planes.",
    "Económico y cuidadoso.",
    "Encantador y popular.",
  ],
};

export type ListaFuerzaExceso = { fuerza: string[]; exceso: string[] };

export type DescripcionEstilo = {
  nombre: string;
  sigla: string;
  orientacion: string;
  meta: string;
  /** §6.1 — términos descriptivos: [uso productivo, posible exceso]. */
  terminos: [string, string][];
  habituales: ListaFuerzaExceso;
  lucha: ListaFuerzaExceso;
  tension: ListaFuerzaExceso;
  /** §6.2 — estilos LIFO y reacciones al cambio. */
  cambio: {
    primeraReaccion: string;
    fuerza: string;
    factoresDePeso: string;
    dificultades: string;
    transicion: string;
    facilitan: string;
    estiloDirectivo: string;
  };
  /** §6.3 — manejo del tiempo. */
  tiempo: {
    usoProductivo: string;
    trampa: string;
    preocupacion: string;
    sintomas: string;
    compensacion: string;
    frase: string;
  };
  /** §6.4 — comunicación e influencia personal. */
  comunicacion: {
    comoComunicarse: string;
    mejorAmbiente: string;
    peorAmbiente: string;
    jefeEfectivo: string;
    empleadoEfectivo: string;
  };
  /** §6.5 — expresión de diferencias individuales. */
  expresion: {
    ayuda: string;
    control: string;
    analisis: string;
    compromiso: string;
    plan: string;
    riesgo: string;
    liderazgo: string;
  };
  /** §6.6 — cómo ayudar a superar los excesos, y qué necesita. */
  superarExcesos: string;
  necesidades: string;
};

export const ESTILOS: Record<EstiloLifo, DescripcionEstilo> = {
  da: {
    nombre: "Da y Apoya",
    sigla: "Da/Ap",
    orientacion:
      "Siendo sensible a las necesidades de los demás, persiguiendo la excelencia y sus altos ideales, su rectitud y escrupulosidad serán apreciadas y gozará de sus buenas consecuencias.",
    meta: "Ser visto como una persona sensible y de valer.",
    terminos: [
      ["Considerado", "Se niega a sí mismo"],
      ["Idealista", "No práctico"],
      ["Modesto", "Se autodesvaloriza"],
      ["Da confianza", "Ingenuo"],
      ["Leal", "Obligado"],
      ["Da apoyo", "Paternal"],
      ["Receptivo", "Pasivo"],
      ["Responde al pedido", "Demasiado comprometido"],
      ["Busca la excelencia", "Perfeccionista"],
      ["Cooperativo", "Fácilmente influenciable"],
    ],
    habituales: {
      fuerza: [
        "Necesita sentir que está trabajando en el mejor proyecto, el más relevante.",
        "Le gusta realizarse haciendo algo que beneficie a los demás.",
        "Deseoso de confiar en lo que dicen los demás sin ponerlo en duda.",
        "Indulgente con los demás y defiende sus derechos.",
        "Permite a los demás sentir que tienen un papel importante en la determinación de lo que ocurre.",
      ],
      exceso: [
        "Se niega a trabajar en proyectos de menor relevancia o propósito.",
        "Puede dejarse envolver demasiado en los problemas de los demás y ser incapaz de decir «no».",
        "Fácil de manipular; termina desilusionándose de la gente.",
        "Sobreprotector y demasiado identificado con los intereses de otros.",
        "Puede ser demasiado sensible a la dirección de otros y serle difícil iniciar acciones.",
      ],
    },
    lucha: {
      fuerza: [
        "Deseoso de oír la posición de los demás.",
        "Acepta y trata de resolver quejas legítimas.",
        "Deseoso de extenderse y de hacer lo que es justo por los otros.",
        "Altamente dedicado a reducir el conflicto y establecer cooperación.",
        "Ejerce influencia en la oposición a través de enunciados de principio y justicia.",
      ],
      exceso: [
        "Puede identificarse demasiado con los objetivos ajenos y olvidarse de los propios.",
        "Puede llegar a aceptar exigencias no razonables.",
        "Se vuelve demasiado abnegado y hace demasiadas concesiones.",
        "Se rinde a la oposición por evitar ser visto como no cooperativo.",
        "Moralista; expresa sentido de injusticia perpetrada en su contra.",
      ],
    },
    tension: {
      fuerza: [
        "Deseoso de asumir la responsabilidad y tratar otra vez.",
        "Optimista, con esperanza de que todo se resolverá en su debida forma.",
        "Deseoso de usar otras personas y otros recursos para resolver presiones.",
      ],
      exceso: [
        "Se vuelve crítico consigo mismo y con los demás cuando no puede lograr lo imposible.",
        "Carece de percepción de los peligros involucrados en la situación.",
        "Excesiva confianza en los demás cuando se siente inseguro.",
      ],
    },
    cambio: {
      primeraReaccion:
        "Dubitativo. Debe ver el propósito y el beneficio. Acepta si es promovido por alguien en quien confía.",
      fuerza: "Cooperación, lealtad, orientación a metas.",
      factoresDePeso: "Que quien lo inicia se integre con sus valores; consistente con sus estándares.",
      dificultades: "Trata, pero se desanima.",
      transicion: "Vacilación.",
      facilitan:
        "Participación en el grupo; planificación, establecer metas, compartir sentimientos; consistencia con ideales y estándares. «No perjudica a nadie, es una extensión de aquello en lo que creemos, nos ayudará a ser mejores personas».",
      estiloDirectivo:
        "Se apoya fuertemente en las ideas de los consejeros más influyentes y de la gente a quien afecta. Le gusta delegar responsabilidad.",
    },
    tiempo: {
      usoProductivo:
        "Trabajando con otros, ayudando, reasegurando, buscando excelencia, haciendo lo más relevante, lo mejor.",
      trampa: "Decir «sí» a demasiada gente, no ordenar pedidos por prioridad, buscar la perfección.",
      preocupacion: "Perder la oportunidad de ser apreciado; no ser parte de proyectos importantes.",
      sintomas:
        "Deprimido por expectativas no cumplidas; crítico consigo mismo y con otros; «rescatando» a medio mundo.",
      compensacion: "Mi misión (cierre la puerta).",
      frase: "Esto es lo que yo necesito.",
    },
    comunicacion: {
      comoComunicarse:
        "Enfatice causas valederas. Apele al idealismo. Pida su ayuda. Apele a la excelencia. Muestre interés y preocupación. Enfatice el desarrollo personal.",
      mejorAmbiente: "Respeto, apoyo, reafirmación, idealismo.",
      peorAmbiente: "Traición, crítica personal, ridículo, fracaso, falta de apoyo.",
      jefeEfectivo:
        "Dé reconocimiento, confianza y gratitud. Defina las metas conjuntamente. Sea accesible. Trate de compartir. Sea confiable.",
      empleadoEfectivo:
        "Demuestre que vale. Muestre lealtad. Sea sincero y orientado al equipo de trabajo.",
    },
    expresion: {
      ayuda:
        "Cuando se le solicita. No es directivo. Está disponible: «estoy aquí si se me necesita». Alienta y anima.",
      control:
        "Altos estándares para los demás, a través de ser necesario. Haciendo lo apropiado y proveyendo lo mejor.",
      analisis: "Compara con un modelo ideal. Persigue la calidad. Verifica la importancia.",
      compromiso:
        "El compromiso debe ser consistente con los principios. Responde a las necesidades de los demás. Busca una solución integrada. Desea el resultado «correcto».",
      plan: "Prefiere planear en grupo. Enfoque centrado en metas. Busca el mejor enfoque. Delega con altas expectativas puestas en la otra persona.",
      riesgo:
        "Se pronuncia públicamente en cuestiones de principios. Tiene confianza en otros. Intercambia confidencias. Se compromete a responder a estándares elevados.",
      liderazgo: "Cooperativo y de participación. Solicita excelencia. Enfatiza la lealtad.",
    },
    superarExcesos:
      "Brinde apoyo, reafirmación y aliento. Dé auxilio y ayuda específica. Escuche atentamente a la persona. Provea justificaciones significativas dirigidas a la ansiedad, la queja o la preocupación. Reconozca el valor del intento aun cuando las consecuencias no hayan sido las deseadas. Sugiera modos en que la persona pueda compensar el error o recuperarse. No insista ni presione por respuestas retrasadas.",
    necesidades:
      "Ser visto como alguien adecuado y valioso. Sentirse apreciado, comprendido, aceptado y sujeto de confianza. Sentir que los ideales no están perdidos.",
  },

  tc: {
    nombre: "Toma y Controla",
    sigla: "Tm/Ct",
    orientacion:
      "Si quiere que las cosas sucedan, debe hacerlas ocurrir y debe convencer a los demás de que confíen en su competencia. No puede esperar que las cosas vengan por sí solas.",
    meta: "Ser visto como activo y competente.",
    terminos: [
      ["Controlador", "Dominante"],
      ["Rápido para actuar", "Impulsivo"],
      ["Confianza en sí mismo", "Arrogante"],
      ["Busca cambios", "Abandona lo viejo"],
      ["Persuasivo", "Distorsiona"],
      ["Intenso", "Coacciona"],
      ["Competitivo", "Rivalizador"],
      ["Toma riesgos", "Apuesta"],
      ["Persistente", "Pone presión"],
      ["Sentido de urgencia", "Impaciente"],
    ],
    habituales: {
      fuerza: [
        "Le gusta tener el control de la relación y determinar el curso de lo que ocurre.",
        "Actúa con rapidez y expresa un sentido de urgencia a los demás para que actúen ahora.",
        "Disfruta el desafío de situaciones y personas difíciles.",
        "Le gusta el paso rápido, la variedad, la novedad y los proyectos nuevos.",
        "Rápido para moverse, usar una oportunidad o crearla; prueba y presiona para llegar a la resistencia oculta.",
      ],
      exceso: [
        "Domina y elimina la expresión de datos importantes por parte de otros.",
        "Sacrifica pensamiento por acción y puede abrumar a los demás con un sentido de emergencia.",
        "Puede llegar a tomar un desafío por el desafío mismo, aun cuando no sea productivo.",
        "Puede no prestar suficiente atención al mantenimiento de viejos proyectos exitosos.",
        "Puede tratar de forzar la acción cuando no es necesaria; puede hacer sentir culpa a los demás.",
      ],
    },
    lucha: {
      fuerza: [
        "Expresa su posición con firmeza y convicción.",
        "Confronta el desacuerdo y estimula a los demás a ventilar el suyo.",
        "Rápido para proteger derechos e intereses contra la explotación.",
        "Es persistente con los otros y no ceja en sus esfuerzos hasta lograr que se tome una decisión clara y tajante.",
        "Rápido para convertir objeciones ajenas en ventajas propias.",
      ],
      exceso: [
        "Puede volverse arrogante y exigente, frustrando a otros.",
        "Puede exagerar el desacuerdo, haciendo difícil para los demás encontrar la solución.",
        "Demasiado alerta y dispuesto para el combate; hace que los demás se pongan a la defensiva.",
        "Puede presionar a los demás y no dejar lugar para reflexionar antes de tomar la decisión.",
        "Puede ofrecer respuestas demasiado simples a problemas complejos, apresuradamente.",
      ],
    },
    tension: {
      fuerza: [
        "Invierte grandes cantidades de energía en varias direcciones simultáneamente.",
        "Rápido para responder a emergencias y resolver problemas.",
        "Es capaz de hacer muchas cosas con poca ayuda; puede enfrentar el estrés.",
      ],
      exceso: [
        "Corre el riesgo de dispersar sus esfuerzos, extenuarse y perder efectividad.",
        "Responde sin verificar estrategias o sin aclarar con la autoridad.",
        "Puede no dejar que los demás actúen como fuente de consejo, como un recurso.",
      ],
    },
    cambio: {
      primeraReaccion:
        "Favorable si ve la ganancia, cuando es partícipe o cuando lo inicia. Puede resistir si no conviene a sus intereses.",
      fuerza: "Iniciativa, energía, deseo de experimentar.",
      factoresDePeso:
        "Que sea opcional; resultados personales; relevante en cuanto a tiempo; poder permanecer en control.",
      dificultades: "Persiste, pero pierde interés si no ve resultados pronto.",
      transicion: "Rápidas o ninguna.",
      facilitan:
        "Presentación dinámica. Planes que puedan implementarse con rapidez, acción bien definida, pasos delineados; que dé responsabilidad, obtenga resultados, cree una base de operaciones más promisoria y una ganancia mayor.",
      estiloDirectivo:
        "Utiliza las ideas de los otros y crea con ellas; retiene el poder para sí y se involucra directamente en lo que inicia.",
    },
    tiempo: {
      usoProductivo:
        "Cubriendo muchas tareas, generando nuevos enfoques, presionando para completar proyectos.",
      trampa: "Tratar de hacer demasiado, ver todo como urgente, actuar impulsivamente.",
      preocupacion: "Perder una oportunidad; no parecer competente.",
      sintomas:
        "Conductas alarmistas; salta de una tarea a otra; proyectos en diversos estados de avance.",
      compensacion: "Mi foco (concéntrese).",
      frase: "Esto es lo que haré hoy.",
    },
    comunicacion: {
      comoComunicarse:
        "Dé oportunidades. Dé más responsabilidad y recursos que faciliten el logro. Dé autoridad.",
      mejorAmbiente: "Competencia, trato directo, con riesgos, oportunidades.",
      peorAmbiente:
        "Sin recursos, autoridad bloqueada, responsabilidad disminuida, sin desafíos, imposibilidad de controlar los factores que influyen en los resultados.",
      jefeEfectivo:
        "Téngase confianza. Provea autonomía. Recompense los resultados. Fije límites firmes pero reconozca la iniciativa. Escuche, pero sea decidido. Luche, pero en igualdad de condiciones.",
      empleadoEfectivo: "Responda, no muestre indiferencia. Sea capaz, directo e independiente.",
    },
    expresion: {
      ayuda:
        "Ofrece consejo no solicitado. Da «recetas» o «fórmulas». Consejo centrado en la acción: «esto es lo que yo haría si estuviera en su lugar».",
      control: "Se hace cargo e inicia. Usa el control directo y la autoridad.",
      analisis: "Examina el impacto sobre el resultado. Selecciona datos que apoyen su propia posición.",
      compromiso:
        "Utiliza el trueque competitivamente. Soluciones tipo división del territorio. Le gusta la negociación difícil. Responde a pedidos de urgencia y oportunidad.",
      plan: "Planea sobre la marcha; sus planes son a corto plazo. Dinámico, rápido e informal. Visualiza etapas en términos de acciones.",
      riesgo:
        "Prefiere el error a la demora. Usa ensayo y error. Avanza decididamente en áreas inexploradas. Deposita su confianza en sí mismo. Confrontación y visibilidad.",
      liderazgo:
        "Directivo. Usa la autoridad. Organiza a los demás para que logren los resultados deseados. Entusiasta.",
    },
    superarExcesos:
      "Trate de responder rápidamente. Ofrezca soluciones, no traiga nuevos problemas. Sea sincero y firme, pero respetuoso. Refleje su comprensión por la preocupación. Haga preguntas para ayudar a la persona a sentir que ha encontrado su propia solución. Provea maneras alternativas de enfocar la situación. Espere a que baje la presión antes de exigir.",
    necesidades:
      "Ser visto como alguien poderoso, capaz y competente. Sentirse capaz de superar obstáculos. Sentir que aún hay otras oportunidades.",
  },

  mc: {
    nombre: "Mantiene y Conserva",
    sigla: "Mt/Cs",
    orientacion:
      "Tiene que conservar lo que ya tiene y usar los recursos existentes para construir el futuro sobre el pasado de una manera cuidadosa y racional.",
    meta: "Ser visto como objetivo y racional.",
    terminos: [
      ["Tenaz", "No puede parar"],
      ["Práctico", "No creativo"],
      ["Económico", "Avaro"],
      ["Reservado", "Inamistoso"],
      ["Fáctico", "Preso de los datos"],
      ["Firme", "Obstinado"],
      ["Prolijo", "Muy elaborado"],
      ["Metódico", "Rutinario"],
      ["Detallista", "Muy minucioso"],
      ["Analítico", "Crítico"],
    ],
    habituales: {
      fuerza: [
        "Se basa grandemente en datos, análisis y lógica para tomar decisiones.",
        "Delinea los varios aspectos de su posición y las opciones para los demás.",
        "Examina y estudia exhaustivamente las necesidades de las personas y la situación.",
        "Metódico; sigue procedimientos y estrategias en forma consistente.",
        "Le gusta trabajar con lo ya probado y conocido y aprovechar al máximo lo ya existente.",
      ],
      exceso: [
        "Puede sumergirse demasiado en los detalles y no percibir la falta de interés de los demás.",
        "Puede confundir a la gente presentándole muchas opciones, previniendo su acción.",
        "Puede usar demasiado tiempo haciendo investigación y hacer sentirse desinteresados a los demás.",
        "Puede no ser suficientemente flexible y no hacer concesiones que ayudarían a resolver el problema.",
        "Puede no apreciar nuevas ideas y responder sin entusiasmo a los cambios propuestos.",
      ],
    },
    lucha: {
      fuerza: [
        "Puede responder con calma y objetividad a las objeciones de los demás.",
        "Puede aferrarse tenazmente a su opinión original.",
        "Usa hechos para superar las objeciones de los demás.",
        "Prefiere esperar a que se calmen los ánimos antes de volver a insistir o avanzar su posición.",
      ],
      exceso: [
        "Puede no demostrar suficiente sentimiento y preocupación, y parecer desinteresado.",
        "Puede no ceder cuando es necesario, haciendo que los demás se alejen.",
        "Puede entusiasmarse tanto en documentar su posición que llega a aburrir a los demás con excesivo detalle.",
        "Puede volverse distante, no dando a los demás la satisfacción del esfuerzo sostenido.",
      ],
    },
    tension: {
      fuerza: [
        "Hace el inventario, analiza la situación y examina los pros y contras de las alternativas.",
        "Se aferra a procedimientos, estrategias y caminos bien probados.",
        "Puede establecer prioridades y funcionar de una manera sistemática y sensata.",
      ],
      exceso: [
        "Puede quedar encerrado en la «parálisis de análisis» y no llegar a hacer recomendaciones decisivas.",
        "Queda varado con viejos modos.",
        "Puede ser tan sistemático que llega a descuidar los riesgos o la urgencia de la situación.",
      ],
    },
    cambio: {
      primeraReaccion:
        "Cauto, actitud de espera atenta. Tiene que entender el propósito y ver la justificación.",
      fuerza: "Análisis, calma, objetividad.",
      factoresDePeso: "Que tenga sentido; que sea inevitable; que no se pierda nada.",
      dificultades: "Se detiene, evalúa la dificultad, sopesa alternativas y actúa más despacio.",
      transicion: "Lentas.",
      facilitan:
        "Datos de estudios. Tiempo para planificar a largo plazo y en profundidad: «es una extensión de lo que ya tenemos». Abordaje lógico y racional. Consistencia con estrategias y procedimientos anteriores. Beneficios prácticos y ventajas de costo.",
      estiloDirectivo:
        "Estructura formal. Patrones establecidos y coherentes, practicidad y exactitud.",
    },
    tiempo: {
      usoProductivo:
        "Analizando y obteniendo datos, estudiando problemas a fondo, siendo metódico y sistemático.",
      trampa: "Parálisis de análisis, avalancha de papeles, métodos que no se adecuan a la urgencia.",
      preocupacion: "No ser exhaustivo ni completo; no comprender la situación.",
      sintomas:
        "Informes demasiado detallados; continúa discutiendo en las juntas; pospone hasta tener más datos.",
      compensacion: "Mi acción (haga).",
      frase: "Esto es lo que voy a hacer.",
    },
    comunicacion: {
      comoComunicarse:
        "Presente ideas no riesgosas. Dé oportunidad para analizar; use la lógica y los hechos. Use familiaridad, rutina y estructura. Relacione las cosas nuevas con las viejas.",
      mejorAmbiente: "Neutralidad emocional, basado en hechos, científico, práctico.",
      peorAmbiente:
        "Reglas y procedimientos en constante cambio, ambiente altamente emocional, decisiones prematuras, que no se le tome en serio.",
      jefeEfectivo:
        "Sea organizado. Muestre que tiene un propósito. Preste atención a los detalles. Sea sistemático, objetivo y justo. Sea consistente.",
      empleadoEfectivo: "Sea adaptado, lógico y respetuoso. Preste atención.",
    },
    expresion: {
      ayuda:
        "Ofrece consejo práctico e informativo. Provee estructuras. Analiza el problema paso por paso (pros y contras).",
      control:
        "Indirectamente, a través de las estructuras, el método y la agenda. Controles organizacionales. Posición documentada.",
      analisis:
        "Metódico. Quiere saber todos los detalles; organiza los datos para examinar alternativas. Puede llegar a la parálisis por exceso de análisis.",
      compromiso: "Reacciona a la lógica y a los datos. Tenaz. Usa reglas de orden. Propenso a entrar en «impasse».",
      plan: "Planea a largo plazo. Se basa en datos. Revisión exhaustiva de alternativas: «hay que usar primero lo que ya tenemos».",
      riesgo:
        "Prefiere la demora al error. Corre riesgos de manera gradual, por partes. Confía en datos y en métodos.",
      liderazgo:
        "Reservado. Dirige a través de estrategias, procedimientos y métodos. Apela a la lógica, los hechos y el sistema.",
    },
    superarExcesos:
      "Trate de disminuir la tensión y la amenaza. Lleve las emociones al mínimo. Trate el asunto en un tono más ligero, preferentemente con humor. Pida sugerencias sobre los criterios que podrían utilizarse para evaluar el problema. Permita un cierto tiempo extra antes de tomar la decisión. Obtenga datos adicionales en los que la persona pueda confiar.",
    necesidades:
      "Ser visto como alguien objetivo, determinado y racional. Sentirse a salvo y seguro. Sentir que ninguna pérdida es irreparable.",
  },

  an: {
    nombre: "Adapta y Negocia",
    sigla: "Ad/Nc",
    orientacion:
      "Debe ser sensible y estar en armonía con los deseos y necesidades de los demás. Adaptándose a los demás y satisfaciendo primero sus necesidades, llegará a satisfacer las suyas propias.",
    meta: "Ser visto como alguien que gusta, que es aceptado.",
    terminos: [
      ["Flexible", "Inconsistente"],
      ["Experimental", "Sin rumbo"],
      ["Jovial", "Pueril"],
      ["Entusiasta", "Agitado"],
      ["Usa el tacto", "Evita la confrontación"],
      ["Adaptable", "Sin convicciones"],
      ["Habilidad social", "Manipulador"],
      ["Negocia", "Cede demasiado"],
      ["Animado", "Melodramático"],
      ["Inspirador", "Exagerado"],
    ],
    habituales: {
      fuerza: [
        "Usa el tono ligero y el encanto personal para ganarse la simpatía de la gente.",
        "Sensible y consciente de los sentimientos de los demás y de lo que les complacerá.",
        "Flexible para encontrar nuevos modos de satisfacer a los demás.",
        "Es capaz de negociar con comodidad y de adaptarse a toda clase de gente.",
        "Rápido para cambiar y adaptarse a nuevas ideas y nuevos sistemas.",
      ],
      exceso: [
        "Se vuelve demasiado entretenido y distrae de la seriedad de la situación.",
        "Puede llegar a acomodarse demasiado a los deseos de los demás, volviéndose solícito.",
        "Puede volverse inconsistente y no hacer lo que la experiencia muestra que es lo mejor para los demás.",
        "Puede exagerar los contactos sociales y no usar su tiempo eficientemente.",
        "Puede dispersar la dirección existente y perder de vista los objetivos.",
      ],
    },
    lucha: {
      fuerza: [
        "Puede ver ambos lados de una discusión.",
        "Trata de mantener la tensión al mínimo mediante el humor y el apaciguamiento de desacuerdos.",
        "Encuentra formas nuevas, aún no experimentadas, para resolver diferencias.",
        "Optimista, entusiasta acerca del resultado final del conflicto.",
      ],
      exceso: [
        "Parece ambivalente e inconsistente, no pronunciándose definitivamente por nada.",
        "Puede llegar a evitar que ciertas objeciones se expresen en su totalidad, de modo que el problema vuelve a presentarse más adelante.",
        "Sus soluciones ingeniosas distraen la atención del problema principal.",
        "Puede hacer sentir a los demás que no está comprendiendo la seriedad y dificultad del problema.",
      ],
    },
    tension: {
      fuerza: [
        "El sentido del humor mantiene la distancia bajo presión.",
        "Diplomático y cuidadoso de los sentimientos de los demás; no desea crear una presión mayor.",
        "Alienta a la gente y le promete resultados positivos.",
        "Ansioso de intentar varias soluciones y bajar la tensión.",
      ],
      exceso: [
        "Dispersa la seriedad y crea un sentido de bienestar artificial.",
        "Puede mostrar tanto tacto que termina creando desconfianza.",
        "Promete demasiado y no puede cumplir.",
        "Parece no tener objetivos y confunde con muchas opciones.",
      ],
    },
    cambio: {
      primeraReaccion: "Entusiasta. Tiende a ver el lado bueno. Deseoso de participar.",
      fuerza:
        "Intensidad y optimismo. Habilidad para influir en los demás. Sabe qué decir para elevar los ánimos.",
      factoresDePeso: "Quién lo inicia; qué tan amistosamente; la reputación.",
      dificultades:
        "Se preocupa. Necesita aliento. Trata de «seguir sonriendo». Ve si otros pueden ayudar.",
      transicion: "Verifica rápidamente para determinar reacciones.",
      facilitan:
        "Franqueza y calidez de los demás. Consenso, aliento y apoyo; implicaciones para la relación social; valor de relaciones públicas; que incremente la cohesión y la moral, nos haga más importantes y aumente nuestra reputación.",
      estiloDirectivo: "Toma decisiones que aseguren aceptación. Atento a las reacciones.",
    },
    tiempo: {
      usoProductivo:
        "Resolviendo conflictos, encontrando nuevas soluciones para un problema, experimentando, con sentido del optimismo.",
      trampa: "Demasiado flexible, siempre abierto a cambios, esperando a que otros dirijan e inicien.",
      preocupacion: "Pérdida de aceptación y aprobación; no ser el centro de atención.",
      sintomas:
        "Muchas tareas sin planes visibles; los últimos «borradores»; cambio abrupto de dirección.",
      compensacion: "Mi dirección (afírmese).",
      frase: "Esto es lo que yo pienso que debería hacerse.",
    },
    comunicacion: {
      comoComunicarse:
        "Dé oportunidad para hacer cosas con otros. Use el humor. Hágale saber que usted está complacido. Dé oportunidad para el lucimiento personal.",
      mejorAmbiente: "Social, cambiante, jovial, optimista.",
      peorAmbiente:
        "Autoridad, compañeros no amistosos, rutinas y detalles, horarios firmes y supervisión.",
      jefeEfectivo:
        "Sea amistoso y proporcione información. Manténgalo al tanto de los resultados. Sea comprensivo, alentador y flexible; use su sentido del humor.",
      empleadoEfectivo:
        "Sea sociable, sofisticado pero no simple. Use el tacto. Tenga influencia.",
    },
    expresion: {
      ayuda:
        "Escucha con empatía. Ayuda a la persona a llegar a sus propias respuestas: «¿qué es lo que usted quiere?».",
      control:
        "Delicadeza y humor. Mantiene la armonía no revelando su posición personal. Complace y aplaca al otro.",
      analisis:
        "Examina la información para ver implicaciones en el clima social. Considera datos nuevos y diferentes a los ya existentes. Usa un enfoque abierto, sin respuestas predeterminadas. Usa el consejo.",
      compromiso:
        "Deseoso de dar para recibir. Mantiene las negociaciones abiertas; hace que el otro inicie y después se adapta. Busca soluciones en donde ambas partes se beneficien.",
      plan: "Preocupado por la aceptación general del plan. Combina las partes en un todo creativo. Hace que otros también se incluyan en el plan.",
      riesgo:
        "Arriesga tener que hacer las cosas como las quiere el otro. Confía en su propia habilidad para adaptarse. Deja que el otro saque ventaja.",
      liderazgo: "Usa el enfoque de consenso. Tacto y flexibilidad. Ejerce un liderazgo de tipo social.",
    },
    superarExcesos:
      "Dé la seguridad de que usted lo aprecia. Esté dispuesto a negociar. Dé a entender que admira a las personas que son sinceras, aun cuando no estén de acuerdo. Use un enfoque positivo: «lo que me gusta de esto es…», «las reservas que tengo son…». Pase algo de tiempo con una actitud amistosamente social antes de exigir la decisión. Permítale «conservar su imagen».",
    necesidades:
      "Ser visto como alguien que gusta a los demás, popular. Hacer sentir felices a todos con los resultados. Sentir que aún hay oportunidades para complacer a la gente.",
  },
};

export type TipoPerfil =
  | "uniforme"
  | "primario"
  | "combinado"
  | "diferenciado"
  | "backup"
  | "triada";

/** §6.1.5 — seis perfiles básicos LIFO. */
export const PERFILES: Record<
  TipoPerfil,
  { nombre: string; regla: string; atributos: string[]; fuerzas: string[]; vulnerables: string[] }
> = {
  uniforme: {
    nombre: "Perfil uniforme",
    regla:
      "La más alta y la segunda difieren 3 o menos, y la segunda y la más baja también 3 o menos: las cuatro calificaciones están muy cercanas.",
    atributos: ["Todos los estilos tienen la misma preferencia."],
    fuerzas: [
      "Habilidad para identificarse con muchos sistemas de valores.",
      "Habilidad para relacionarse con mucha gente de muchos estilos.",
      "Maneja la flexibilidad.",
    ],
    vulnerables: [
      "Otros pueden pasarla mal anticipando sus respuestas.",
      "Impacto diluido, ya que no tiene preferencia por ningún estilo.",
      "Difícil de comprender, impredecible: puede dar lugar a desconfianza.",
    ],
  },
  primario: {
    nombre: "Nivel primario",
    regla:
      "Un estilo predomina claramente (más de 8 puntos sobre el segundo) y los otros tres son más o menos iguales (3 o menos entre el segundo y el más bajo).",
    atributos: [
      "Un estilo de comportamiento tiene una alta frecuencia de preferencia.",
      "Una persona con un nivel primario es probablemente conocida por ese estilo.",
    ],
    fuerzas: [
      "Predecible y disponible.",
      "Otros tienen una base clara para responder.",
      "La gente sabe claramente lo que esta persona prefiere.",
    ],
    vulnerables: [
      "Disponible y por tanto fácil de manipular.",
      "Mayor tendencia al exceso en ese estilo.",
      "Puede parecer rígido.",
    ],
  },
  combinado: {
    nombre: "Nivel primario combinado",
    regla:
      "Los dos estilos más preferidos difieren 3 o menos, y la calificación más baja está a más de 3 de la segunda. Es el perfil más común: la descripción integra las dos orientaciones.",
    atributos: [
      "Dos estilos comparten la atención y se usan con más o menos la misma frecuencia.",
      "Los dos estilos se modifican uno al otro en una mezcla.",
    ],
    fuerzas: [],
    vulnerables: [],
  },
  diferenciado: {
    nombre: "Perfil diferenciado",
    regla:
      "El más preferido está claramente separado del segundo (más de 3), el menos preferido también (más de 3 entre el segundo y el más bajo) y la segunda y tercera difieren más de 3. Se considera el «prototipo»: hay tres bases de interpretación claras.",
    atributos: [
      "Un estilo más preferido, uno de apoyo y uno menos preferido, claramente distinguibles.",
    ],
    fuerzas: [],
    vulnerables: [],
  },
  backup: {
    nombre: "Combinado back-up",
    regla:
      "Igual al diferenciado, excepto que la segunda y la tercera calificación difieren 3 o menos: el estilo principal se apoya en dos estilos de respaldo casi iguales.",
    atributos: [
      "Un estilo principal claro, respaldado por dos estilos con preferencia similar.",
    ],
    fuerzas: [],
    vulnerables: [],
  },
  triada: {
    nombre: "Nivel tríada",
    regla:
      "Las tres calificaciones más altas están a 5 puntos o menos entre sí y la más baja está 3 o más por debajo: el perfil se caracteriza por el estilo menos preferido.",
    atributos: [
      "Tres estilos preferidos con igual frecuencia.",
      "Flexible, pero sin confianza en el menos preferido.",
      "Una persona puede ser conocida por el estilo que no tiene.",
    ],
    fuerzas: ["Flexible.", "Capaz de llevarse con mucha gente."],
    vulnerables: ["Impredecible.", "Impacto difuso.", "Puede tener un «punto ciego»."],
  },
};

export type TextoCombinacion = { favorables: string[]; adversas: string[]; excesos: string[] };

/** §6.1.5.1 — nivel combinado: las seis parejas. Clave: estilos en orden de la hoja. */
export const COMBINACIONES: Record<string, TextoCombinacion> = {
  "da-tc": {
    favorables: [
      "Deseo de hacerse cargo en apoyo de una causa valiosa.",
      "Consultor autoritario.",
      "Interesado en la acción basada en principios.",
      "Altamente interesado en las personas y en los resultados.",
      "Prefiere la interdependencia y la influencia mutua.",
    ],
    adversas: ["Trabaja por soluciones integradoras.", "Interesado en ser cooperador y afirmativo."],
    excesos: [
      "Puede ser poco realista y presionar con expectativas no realistas.",
      "Puede ver en las situaciones más de lo que son.",
      "Ambivalente en el uso y la aceptación del poder.",
    ],
  },
  "da-mc": {
    favorables: [
      "Preocupado por lograr la excelencia.",
      "Clara preferencia por planear.",
      "Altas expectativas sistemáticamente desarrolladas.",
    ],
    adversas: ["Cooperación basada en reglas racionales.", "Afirmativo con documentación."],
    excesos: ["Estándares muy altos.", "Puede parecer imposible de satisfacer.", "Rendición desapasionada."],
  },
  "da-an": {
    favorables: [
      "Deseo de seguir sus propios principios; gana agrado personal con base en principios.",
      "Portavoz y apoyador popular de causas valiosas.",
    ],
    adversas: ["Compromisos y suavidades.", "Interés en los problemas de la gente."],
    excesos: [
      "Puede parecer demasiado deseoso de dar y complacer a otros.",
      "Sus planes de acción pueden ser vagos e imprácticos.",
      "Se rinde apasionadamente.",
    ],
  },
  "tc-mc": {
    favorables: [
      "Deseo de acción con una base de datos.",
      "Análisis en apoyo del movimiento.",
      "Fuerte orientación práctica.",
      "La mirada puesta en las metas.",
    ],
    adversas: [
      "Afirmativo pero cuidadosamente racional.",
      "Trabaja por soluciones lógicas para alcanzar su propio objetivo.",
    ],
    excesos: [
      "Puede parecer reservado y reprimido.",
      "Puede cerrarse a la influencia de otros.",
      "Poderoso y desapasionado.",
    ],
  },
  "tc-an": {
    favorables: [
      "Acción entonada con aprobación.",
      "Suaviza el control con su toque suave.",
      "Usa habilidades sociales para mover gente y situaciones.",
    ],
    adversas: [
      "Afirmativo, pero cuidadoso de no ofender a otros.",
      "Suaviza las demandas con sociabilidad.",
    ],
    excesos: [
      "Otros se pueden sentir manipulados.",
      "Usa la amistad para lograr sus propios fines.",
      "Poderoso y apasionado.",
    ],
  },
  "mc-an": {
    favorables: [
      "Racional y estructurado, pero suave.",
      "Responde a otros; se adapta siendo sistemático y organizado.",
      "Expresa lo práctico en términos de lo que a los otros les gustaría.",
    ],
    adversas: [
      "Trabaja en la aceptación de argumentos lógicos por parte de otros.",
      "Presiona por soluciones lógicas para evitar la desarmonía.",
    ],
    excesos: [
      "Sobreorganiza la interacción.",
      "Ambivalente en la interacción, sin enfocarse en sentimientos ni en hechos.",
    ],
  },
};

/** §6.1.5.1 — nivel tríada: descripción según el estilo MENOS preferido. */
export const MENOS_PREFERIDO: Record<EstiloLifo, TextoCombinacion & { apodo?: string }> = {
  da: {
    favorables: [
      "Autosuficiente, muy sociable.",
      "Enérgico y poderoso, con interés por lo práctico.",
      "Abiertamente expresa influencia directa con otros.",
      "Demandante, pero con tacto.",
    ],
    adversas: ["Difícil de mover, pero trabajará por la armonía."],
    excesos: [
      "Puede usar sus habilidades para manipular en incidentes de corto plazo.",
      "Difícil de influenciar, excepto por cosas superficiales.",
      "Puede perder de vista los valores básicos y la valía de otros.",
    ],
  },
  tc: {
    favorables: [
      "Miembro natural de staff o de grupo. Considera valores, gente y hechos. Prefiere recibir dirección.",
      "Objetivo pero sensible.",
      "La acción independiente no es probable.",
    ],
    adversas: [
      "Adopta la orientación de la gente expresada racionalmente. Evita el uso directo del poder.",
      "Tiende a integrar diversos puntos de vista.",
    ],
    excesos: [
      "Puede parecer frío ante la acción, excepto en relaciones sociales suaves.",
      "Puede perder oportunidades.",
      "Otros pueden no saber lo que desea.",
    ],
  },
  mc: {
    favorables: [
      "Activo, en el terreno, altamente interactivo.",
      "Prefiere trabajar con gente.",
      "Influye a través de la inspiración y los ideales.",
      "Encuentra el éxito como ejemplo popular y dinámico. Creativo.",
    ],
    adversas: [
      "Puede tener problemas en su desempeño.",
      "Planeación no práctica y difusa.",
    ],
    excesos: [
      "Puede pasar por alto inconsistencias y hechos relevantes.",
      "Puede abrumar personalmente a otros.",
    ],
  },
  an: {
    apodo: "«El padre fuerte»",
    favorables: ["Independiente y determinante.", "Serio.", "Consistente y directo en sus convicciones."],
    adversas: [
      "Adopta una postura fuerte y racional para sus ideales.",
      "Se mantendrá firme hasta que se complete una resolución.",
    ],
    excesos: [
      "Puede carecer de tacto y pasar por alto implicaciones sociales.",
      "Puede parecer poco razonable e inflexible.",
    ],
  },
};
