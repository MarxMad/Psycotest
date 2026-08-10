/**
 * Motor de calificación — Inventario de Valores Hartman
 *
 * Implementa la especificación de `docs/HARTMAN-CALIFICACION.md` §3.15,
 * reconstruida a partir de las fórmulas del libro de calificación.
 *
 * Función pura: no toca base de datos, red ni DOM. Se prueba aislada.
 */

export type Eje = "I" | "E" | "S";

/** Orden normativo de Hartman para los 18 ítems a–r. */
export const NORMA = [6, 9, 10, 11, 13, 5, 17, 16, 12, 4, 1, 18, 2, 14, 8, 15, 3, 7];

/** Clave axiológica por ítem. Seis por eje. */
export const CLAVE: Eje[] = "ESSEEIESSIIIEIEISS".split("") as Eje[];

export const LETRAS = "abcdefghijklmnopqr".split("");

export interface ItemCalificado {
  id: string;
  norma: number;
  respuesta: number;
  eje: Eje;
  /** |respuesta − norma| */
  magnitud: number;
  /** Diferencia con signo, según la regla del dígito de la norma. */
  diferencia: number;
  /** Diferencia tras el ajuste de −2 (0, 1 y 2 se anulan). */
  ajustada: number;
  /** La respuesta y la norma tienen distinta cantidad de dígitos. */
  disimilitud: boolean;
}

export interface AgregadoEje {
  eje: Eje;
  /** Suma de los rankings del examinado en los 6 ítems del eje. */
  DIM: number;
  /** Suma de las diferencias ajustadas del eje. */
  INT: number;
  positivos: number;
  negativos: number;
  /** positivos + negativos */
  balance: number;
}

export interface ResultadoParte {
  items: ItemCalificado[];
  ejes: Record<Eje, AgregadoEje>;
  DIS: number;
  /** Suma de los tres DIM. Vale 171 en todo protocolo válido: es la comprobación de integridad. */
  DIF: number;
  DIM: number;
  INT: number;
  DIMpct: number;
  INTpct: number;
  /** Componente de cantidad: DIF + DIM + INT + DIS */
  Q1: number;
  /** Componente de calidad: DIM + INT + DIS */
  Q2: number;
  alertas: string[];
  interpretable: boolean;
}

export interface ResultadoHartman {
  VQ: ResultadoParte;
  SQ: ResultadoParte;
  compuestos: {
    componente: 1 | 2;
    BQr: number;
    BQa: number;
    CQ: number;
  }[];
  interpretable: boolean;
  motivo?: string;
}

/** Σ 1…18 — todo protocolo válido debe sumar esto. */
export const SUMA_ESPERADA = 171;

export function esPermutacionValida(r: number[]): boolean {
  if (r.length !== 18) return false;
  const vistos = new Set(r);
  if (vistos.size !== 18) return false;
  return r.every((v) => Number.isInteger(v) && v >= 1 && v <= 18);
}

const digitos = (n: number) => (n <= 9 ? 1 : 2);

export function calificarParte(respuestas: number[]): ResultadoParte {
  if (!esPermutacionValida(respuestas)) {
    throw new Error("Los 18 rankings deben ser una permutación de 1 a 18 sin repetir.");
  }

  const items: ItemCalificado[] = respuestas.map((p, i) => {
    const h = NORMA[i];
    const magnitud = Math.abs(p - h);

    // Regla de signo: depende de los dígitos de la NORMA, no de los del examinado.
    // Norma de un dígito (ítem de valor alto) → negativa si lo colocó peor.
    // Norma de dos dígitos (ítem de valor bajo) → negativa si lo colocó mejor.
    const negativa = h <= 9 ? p > h : p < h;
    const diferencia = negativa ? -magnitud : magnitud;

    // Ajuste −2: diferencias de 0, 1 y 2 se anulan.
    const ajustada = magnitud <= 2 ? 0 : Math.sign(diferencia) * (magnitud - 2);

    return {
      id: LETRAS[i],
      norma: h,
      respuesta: p,
      eje: CLAVE[i],
      magnitud,
      diferencia,
      ajustada,
      disimilitud: digitos(p) !== digitos(h),
    };
  });

  const DIS = items.filter((i) => i.disimilitud).length;

  const alertas: string[] = [];
  if (DIS % 2 !== 0) {
    alertas.push(
      `El número de disimilitudes es impar (${DIS}). Refleja un posible problema de inicio en la aplicación.`,
    );
  }

  const agregar = (eje: Eje): AgregadoEje => {
    const g = items.filter((i) => i.eje === eje);
    const positivos = g.filter((i) => i.ajustada > 0).reduce((s, i) => s + i.ajustada, 0);
    const negativos = g.filter((i) => i.ajustada < 0).reduce((s, i) => s + i.ajustada, 0);
    return {
      eje,
      DIM: g.reduce((s, i) => s + i.respuesta, 0),
      INT: g.reduce((s, i) => s + i.ajustada, 0),
      positivos,
      negativos,
      balance: positivos + negativos,
    };
  };

  const ejes = { I: agregar("I"), E: agregar("E"), S: agregar("S") };

  const DIF = ejes.I.DIM + ejes.E.DIM + ejes.S.DIM; // = 171, integridad
  const DIM = ejes.I.balance + ejes.E.balance + ejes.S.balance;
  const INT = ejes.I.INT + ejes.E.INT + ejes.S.INT;

  const interpretable = DIS < 6;
  if (!interpretable) {
    alertas.push(
      `Con ${DIS} disimilitudes el inventario no se interpreta. Se requiere revisión manual o reaplicación.`,
    );
  }

  return {
    items,
    ejes,
    DIS,
    DIF,
    DIM,
    INT,
    DIMpct: DIF === 0 ? 0 : (DIM * 100) / DIF,
    INTpct: DIF === 0 ? 0 : (INT * 100) / DIF,
    Q1: DIF + DIM + INT + DIS,
    Q2: DIM + INT + DIS,
    alertas,
    interpretable,
  };
}

