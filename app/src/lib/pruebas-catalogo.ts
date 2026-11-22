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
  /** Precio por candidato sin IVA, en centavos. Sin precio, se cotiza aparte. */
  precio: number | null;
  descripcion: string;
};

export const PRUEBAS: Prueba[] = [
  {
    id: "papi",
    nombre: "Inventario de Personalidad",
    etiqueta: "Rasgos y estilo de trabajo",
    minutos: 20,
    precio: 75000,
    descripcion: "Cómo se conduce en el día a día: iniciativa, trato, tolerancia a la presión.",
  },
  {
    id: "hartman",
    nombre: "Axiología de Valores",
    etiqueta: "Valores y motivación",
    minutos: 15,
    precio: 85000,
    descripcion: "Qué lo mueve de verdad y si embona con la cultura de tu organización.",
  },
  {
    id: "mabe",
    nombre: "Toma de Decisiones",
    etiqueta: "Criterio aplicado",
    minutos: 25,
    precio: 65000,
    descripcion: "Qué información usa para decidir, qué riesgo acepta y qué tan consistente es.",
  },
  {
    id: "cleaver",
    nombre: "Compatibilidad Puesto–Persona",
    etiqueta: "Ajuste al puesto",
    minutos: 12,
    precio: 55000,
    descripcion: "Qué exige el puesto contra lo que la persona ofrece, y dónde habrá fricción.",
  },
  {
    id: "lifo",
    nombre: "Estilos de Vida y Trabajo",
    etiqueta: "Fortalezas y estrés",
    minutos: 25,
    precio: 75000,
    descripcion:
      "Cómo trabaja cuando todo va bien y cómo cambia bajo presión: sus fortalezas y en qué se excede.",
  },
  {
    id: "gerenciales",
    nombre: "Estilos Gerenciales",
    etiqueta: "Conducción de equipos",
    minutos: 15,
    // Sin precio en la lista del cliente: se cotiza aparte.
    precio: null,
    descripcion: "Cómo dirige, cómo delega y cómo sostiene el resultado con su equipo.",
  },
  {
    id: "socioeconomico",
    nombre: "Estudio Socioeconómico",
    etiqueta: "Entorno, visita y referencias",
    // Lo que tarda el candidato en su parte; la visita y las llamadas van aparte.
    minutos: 40,
    // $986 con IVA. No se cobra en línea: la visita se coordina aparte.
    precio: 85000,
    descripcion:
      "Situación familiar y económica, visita domiciliaria y verificación de referencias laborales.",
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
  /** Solo lo que tiene precio; lo demás va en `porCotizar`. */
  porCandidato: number;
  subtotal: number;
  descuento: number;
  total: number;
  minutos: number;
  /** Elegidas que todavía no tienen precio. */
  porCotizar: Prueba[];
};

export function cotizar(ids: string[], candidatos: number): Cotizacion {
  const elegidas = PRUEBAS.filter((p) => ids.includes(p.id));
  const porCandidato = elegidas.reduce((n, p) => n + (p.precio ?? 0), 0);
  const minutos = elegidas.reduce((n, p) => n + p.minutos, 0);
  const subtotal = porCandidato * Math.max(1, candidatos);
  const descuento = Math.round(subtotal * descuentoPorVolumen(candidatos));
  return {
    porCandidato,
    subtotal,
    descuento,
    total: subtotal - descuento,
    minutos,
    porCotizar: elegidas.filter((p) => p.precio == null),
  };
}

/** La prueba con precio más barata: el piso para anunciar «desde». */
/** Precio por candidato con IVA, como lo paga el cliente. */
export function conIva(centavos: number): number {
  return Math.round(centavos * (1 + TASA_IVA));
}

export function precioMinimo(): number {
  return Math.min(...PRUEBAS.flatMap((p) => (p.precio == null ? [] : [p.precio])));
}

/**
 * La batería completa es el caso normal: las pruebas psicométricas se leen
 * juntas ($4,118 con IVA). El estudio socioeconómico no entra: es otro
 * servicio y se agrega a mano; tampoco lo que aún no tiene precio.
 */
export const BATERIA_COMPLETA = PRUEBAS.filter((p) => p.id !== "socioeconomico" && p.precio != null).map(
  (p) => p.id,
);

/**
 * Pruebas que se pueden pagar en línea: las que ya están digitalizadas (el
 * código de acceso las abre) y tienen precio. Estilos Gerenciales y el
 * estudio socioeconómico se coordinan aparte.
 */
export const DIGITALES = ["papi", "hartman", "mabe", "cleaver", "lifo"] as const;
export type PruebaDigital = (typeof DIGITALES)[number];

export function esDigital(id: string): id is PruebaDigital {
  return (DIGITALES as readonly string[]).includes(id);
}

/** Los precios del catálogo van sin IVA; al cliente se le muestra el precio final. */
export const TASA_IVA = 0.16;

/** Cuántos códigos de una misma prueba se pueden comprar en un solo pago. */
export const MAX_POR_PRUEBA = 100;

/** Horas que tiene el candidato para contestar desde que activa su código. */
export const HORAS_PARA_CONTESTAR = 24;

/** Horas en que llega el informe firmado por el psicólogo. */
export const HORAS_ENTREGA = 24;

/** Cuántos códigos de cada prueba: { papi: 3, hartman: 1 }. */
export type Cantidades = Partial<Record<string, number>>;

export type RenglonCotizado = {
  prueba: Prueba;
  cantidad: number;
  /** Precio final por código, ya con el descuento por volumen de esa prueba. */
  unitario: number;
  /** Precio final por código sin descuento. */
  lista: number;
  descuento: number;
  importe: number;
};

export type CotizacionPorPrueba = {
  /** Lo que se paga en línea: un código por cada unidad. */
  renglones: RenglonCotizado[];
  /** Elegidas que se coordinan aparte (no digitalizadas o sin precio). */
  aparte: { prueba: Prueba; cantidad: number }[];
  /** Total de códigos que se generan. */
  codigos: number;
  subtotal: number;
  descuento: number;
  /** Precio final: es lo que cobra Stripe, centavo por centavo. */
  total: number;
};

export function cantidadValida(n: unknown): number {
  const v = Math.floor(Number(n));
  return Number.isFinite(v) ? Math.min(MAX_POR_PRUEBA, Math.max(0, v)) : 0;
}

/**
 * Cotización con cantidad por prueba. Cada unidad es un código que abre una
 * sola prueba. El descuento por volumen se aplica por prueba según cuántos
 * códigos de esa prueba se compran. Los precios ya son finales: el cliente no
 * ve desglose de impuestos. El servidor la recalcula; nunca confía en el navegador.
 */
export function cotizarPorPrueba(cantidades: Cantidades): CotizacionPorPrueba {
  const renglones: RenglonCotizado[] = [];
  const aparte: { prueba: Prueba; cantidad: number }[] = [];
  for (const prueba of PRUEBAS) {
    const cantidad = cantidadValida(cantidades[prueba.id]);
    if (cantidad === 0) continue;
    if (!esDigital(prueba.id) || prueba.precio == null) {
      aparte.push({ prueba, cantidad });
      continue;
    }
    const lista = conIva(prueba.precio);
    const unitario = Math.round(lista * (1 - descuentoPorVolumen(cantidad)));
    renglones.push({
      prueba,
      cantidad,
      unitario,
      lista,
      descuento: (lista - unitario) * cantidad,
      importe: unitario * cantidad,
    });
  }
  const subtotal = renglones.reduce((n, r) => n + r.lista * r.cantidad, 0);
  const total = renglones.reduce((n, r) => n + r.importe, 0);
  return {
    renglones,
    aparte,
    codigos: renglones.reduce((n, r) => n + r.cantidad, 0),
    subtotal,
    descuento: subtotal - total,
    total,
  };
}

/** «papi:3,hartman:1» ⇄ { papi: 3, hartman: 1 }, para los metadatos del pago. */
export function cantidadesATexto(c: Cantidades): string {
  return DIGITALES.flatMap((id) => {
    const n = cantidadValida(c[id]);
    return n > 0 ? [`${id}:${n}`] : [];
  }).join(",");
}

export function textoACantidades(t: string): Partial<Record<PruebaDigital, number>> {
  const out: Partial<Record<PruebaDigital, number>> = {};
  for (const par of t.split(",")) {
    const [id, n] = par.split(":");
    if (id && esDigital(id)) {
      const v = cantidadValida(n);
      if (v > 0) out[id] = v;
    }
  }
  return out;
}

/** Hasta cuándo puede contestar quien activó un código en `activado`. */
export function limiteParaContestar(activado: string): string {
  return new Date(new Date(activado).getTime() + HORAS_PARA_CONTESTAR * 3_600_000).toISOString();
}

export function tiempoAgotado(activado: string, ahora = new Date()): boolean {
  return ahora.getTime() > new Date(limiteParaContestar(activado)).getTime();
}
