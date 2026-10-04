/**
 * Catálogo de pruebas psicológicas para venta directa.
 *
 * Los precios viven aquí y no en la base porque no son cursos: una evaluación
 * se vende por candidato, no por inscripción. Están en centavos, igual que el
 * resto del sistema, para que el día que se conecte el cobro no haya que
 * convertir nada.
 */

export type Prueba = {
  id: string;
  nombre: string;
  etiqueta: string;
  minutos: number;
  /** Precio por candidato, en centavos. */
  precio: number;
  descripcion: string;
};

export const PRUEBAS: Prueba[] = [
  {
    id: "papi",
    nombre: "Inventario de Personalidad",
    etiqueta: "Rasgos y estilo de trabajo",
    minutos: 20,
    precio: 35000,
    descripcion: "Cómo se conduce en el día a día: iniciativa, trato, tolerancia a la presión.",
  },
  {
    id: "hartman",
    nombre: "Axiología de Valores",
    etiqueta: "Valores y motivación",
    minutos: 15,
    precio: 30000,
    descripcion: "Qué lo mueve de verdad y si embona con la cultura de tu organización.",
  },
  {
    id: "mabe",
    nombre: "Toma de Decisiones",
    etiqueta: "Criterio aplicado",
    minutos: 25,
    precio: 38000,
    descripcion: "Qué información usa para decidir, qué riesgo acepta y qué tan consistente es.",
  },
  {
    id: "cleaver",
    nombre: "Compatibilidad Puesto–Persona",
    etiqueta: "Ajuste al puesto",
    minutos: 12,
    precio: 28000,
    descripcion: "Qué exige el puesto contra lo que la persona ofrece, y dónde habrá fricción.",
  },
  {
    id: "gerenciales",
    nombre: "Estilos Gerenciales",
    etiqueta: "Conducción de equipos",
    minutos: 15,
    precio: 32000,
    descripcion: "Cómo dirige, cómo delega y cómo sostiene el resultado con su equipo.",
  },
];

/**
 * Descuento por volumen. Evaluar a veinte personas no cuesta veinte veces lo
 * que evaluar a una, y decirlo en la propia página evita una llamada.
 */
export const TRAMOS = [
  { desde: 20, descuento: 0.2, etiqueta: "20 o más" },
  { desde: 10, descuento: 0.15, etiqueta: "10 a 19" },
  { desde: 5, descuento: 0.1, etiqueta: "5 a 9" },
  { desde: 1, descuento: 0, etiqueta: "1 a 4" },
];

export function descuentoPorVolumen(candidatos: number): number {
  return TRAMOS.find((t) => candidatos >= t.desde)?.descuento ?? 0;
}

export type Cotizacion = {
  porCandidato: number;
  subtotal: number;
  descuento: number;
  total: number;
  minutos: number;
};

export function cotizar(ids: string[], candidatos: number): Cotizacion {
  const elegidas = PRUEBAS.filter((p) => ids.includes(p.id));
  const porCandidato = elegidas.reduce((n, p) => n + p.precio, 0);
  const minutos = elegidas.reduce((n, p) => n + p.minutos, 0);
  const subtotal = porCandidato * Math.max(1, candidatos);
  const descuento = Math.round(subtotal * descuentoPorVolumen(candidatos));
  return { porCandidato, subtotal, descuento, total: subtotal - descuento, minutos };
}

/** La batería completa es el caso normal: se leen juntas. */
export const BATERIA_COMPLETA = PRUEBAS.map((p) => p.id);
