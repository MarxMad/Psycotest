/**
 * Catálogo de perfiles de puesto MABE (textos de referencia).
 * Extraídos de Administrativo.docx y Almacenista.docx (Bombas y Repuestos de Oriente).
 */
export type PerfilPuestoMabe = {
  id: string;
  nombre: string;
  aliases: string[];
  empresa?: string;
  procesoPensante: string;
  valores: string[];
};

export const PUESTOS_MABE: PerfilPuestoMabe[] = [
  {
    id: "administrativo",
    nombre: "Administrativo",
    aliases: ["admin", "oficina", "asistente administrativo"],
    empresa: "Bombas y Repuestos de Oriente, S.A. de C.V.",
    procesoPensante:
      "Izquierdo Doble (A/L): el trabajo se orienta a análisis de reportes, procedimientos, organización y seguimiento. Requiere precisión, control, planeación e implementación estructurada.",
    valores: [
      "Regulatorio/religioso alto: apego a normas, códigos de conducta y estándares de calidad.",
      "Estético bajo: prioriza contenido y utilidad sobre forma o elegancia.",
    ],
  },
  {
    id: "almacenista",
    nombre: "Almacenista",
    aliases: ["almacén", "almacen", "bodega", "inventario"],
    empresa: "Bombas y Repuestos de Oriente, S.A. de C.V.",
    procesoPensante:
      "Perfil operativo con énfasis en hechos, lógica y ejecución concreta; menor demanda de abstracción visionaria. Importan el orden, el control de inventarios y el seguimiento de procedimientos.",
    valores: [
      "Religioso/regulatorio alto: cumplimiento de normas de seguridad e higiene.",
      "Estético bajo: utilidad y exactitud por encima de presentación.",
      "Económico moderado-alto: cuidado de merma, costos y existencias.",
    ],
  },
  {
    id: "operativo",
    nombre: "Operativo",
    aliases: ["operacion", "operación", "planta", "produccion", "producción"],
    empresa: "Bombas y Repuestos de Oriente, S.A. de C.V.",
    procesoPensante:
      "Orientación a lo específico y lógico (hechos, procedimientos). Baja demanda de visión estratégica; alta de ejecución confiable bajo supervisión.",
    valores: [
      "Religioso/regulatorio alto.",
      "Social moderado-alto (clima de equipo en piso).",
      "Político y estético bajos.",
    ],
  },
  {
    id: "gerente",
    nombre: "Gerente",
    aliases: ["gerencia", "direccion", "dirección", "manager"],
    empresa: "Bombas y Repuestos de Oriente, S.A. de C.V.",
    procesoPensante:
      "Conceptual doble (A/V): análisis racional + visión de conjunto. Se espera objetividad, innovación de métodos y lectura estratégica.",
    valores: [
      "Teórico y económico altos.",
      "Social alto (gestión de personas).",
      "Político variable según cultura; estético secundario.",
    ],
  },
];
