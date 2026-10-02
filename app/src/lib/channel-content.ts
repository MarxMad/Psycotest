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
    seoTitle: "Martín Hernández — Consultor, Valuador y Certificador",
    seoDescription:
      "Portafolio profesional de Martín Hernández González: consultoría, valuación de competencias y certificación.",
    published: true,
    updatedAt: new Date().toISOString(),
    hero: {
      brand: "Martín Hernández González",
      headline: "Consultor. Valuador. Certificador.",
      lead: "Acompaño a personas y organizaciones en diagnóstico, formación y certificación de competencias con criterio técnico y respaldo institucional.",
      image: "/ige/banner.png",
      primaryCta: { label: "Credenciales", href: "#credenciales" },
      secondaryCta: { label: "Canales de servicio", href: "#canales" },
    },
    sections: [
      {
        id: "credenciales",
        eyebrow: "Perfil",
        title: "Tres roles, una misma exigencia técnica",
        body: "Trabajo en la intersección de la psicología organizacional, la formación de equipos y la certificación oficial de competencias.",
        items: [
          {
            title: "Consultor",
            text: "Diagnóstico organizacional, diseño de intervenciones y acompañamiento a equipos directivos.",
          },
          {
            title: "Valuador",
            text: "Evaluación de competencias y perfiles con instrumentos trazables e interpretación profesional.",
          },
          {
            title: "Certificador",
            text: "Procesos alineados a CONOCER / ECE para constancias con validez nacional.",
          },
        ],
      },
      {
        id: "canales",
        eyebrow: "Ecosistema",
        title: "Canales especializados",
        body: "Cada servicio opera con identidad propia. Elige el canal según tu necesidad.",
        items: [
          {
            title: "CEDUCT",
            text: "ECE 002-10 — diplomados y certificación de competencias CONOCER.",
          },
          {
            title: "Psicología Aplicada",
            text: "Pruebas, selección de personal, diplomados 90 h y estudios socioeconómicos.",
          },
          {
            title: "Ingeniería de Grupos Efectivos",
            text: "Cursos, capacitación y consultoría para equipos de alto rendimiento.",
          },
        ],
      },
      {
        id: "contacto",
        eyebrow: "Contacto",
        title: "Hablemos de tu proyecto",
        body: "Escríbeme para certificación, evaluación o formación de equipos.",
        items: [
          { title: "Correo", text: "martintlax@gmail.com" },
          { title: "Teléfono", text: "5580413220" },
        ],
      },
    ],
  },
  ceduct: {
    channelId: "ceduct",
    seoTitle: "CEDUCT ECE 002-10 — Diplomados y certificación de competencias",
    seoDescription:
      "CEDUCT A.C., Entidad de Certificación y Evaluación ECE 002-10. Diplomados y certificaciones CONOCER con validez oficial.",
    published: true,
    updatedAt: new Date().toISOString(),
    hero: {
      brand: "CEDUCT A.C. · ECE 002-10",
      headline: "Diplomados y certificaciones con clave ECE 002-10",
      lead: "Centro de Educación y Capacitación para los Trabajadores, A.C. Gestionamos formación y certificación de competencias bajo el Sistema Nacional de Competencias.",
      image: "/ceduct/hqdefault.jpg",
      primaryCta: { label: "Explorar diplomados", href: "#diplomados" },
      secondaryCta: { label: "Proceso de certificación", href: "#certificaciones" },
    },
    sections: [
      {
        id: "diplomados",
        eyebrow: "Formación",
        title: "Diplomados con ruta hacia la certificación",
        body: "Diseñamos y operamos diplomados orientados a estándares de competencia: avance medible, evidencias y acompañamiento hasta el dictamen.",
        items: [
          {
            title: "Diseño por competencias",
            text: "Programas alineados a estándares RENEC / CONOCER aplicables.",
          },
          {
            title: "Seguimiento del avance",
            text: "Inscripción, materiales y control de evidencias en la plataforma.",
          },
          {
            title: "Puente a certificación",
            text: "Quien completa el diplomado puede continuar al proceso ECE 002-10.",
          },
        ],
      },
      {
        id: "certificaciones",
        eyebrow: "ECE 002-10",
        title: "Certificación oficial de competencias",
        body: "Como Entidad de Certificación y Evaluación acreditada, evaluamos y certificamos con trazabilidad completa ante CONOCER.",
        items: [
          {
            title: "Evaluación",
            text: "Instrumentos y evidencias conforme al estándar de competencia.",
          },
          {
            title: "Expediente digital",
            text: "Del diagnóstico al dictamen, con expediente en un solo lugar.",
          },
          {
            title: "Constancia",
            text: "Documento verificable con validez en el marco CONOCER / SEP.",
          },
        ],
      },
      {
        id: "proceso",
        eyebrow: "Ruta ECE",
        title: "De la formación al certificado",
        body: "Una secuencia clara: diplomado o alineación, evaluación con evidencias y emisión de constancia cuando el dictamen es favorable.",
        items: [
          { title: "1. Alineación", text: "Elegimos estándar y ruta de evidencias." },
          { title: "2. Evaluación", text: "Aplicamos, documentamos y dictaminamos." },
          { title: "3. Certificación", text: "Emitimos y registramos la constancia." },
        ],
      },
    ],
  },
  psicologia: {
    channelId: "psicologia",
    seoTitle: "Psicología Aplicada — Pruebas, selección y diplomados",
    seoDescription:
      "Batería psicológica, elección de personal, diplomados de 90 horas y estudios socioeconómicos.",
    published: true,
    updatedAt: new Date().toISOString(),
    hero: {
      brand: "Psicología Aplicada",
      headline: "Decisiones de personal con evidencia",
      lead: "Pruebas psicológicas, batería para elección de personal, diplomados de 90 horas y estudios socioeconómicos.",
      image: "/ige/serv3.png",
      primaryCta: { label: "Entrar a evaluación", href: "/evaluacion" },
      secondaryCta: { label: "Servicios", href: "#servicios" },
    },
    sections: [
      {
        id: "servicios",
        eyebrow: "Servicios",
        title: "De la prueba al informe accionable",
        body: "Aplicación controlada por códigos, calificación automática e interpretación profesional.",
        items: [
          {
            title: "Pruebas psicológicas",
            text: "Instrumentos para perfil conductual, valores y competencias.",
          },
          {
            title: "Elección de personal",
            text: "Batería orientada al puesto con contraste persona–rol.",
          },
          {
            title: "Estudios socioeconómicos",
            text: "Complemento contextual para procesos de selección sensibles.",
          },
        ],
      },
      {
        id: "diplomados",
        eyebrow: "Formación",
        title: "Diplomados de 90 horas",
        body: "Rutas de profundización para profesionales de RH y psicología organizacional.",
        items: [
          {
            title: "Formato",
            text: "90 horas con seguimiento y evidencia de avance.",
          },
          {
            title: "Enfoque",
            text: "Aplicación práctica a selección, clima y desarrollo.",
          },
        ],
      },
    ],
  },
  ige: {
    channelId: "ige",
    seoTitle: "Ingeniería de Grupos Efectivos — Cursos y consultoría",
    seoDescription:
      "Capacitación, cursos y consultoría para construir equipos efectivos.",
    published: true,
    updatedAt: new Date().toISOString(),
    hero: {
      brand: "Ingeniería de Grupos Efectivos",
      headline: "Equipos que ejecutan, no solo se reúnen",
      lead: "Cursos, capacitación y consultoría para elevar el desempeño colectivo con método.",
      image: "/ige/serv2.png",
      primaryCta: { label: "Catálogo de cursos", href: "/consultorio/cursos" },
      secondaryCta: { label: "Clases en vivo", href: "/consultorio/clases-vivo" },
    },
    sections: [
      {
        id: "cursos",
        eyebrow: "Capacitación",
        title: "Programas que se miden en el piso de trabajo",
        body: "Diseñamos experiencias formativas para mandos y equipos operativos.",
        items: [
          {
            title: "Cursos abiertos",
            text: "Catálogo con inscripción en línea y seguimiento de avance.",
          },
          {
            title: "In company",
            text: "Diseño a la medida de la cultura y los KPIs del cliente.",
          },
          {
            title: "Clases en vivo",
            text: "Sesiones sincrónicas con registro y materiales de apoyo.",
          },
        ],
      },
      {
        id: "consultoria",
        eyebrow: "Consultoría",
        title: "Intervención con diagnóstico previo",
        body: "Antes de capacitar, entendemos el sistema: roles, fricciones y metas.",
        items: [
          {
            title: "Diagnóstico",
            text: "Mapa de fortalezas y cuellos de botella del equipo.",
          },
          {
            title: "Intervención",
            text: "Ruta de talleres, coaching de equipo y acuerdos operativos.",
          },
        ],
      },
    ],
  },
};
