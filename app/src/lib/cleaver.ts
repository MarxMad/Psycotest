/**
 * Motor de calificación — Técnica Cleaver (Autodescripción / Self Description)
 *
 * Fuentes: Manual Cleaver.pdf, Plantilla de calificación.pdf, Hoja de calificación.pdf
 * Spec: docs/CLEAVER-CALIFICACION.md
 *
 * 24 series de 4 adjetivos. En cada serie el evaluado elige:
 *   M = la que MÁS lo describe
 *   L = la que MENOS lo describe
 * Cada adjetivo pertenece a un factor D, I, S o C.
 * Conteos M y L por factor; T = M − L. Validez: Σ T ≈ 0.
 */

import itemsJson from "@/data/cleaver-items.json";

export type FactorCleaver = "D" | "I" | "S" | "C";
export const FACTORES_CLEAVER: FactorCleaver[] = ["D", "I", "S", "C"];

export const NOMBRES_FACTOR: Record<FactorCleaver, string> = {
  D: "Dominio",
  I: "Influencia",
  S: "Constancia / Steadiness",
  C: "Apego / Cumplimiento",
};

export type EleccionSerie = { mas: number; menos: number }; // índices 0–3
/** Respuestas: serie (1–24) → { mas, menos } */
export type RespuestasCleaver = Record<number, EleccionSerie>;

export type SerieCleaver = {
  id: number;
  adjetivos: { texto: string; factor: FactorCleaver }[];
};

export const SERIES_CLEAVER = itemsJson.series as SerieCleaver[];

export type ConteosFactor = Record<FactorCleaver, number>;

export type ResultadoCleaver = {
  /** Conteos columna M (estilo motivado) */
  M: ConteosFactor;
  /** Conteos columna L (bajo presión / limitaciones) */
  L: ConteosFactor;
  /** Totales T = M − L (estilo cotidiano / gráfico T) */
  T: ConteosFactor;
  /** Σ T; protocolo válido cerca de 0 (−6…+6) */
  validez: number;
  validezEtiqueta: "valida" | "sospechosa" | "invalida";
  respondidas: number;
  completo: boolean;
  alertas: string[];
};

function vacio(): ConteosFactor {
  return { D: 0, I: 0, S: 0, C: 0 };
}

export function etiquetaValidez(v: number): ResultadoCleaver["validezEtiqueta"] {
  const a = Math.abs(v);
  if (a <= 3) return "valida";
  if (a <= 5) return "sospechosa";
  return "invalida";
}

/** Factor dominante (mayor |T| con signo; desempate D>I>S>C). */
export function factorDominante(T: ConteosFactor): FactorCleaver {
  return [...FACTORES_CLEAVER].sort((a, b) => T[b] - T[a] || FACTORES_CLEAVER.indexOf(a) - FACTORES_CLEAVER.indexOf(b))[0];
}

export function calificarCleaver(respuestas: RespuestasCleaver): ResultadoCleaver {
  const M = vacio();
  const L = vacio();
  const alertas: string[] = [];
  let respondidas = 0;

  for (const serie of SERIES_CLEAVER) {
    const r = respuestas[serie.id];
    if (!r) continue;
    respondidas++;
    if (r.mas === r.menos) {
      alertas.push(`Serie ${serie.id}: M y L no pueden ser el mismo adjetivo.`);
      continue;
    }
    if (r.mas < 0 || r.mas > 3 || r.menos < 0 || r.menos > 3) {
      alertas.push(`Serie ${serie.id}: índices fuera de rango.`);
      continue;
    }
    M[serie.adjetivos[r.mas].factor] += 1;
    L[serie.adjetivos[r.menos].factor] += 1;
  }

  const T: ConteosFactor = {
    D: M.D - L.D,
    I: M.I - L.I,
    S: M.S - L.S,
    C: M.C - L.C,
  };
  const validez = T.D + T.I + T.S + T.C;
  const completo = respondidas === SERIES_CLEAVER.length;

  if (completo) {
    const sumM = M.D + M.I + M.S + M.C;
    const sumL = L.D + L.I + L.S + L.C;
    if (sumM !== 24 || sumL !== 24) {
      alertas.push(`Sumas M=${sumM} L=${sumL} (se esperan 24/24).`);
    }
  }

  return {
    M,
    L,
    T,
    validez,
    validezEtiqueta: etiquetaValidez(validez),
    respondidas,
    completo,
    alertas,
  };
}
