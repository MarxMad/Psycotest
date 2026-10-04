import type { ChannelId } from "./channels";

export type ChannelHero = {
  brand: string;
  headline: string;
  lead: string;
  image?: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
};

export type ChannelSection = {
  id: string;
  eyebrow?: string;
  title: string;
  body: string;
  items?: Array<{ title: string; text: string }>;
};

export type ChannelPageContent = {
  channelId: ChannelId;
  seoTitle: string;
  seoDescription: string;
  published: boolean;
  hero: ChannelHero;
  sections: ChannelSection[];
  updatedAt: string;
};

export const CHANNEL_CONTENT_SEED: Record<ChannelId, ChannelPageContent> = {
  martin: {
    channelId: "martin",
    seoTitle: "Martín Hernández González — Consultor, Valuador y Certificador",
    seoDescription:
      "Consultoría organizacional, valuación con dictamen técnico y certificación de competencias laborales para organizaciones públicas y privadas.",
    published: true,
    updatedAt: new Date().toISOString(),
    hero: {
      brand: "Martín Hernández González",
      headline: "Consultor. Valuador. Certificador.",
      lead: "Tres oficios que se cruzan en un mismo punto: poner valor donde hoy sólo hay intuición. Lo hago con organizaciones que necesitan decidir sobre su gente, su patrimonio y sus competencias.",
      image: "/ige/banner.png",
      primaryCta: { label: "Agendar una conversación", href: "#contacto" },
      secondaryCta: { label: "Ver mi práctica", href: "#credenciales" },
    },
    sections: [
      {
        id: "credenciales",
        eyebrow: "Perfil",
        title: "Tres oficios, una misma exigencia técnica",
        body: "Trabajo en la intersección de la psicología del trabajo, la valuación y la certificación oficial de competencias. Entro directo con dirección, sin intermediarios que diluyan el mensaje.",
        items: [
          {
            title: "Consultor",
            text: "Entro a entender cómo funciona la organización de verdad: quién decide, dónde se atora la información y por qué el plan no se ejecuta.",
          },
          {
            title: "Valuador",
            text: "Pongo valor técnico y documentado donde hace falta un número defendible: un bien, un puesto, una competencia. Dictamen que se sostiene frente a terceros.",
          },
          {
            title: "Certificador",
            text: "Evalúo y certifico competencias contra estándares reconocidos. Lo que una persona resuelve todos los días queda acreditado con su CLAVE.",
          },
        ],
      },
      {
        id: "metodo",
        eyebrow: "Cómo trabajo",
        title: "Seis reglas que no negocio",
        body: "No vendo un paquete cerrado. Cada intervención empieza con una conversación sin costo para saber si el problema que me planteas es el problema real.",
        items: [
          { title: "Primero el diagnóstico", text: "Después la propuesta — nunca al revés." },
          { title: "Trabajo con dirección", text: "Sin intermediarios que diluyan el mensaje." },
          { title: "Todo por escrito", text: "Metodología visible y criterios explícitos en cada entregable." },
          { title: "Alcance cerrado", text: "Duración y costo definidos antes de empezar." },
          { title: "Confidencialidad", text: "Lo que pasa en la organización no sale de ahí." },
          { title: "Honestidad", text: "Si no puedo resolverlo, lo digo y te oriento con quien sí." },
        ],
      },
      {
        id: "canales",
        eyebrow: "Mis líneas de trabajo",
        title: "Cuatro estructuras, una sola responsable",
        body: "Cada línea opera con su propio equipo y su propia promesa. Yo respondo por las cuatro.",
        items: [
          {
            title: "CEDUCT",
            text: "ECE 002-10 — evaluación y certificación de competencias laborales con validez oficial.",
          },
          {
            title: "Psicología Aplicada",
            text: "Batería psicológica, selección de personal, estudios socioeconómicos y diplomados de 90 horas.",
          },
          {
            title: "Ingeniería de Grupos Efectivos",
            text: "Cursos, talleres, diplomados, conferencias y consultoría organizacional.",
          },
        ],
      },
      {
        id: "contacto",
        eyebrow: "Contacto",
        title: "La primera conversación no cuesta",
        body: "Quince minutos para saber si soy la persona indicada para resolver lo que traes. Si no lo soy, te lo digo.",
        items: [
          { title: "Correo", text: "martintlax@gmail.com" },
          { title: "Teléfono", text: "55 8041 3220" },
          { title: "Cobertura", text: "Organizaciones públicas y privadas, y casos individuales." },
        ],
      },
    ],
  },
  ceduct: {
    channelId: "ceduct",
    seoTitle: "Diplomados y certificación de competencias laborales — CONOCER",
    seoDescription:
      "Diplomados que terminan en una constancia con validez oficial y certificación de competencias ante CONOCER. Avalados por CEDUCT A.C., clave ECE 002-10.",
    published: true,
    updatedAt: new Date().toISOString(),
    hero: {
      brand: "Certificación de competencias laborales",
      headline: "Un diplomado que termina en un certificado con validez oficial",
      lead: "Te formamos en un estándar de competencia, reunimos tus evidencias y emitimos la constancia que acredita lo que ya sabes hacer. Para una persona o para toda la plantilla.",
      image: "/ceduct/logo-ceduct.png",
      primaryCta: { label: "Ver los diplomados", href: "#diplomados" },
      secondaryCta: { label: "Quiero certificarme", href: "#certificaciones" },
    },
    sections: [
      {
        id: "diplomados",
        eyebrow: "Catálogo",
        title: "Elige tu diplomado",
        body: "Cada programa dice a qué estándar de competencia te lleva, cuántas horas dura y en qué modalidad se cursa. Puedes inscribirte en línea y empezar en la siguiente generación.",
        items: [],
      },
      {
        id: "proceso",
        eyebrow: "Cómo se llega al certificado",
        title: "Cinco pasos con fechas claras",
        body: "Desde que preguntas hasta que tienes la constancia en la mano. En cada paso sabes qué sigue, qué tienes que entregar y cuánto tarda.",
        items: [
          {
            title: "Diagnóstico",
            text: "Una llamada corta para ver qué estándar te corresponde según lo que ya haces en tu trabajo.",
          },
          {
            title: "Formación o alineación",
            text: "Cursas el diplomado completo, o sólo la alineación si ya traes la experiencia.",
          },
          {
            title: "Evidencias",
            text: "Reúnes los productos y desempeños que pide el estándar, con acompañamiento.",
          },
          {
            title: "Evaluación",
            text: "Un evaluador acreditado revisa tu portafolio y emite el dictamen.",
          },
          {
            title: "Certificado",
            text: "Si el dictamen es favorable, se emite y se registra tu constancia ante CONOCER.",
          },
        ],
      },
      {
        id: "certificaciones",
        eyebrow: "Sin pasar por el diplomado",
        title: "¿Ya sabes hacerlo? Certifícalo",
        body: "Si llevas años en el oficio, no tienes que volver a tomar un curso. Se puede ir directo a la evaluación: acreditas lo que ya dominas y obtienes el mismo certificado.",
        items: [
          {
            title: "Evaluación directa",
            text: "Instrumentos y evidencias conforme al estándar, sin curso previo.",
          },
          {
            title: "Expediente digital",
            text: "Del diagnóstico al dictamen, con todo tu expediente en un solo lugar.",
          },
          {
            title: "Constancia verificable",
            text: "Documento con validez en el marco CONOCER / SEP, comprobable en línea.",
          },
          {
            title: "Individual o por plantilla",
            text: "Atendemos una persona o certificamos a un equipo completo.",
          },
        ],
      },
      {
        id: "contacto",
        eyebrow: "Contacto",
        title: "Empieza por una llamada de quince minutos",
        body: "Te decimos qué estándar te corresponde, qué evidencias vas a necesitar y cuánto tarda el proceso. Sin costo y sin compromiso. Atendemos personas, empresas y dependencias de gobierno.",
        items: [],
      },
    ],
  },
  psicologia: {
    channelId: "psicologia",
    seoTitle: "Psicología Aplicada — Certeza en tus resultados, privacidad en tus evaluaciones",
    seoDescription:
      "Obtén los resultados de un conjunto de pruebas psicológicas en minutos, en tres pasos: solicita tus códigos, da acceso a tus candidatos y recibe el reporte individual e integral.",
    published: true,
    updatedAt: new Date().toISOString(),
    hero: {
      brand: "Psicología Aplicada",
      headline: "Certeza en tus resultados, privacidad en tus evaluaciones",
      lead: "Obtén los resultados de un conjunto de pruebas psicológicas en minutos, con tan solo tres pasos: solicita tus códigos, da acceso a tus candidatos y recibe el reporte de resultados de forma individual e integral.",
      image: "/ige/serv3.png",
      primaryCta: { label: "Solicitar mis códigos", href: "#contacto" },
      secondaryCta: { label: "Ver los tres pasos", href: "#tres-pasos" },
    },
    sections: [
      {
        id: "servicios",
        eyebrow: "Servicios",
        title: "Cuatro formas de dejar de contratar a ciegas",
        body: "Puedes contratar un servicio suelto o el proceso completo: perfil del puesto, batería, verificación en campo y recomendación final por escrito.",
        items: [
          {
            title: "Elección de personal",
            text: "Del perfil del puesto a la recomendación final: a quién contratar, por qué y qué cuidar en sus primeros meses.",
          },
          {
            title: "Batería psicológica",
            text: "Cinco instrumentos que se leen juntos: personalidad, valores, criterio, ajuste al puesto y estilo para dirigir.",
          },
          {
            title: "Estudios socioeconómicos",
            text: "Visita domiciliaria, verificación de referencias y dictamen con nivel de riesgo. Lo que se comprueba en campo.",
          },
          {
            title: "Diplomados de 90 horas",
            text: "Formación para psicólogos y responsables de capital humano que quieren evaluar con criterio propio.",
          },
        ],
      },
      {
        id: "tres-pasos",
        eyebrow: "Cómo funciona",
        title: "Resultados en minutos, con tan solo tres pasos",
        body: "Tú no instalas nada y el candidato no crea cuenta. Pides los códigos, los repartes y recibes el reporte. Si el puesto lo amerita, añadimos el perfil del puesto, el estudio socioeconómico y la interpretación de un psicólogo.",
        items: [
          {
            title: "Solicita tus códigos",
            text: "Nos dices cuántos candidatos vas a evaluar y para qué puesto. Recibes los códigos a tu nombre, listos para repartir.",
          },
          {
            title: "Da acceso a tus candidatos",
            text: "Cada persona entra con su código desde donde esté, responde en línea y puede retomar si se interrumpe.",
          },
          {
            title: "Recibe el reporte de resultados",
            text: "Lo obtienes de forma individual y de forma integral: el perfil de cada candidato y la lectura conjunta de la batería.",
          },
        ],
      },
      {
        id: "socioeconomicos",
        eyebrow: "Estudios socioeconómicos",
        title: "Lo que se comprueba en campo",
        body: "Cierra la brecha entre lo que el candidato dice y lo que se puede verificar. Lo levantamos con visita y entrevista, no por teléfono. Recomendado para puestos de confianza, manejo de efectivo, almacén, transporte y mandos medios.",
        items: [
          {
            title: "Visita domiciliaria",
            text: "Confirmación de domicilio, entorno, composición familiar y dependientes económicos.",
          },
          {
            title: "Referencias laborales",
            text: "Verificación directa con empleadores anteriores y motivo real de separación.",
          },
          {
            title: "Dictamen de riesgo",
            text: "Validación documental y lectura de estabilidad, con observaciones puntuales.",
          },
        ],
      },
      {
        id: "diplomados",
        eyebrow: "Formación",
        title: "Diplomados de 90 horas",
        body: "Noventa horas para dejar de aplicar instrumentos a ciegas. Aprendes a elegir el instrumento, leer el resultado y sostener tu recomendación frente a la dirección.",
        items: [
          {
            title: "Fundamentos",
            text: "Qué mide cada instrumento y qué no. Ética y manejo de información reservada.",
          },
          {
            title: "Aplicación",
            text: "Encuadre con el evaluado y los errores que invalidan una aplicación.",
          },
          {
            title: "Interpretación",
            text: "Lectura integrada de los cinco instrumentos con casos reales y discusión guiada.",
          },
          {
            title: "Entrega",
            text: "Redacción del informe profesional y cómo presentar hallazgos a dirección.",
          },
        ],
      },
    ],
  },
  ige: {
    channelId: "ige",
    seoTitle: "Ingeniería de Grupos Efectivos — Capacitación y consultoría",
    seoDescription:
      "Cursos, talleres, diplomados, conferencias y consultoría organizacional para el sector público y la iniciativa privada.",
    published: true,
    updatedAt: new Date().toISOString(),
    hero: {
      brand: "Ingeniería de Grupos Efectivos, S.C.",
      headline: "Equipos que ya no dependen del héroe",
      lead: "Capacitación y consultoría para organizaciones del sector público y de la iniciativa privada. Intervenimos donde se traba el equipo: la comunicación, el mando, el acuerdo y el seguimiento.",
      image: "/ige/serv1.png",
      primaryCta: { label: "Solicitar una propuesta", href: "#contacto" },
      secondaryCta: { label: "Ver catálogo de cursos", href: "/consultorio/cursos" },
    },
    sections: [
      {
        id: "capacitacion",
        eyebrow: "Capacitación",
        title: "Cuatro formatos, según lo que el equipo necesite",
        body: "No vendemos un temario fijo. Elegimos el formato que corresponde al problema y lo armamos sobre tu diagnóstico.",
        items: [
          {
            title: "Curso o taller privado",
            text: "En tus instalaciones, con tu gente y con tus casos. El equipo sale con acuerdos escritos, no con apuntes.",
          },
          {
            title: "Diplomado",
            text: "Programas extensos para desarrollar una competencia completa y dejar capacidad instalada en el área.",
          },
          {
            title: "Cursos públicos",
            text: "Calendario abierto para mandar a una o dos personas sin tener que armar un grupo completo.",
          },
          {
            title: "Conferencias",
            text: "Una sesión que mueve al grupo: para arrancar el año, cerrar una etapa o romper una inercia.",
          },
        ],
      },
      {
        id: "consultoria",
        eyebrow: "Consultoría",
        title: "Antes de capacitar, medimos",
        body: "Capacitar sin diagnóstico es gastar. Primero ubicamos la causa, después diseñamos la intervención que le corresponde.",
        items: [
          {
            title: "Diagnóstico organizacional",
            text: "Clima, comunicación, carga y estructura, con instrumentos y entrevistas por nivel. Informe con prioridades.",
          },
          {
            title: "Coaching empresarial",
            text: "Acompañamiento a mandos y equipos directivos para sostener el resultado sin desgastar a la gente.",
          },
          {
            title: "Coaching personal",
            text: "Trabajo uno a uno para profesionales en transición: nuevo puesto o nuevo tramo de control.",
          },
        ],
      },
      {
        id: "metodo",
        eyebrow: "Cómo intervenimos",
        title: "Un método que no termina cuando acaba el curso",
        body: "Volvemos a medir. Si el cambio no se sostuvo, lo trabajamos otra vez.",
        items: [
          { title: "Escuchamos", text: "Una reunión para entender el problema real, no el síntoma que se reportó." },
          { title: "Medimos", text: "Diagnóstico corto con instrumentos y entrevistas para ubicar la causa." },
          { title: "Diseñamos", text: "Propuesta con objetivos, temario, duración, modalidad y costo cerrado." },
          { title: "Intervenimos", text: "Ejecutamos con tu gente y tus casos, en sitio o en línea." },
          { title: "Sostenemos", text: "Volvemos a medir y acompañamos para que el cambio no se diluya." },
        ],
      },
      {
        id: "especialidades",
        eyebrow: "Especialidades",
        title: "Tres disciplinas que sostienen cada intervención",
        body: "Nadie sabe tanto como todos juntos.",
        items: [
          {
            title: "Psicología del trabajo",
            text: "Cómo se comporta la gente dentro de una organización y qué condiciones hacen que un equipo rinda o se desgaste.",
          },
          {
            title: "Psicología del turismo",
            text: "Habilidades duras y blandas para quienes atienden al visitante. El trato es el producto, y se entrena con método.",
          },
          {
            title: "Derecho laboral",
            text: "Toda intervención se sostiene en el cumplimiento, dando certeza en cada decisión de personal.",
          },
        ],
      },
      {
        id: "contacto",
        eyebrow: "Contacto",
        title: "Cuéntanos qué se está trabando en tu equipo",
        body: "Una reunión sin costo para entender el problema real. Si hay algo que podamos resolver, te llega una propuesta con alcance, duración y costo cerrado.",
        items: [
          { title: "Correo", text: "martintlax@gmail.com" },
          { title: "Teléfono", text: "55 8041 3220" },
          { title: "Cobertura", text: "Dependencias de gobierno y empresas de cualquier tamaño." },
        ],
      },
    ],
  },
};
