/**
 * Motor de calificación — PAPI (Inventario de Preferencias de Personalidad)
 *
 * Ver `docs/PAPI-CALIFICACION.md`.
 *
 * Cada uno de los 20 factores participa en exactamente 9 ítems, de modo que
 * el conteo bruto de elecciones cae naturalmente en la escala 0–9. No hace
 * falta tabla de baremos para puntuar.
 *
 * Estructura, según el procedimiento de corrección del manual: la diagonal de
 * la hoja de respuestas separa dos mitades que no se mezclan. **45 ítems
 * comparan un rol contra otro rol y 45 comparan una necesidad contra otra
 * necesidad.** De ahí que los diez roles sumen siempre 45 y las diez
 * necesidades otros 45.
 */

import claveJson from "@/data/papi-key.json";

export type Opcion = "A" | "B";

/** Los 10 factores de rol, en el orden de la fila superior de la rejilla. */
export const ROLES = ["G", "L", "I", "T", "V", "S", "R", "D", "C", "E"] as const;
/** Los 10 factores de necesidad, en el orden de la fila inferior. */
export const NEEDS = ["N", "A", "P", "X", "B", "O", "Z", "K", "F", "W"] as const;

export type Rol = (typeof ROLES)[number];
export type Necesidad = (typeof NEEDS)[number];
export type Factor = Rol | Necesidad;

export const NOMBRES: Record<Factor, string> = {
  G: "Trabajador intenso",
  L: "Rol de liderazgo",
  I: "Facilidad para decidir",
  T: "Ritmo y actividad",
  V: "Tipo vigoroso",
  S: "Extensión social",
  R: "Tipo teórico",
  D: "Interés por el detalle",
  C: "Tipo organizado",
  E: "Contención emocional",
  N: "Necesidad de terminar la tarea",
  A: "Necesidad de logro",
  P: "Necesidad de controlar a otros",
  X: "Necesidad de ser notado",
  B: "Necesidad de pertenecer al grupo",
  O: "Necesidad de relación cercana",
  Z: "Necesidad de cambio",
  K: "Necesidad de ser enérgico",
  F: "Necesidad de apoyar a la autoridad",
  W: "Necesidad de acatar normas",
};

/** Las 10 díadas rol–necesidad: el núcleo interpretativo del manual. */
export const DIADAS = ROLES.map((r, i) => ({ rol: r, necesidad: NEEDS[i] }));

/**
 * Las siete dimensiones de la hoja de perfil.
 *
 * «La hoja del perfil ofrece una representación sintetizada de los resultados…
 *  es el orden que se sigue en la hoja de perfil moviéndose en el sentido de
 *  las agujas del reloj a partir del factor N.»
 *  — Prueba PAPI.docx, «INTERPRETACIÓN DEL PERFIL»
 */
export const GRUPOS: { nombre: string; factores: Factor[] }[] = [
  { nombre: "Orientación al trabajo", factores: ["N", "G", "A"] },
  { nombre: "Liderazgo", factores: ["L", "P", "I"] },
  { nombre: "Dinamismo", factores: ["T", "V"] },
  { nombre: "Sociabilidad", factores: ["X", "S", "B", "O"] },
  { nombre: "Estilo de trabajo", factores: ["R", "D", "C"] },
  { nombre: "Temperamento", factores: ["Z", "E", "K"] },
  { nombre: "Subordinación", factores: ["F", "W"] },
];

/** Los 20 factores en el orden horario de la hoja de perfil, empezando en N. */
export const ORDEN_PERFIL: Factor[] = GRUPOS.flatMap((g) => g.factores);

/** Etiqueta breve de cada radio, como aparece impresa en la hoja de perfil. */
export const ETIQUETA_PERFIL: Record<Factor, string> = {
  N: "Necesidad de acabar una tarea",
  G: "Rol de trabajador duro",
  A: "Necesidad de logro",
  L: "Rol de líder",
  P: "Necesidad de controlar a otros",
  I: "Aplomo en la toma de decisiones",
  T: "Energía mental",
  V: "Energía física",
  X: "Necesidad de sobresalir",
  S: "Expresión social",
  B: "Necesidad de pertenecer a grupos",
  O: "Necesidad de afecto",
  R: "Tipo teórico",
  D: "Interés por el trabajo con detalles",
  C: "Tipo organizado",
  Z: "Necesidad de cambio",
  E: "Control emocional",
  K: "Necesidad de imponerse",
  F: "Necesidad de apoyo del jefe",
  W: "Necesidad de normas y reglamentos",
};