export function calificarHartman(parteI: number[], parteII: number[]): ResultadoHartman {
  const VQ = calificarParte(parteI);
  const SQ = calificarParte(parteII);

  const interpretable = VQ.interpretable && SQ.interpretable;
  if (!interpretable) {
    return {
      VQ,
      SQ,
      compuestos: [],
      interpretable: false,
      motivo: "Seis o más disimilitudes: el inventario no se interpreta.",
    };
  }

  const compuestos = ([1, 2] as const).map((componente) => {
    const v = componente === 1 ? VQ.Q1 : VQ.Q2;
    const s = componente === 1 ? SQ.Q1 : SQ.Q2;
    const BQr = v === 0 ? 0 : s / v;
    const BQa = (s + v) / 2;
    return { componente, BQr, BQa, CQ: BQr * BQa };
  });

  return { VQ, SQ, compuestos, interpretable: true };
}

/* ------------------------------------------------------------------ *
 * Hoja Gráfica — conversión de puntaje bruto a nivel de desarrollo
 * ------------------------------------------------------------------ */

export const NIVELES = [
  "Excelente",
  "Muy bueno",
  "Bueno",
  "Promedio",
  "Pobre",
  "Muy pobre",
  "Pésimo",
] as const;

/** Inicio de cada banda (niveles 1–6) y máximo de la columna. */
const BANDAS: Record<string, { inicio: number[]; max: number }> = {
  DIM_EJE: { inicio: [1, 8, 15, 22, 29, 36], max: 42 },
  DIF: { inicio: [22, 32, 42, 52, 62, 72], max: 80 },
  DIM: { inicio: [0, 4, 8, 12, 16, 20], max: 23 },
  DIM_PCT: { inicio: [2, 12, 22, 32, 42, 52], max: 60 },
  INT_EJE: { inicio: [0, 1, 6, 13, 20, 27], max: 33 },
  INT: { inicio: [1, 8, 15, 22, 29, 36], max: 42 },
  INT_PCT: { inicio: [2, 12, 22, 32, 42, 52], max: 60 },
  DI: { inicio: [0, 4, 8, 12, 16, 20], max: 23 },
  Q1: { inicio: [1, 56, 71, 86, 101, 116], max: 130 },
  Q2: { inicio: [1, 8, 15, 22, 29, 36], max: 42 },
  BQr: { inicio: [0.1, 1.6, 2.1, 2.6, 3.1, 3.6], max: 4.0 },
  BQa1: { inicio: [1, 56, 71, 86, 101, 116], max: 130 },
  BQa2: { inicio: [1, 8, 15, 22, 29, 36], max: 42 },
  CQ1: { inicio: [1, 90, 149, 224, 313, 418], max: 508 },
  CQ2: { inicio: [1, 13, 32, 57, 90, 130], max: 180 },
};

/** Devuelve el nivel de desarrollo 1–7 para una columna del perfil. */
export function nivel(columna: keyof typeof BANDAS, valor: number): number {
  const b = BANDAS[columna];
  if (!b) return 0;
  const v = Math.abs(valor);
  if (v > b.max) return 7;
  for (let n = 6; n >= 1; n--) if (v >= b.inicio[n - 1]) return n;
  return 1;
}

export const etiquetaNivel = (n: number) => NIVELES[Math.min(Math.max(n, 1), 7) - 1];