export interface ClaveItem {
  n: number;
  a: Factor;
  b: Factor;
}

export const CLAVE = claveJson as unknown as {
  version: string;
  fuente: string;
  estado: string;
  items: ClaveItem[];
};

/** Sigue sin estar firmada por el psicólogo: no deben emitirse informes clínicos. */
export const CLAVE_SIN_FIRMAR = true;

export const esRol = (f: Factor): f is Rol => (ROLES as readonly string[]).includes(f);

export type Respuestas = Record<number, Opcion>;

export interface ResultadoPapi {
  puntajes: Record<Factor, number>;
  /** Σ de los 20 factores. En un protocolo completo debe valer 90. */
  total: number;
  /** Σ de los diez roles. Debe valer 45 — control de cálculo del manual. */
  totalRoles: number;
  /** Σ de las diez necesidades. Debe valer 45. */
  totalNecesidades: number;
  respondidos: number;
  completo: boolean;
  /** Ambos controles de 45 se cumplen. */
  controlOk: boolean;
}

export function calificarPapi(respuestas: Respuestas): ResultadoPapi {
  const puntajes = Object.fromEntries(
    [...ROLES, ...NEEDS].map((f) => [f, 0]),
  ) as Record<Factor, number>;

  let respondidos = 0;
  for (const item of CLAVE.items) {
    const eleccion = respuestas[item.n];
    if (!eleccion) continue;
    respondidos++;
    puntajes[eleccion === "A" ? item.a : item.b] += 1;
  }

  const totalRoles = ROLES.reduce((s, f) => s + puntajes[f], 0);
  const totalNecesidades = NEEDS.reduce((s, f) => s + puntajes[f], 0);
  const completo = respondidos === 90;

  return {
    puntajes,
    total: totalRoles + totalNecesidades,
    totalRoles,
    totalNecesidades,
    respondidos,
    completo,
    controlOk: completo && totalRoles === 45 && totalNecesidades === 45,
  };
}

/** Bandas de interpretación por factor. Los textos viven en el manual. */
export function banda(p: number): "bajo" | "medio" | "alto" {
  if (p <= 2) return "bajo";
  if (p <= 6) return "medio";
  return "alto";
}

/* ------------------------------------------------------------------ *
 * Invariantes de la clave — se ejecutan en desarrollo
 * ------------------------------------------------------------------ */

export function verificarClave() {
  const errores: string[] = [];
  const items = CLAVE.items;

  // K1 — los 90 ítems, sin huecos ni duplicados
  const ns = items.map((i) => i.n).sort((a, b) => a - b);
  if (ns.length !== 90 || ns.some((n, i) => n !== i + 1)) {
    errores.push("K1: faltan ítems o hay duplicados");
  }

  // K2 — cada factor aparece exactamente 9 veces
  const cuenta = new Map<string, number>();
  for (const it of items) {
    cuenta.set(it.a, (cuenta.get(it.a) ?? 0) + 1);
    cuenta.set(it.b, (cuenta.get(it.b) ?? 0) + 1);
  }
  for (const f of [...ROLES, ...NEEDS]) {
    if (cuenta.get(f) !== 9) errores.push(`K2: el factor ${f} aparece ${cuenta.get(f) ?? 0} veces`);
  }

  // K3 — la diagonal no se cruza: cada ítem compara rol contra rol,
  //      o necesidad contra necesidad, nunca uno de cada tipo
  for (const it of items) {
    if (esRol(it.a) !== esRol(it.b)) {
      errores.push(`K3: el ítem ${it.n} mezcla ${it.a} con ${it.b}`);
    }
  }

  // K4 — los 90 pares son distintos entre sí
  const pares = new Set(items.map((i) => `${i.a}${i.b}`));
  if (pares.size !== 90) errores.push(`K4: solo hay ${pares.size} pares distintos`);

  // K5 — 45 ítems de rol y 45 de necesidad: el control de 45 del manual
  const deRol = items.filter((i) => esRol(i.a)).length;
  if (deRol !== 45) errores.push(`K5: hay ${deRol} ítems de rol, se esperan 45`);

  return { valida: errores.length === 0, errores };
}
