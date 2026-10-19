/**
 * Factor Humano / Job Analysis (Cleaver) — perfil del puesto.
 *
 * Manual Cleaver §5 + plantilla Análisis del Trabajo:
 * 24 ítems (6 por factor). Rating 1–5 → R, A, D=R−A, D%=D×X(A), gráfica=50+D%.
 */

import jobJson from "@/data/cleaver-job-items.json";
import { FACTORES_CLEAVER, type ConteosFactor, type FactorCleaver } from "./cleaver";

export type ItemCleaverJob = {
  id: number;
  factor: FactorCleaver;
  texto: string;
};

export const ITEMS_CLEAVER_JOB = jobJson.items as ItemCleaverJob[];

/** itemId → rating 1..5 */
export type RespuestasCleaverJob = Record<number, number>;

export type ResultadoCleaverJob = {
  R: ConteosFactor;
  A: number;
  D: ConteosFactor;
  Dpct: ConteosFactor;
  grafica: ConteosFactor;
  multiplicador: number;
  aplanado: boolean;
  completo: boolean;
  respondidas: number;
  alertas: string[];
};

type MultRow = { min: number; max: number; x: number };
const MULT = (jobJson as { multiplicadorPorPromedioA: MultRow[] }).multiplicadorPorPromedioA;

function vacio(): ConteosFactor {
  return { D: 0, I: 0, S: 0, C: 0 };
}

/** Redondeo Cleaver de A: .25→abajo, .50 se conserva, .75→arriba */
export function redondearPromedioCleaver(n: number): number {
  const base = Math.floor(n);
  const frac = n - base;
  if (frac < 0.5) return base; // incluye .25 → inferior
  if (frac < 0.75) return base + 0.5;
  return base + 1;
}

export function multiplicadorDesdeA(A: number): number {
  for (const row of MULT) {
    if (A + 1e-9 >= row.min && A - 1e-9 <= row.max) return row.x;
  }
  if (A < 12) return 8;
  return 3.5;
}

export function calificarCleaverJob(respuestas: RespuestasCleaverJob): ResultadoCleaverJob {
  const R = vacio();
  const alertas: string[] = [];
  let respondidas = 0;

  for (const item of ITEMS_CLEAVER_JOB) {
    const v = respuestas[item.id];
    if (v === undefined || v === null) continue;
    respondidas++;
    if (!Number.isFinite(v) || v < 1 || v > 5) {
      alertas.push(`Ítem ${item.id}: rating fuera de 1–5.`);
      continue;
    }
    R[item.factor] += v;
  }

  const completo = respondidas === ITEMS_CLEAVER_JOB.length;
  const sumaR = R.D + R.I + R.S + R.C;
  const A = completo ? redondearPromedioCleaver(sumaR / 4) : 0;
  const x = completo ? multiplicadorDesdeA(A) : 0;

  const D: ConteosFactor = {
    D: R.D - A,
    I: R.I - A,
    S: R.S - A,
    C: R.C - A,
  };
  const Dpct: ConteosFactor = {
    D: D.D * x,
    I: D.I * x,
    S: D.S * x,
    C: D.C * x,
  };
  const grafica: ConteosFactor = {
    D: 50 + Dpct.D,
    I: 50 + Dpct.I,
    S: 50 + Dpct.S,
    C: 50 + Dpct.C,
  };

  const aplanado =
    completo && FACTORES_CLEAVER.every((f) => grafica[f] >= 40 && grafica[f] <= 60);

  if (completo) {
    const pos = FACTORES_CLEAVER.filter((f) => D[f] > 0).reduce((s, f) => s + D[f], 0);
    const neg = FACTORES_CLEAVER.filter((f) => D[f] < 0).reduce((s, f) => s + Math.abs(D[f]), 0);
    if (Math.abs(pos - neg) > 1.01) {
      alertas.push(`Verificación D: +${pos} vs −${neg} (tolerancia por redondeo de A).`);
    }
  }

  return { R, A, D, Dpct, grafica, multiplicador: x, aplanado, completo, respondidas, alertas };
}

export function brechaPersonaPuesto(
  graficaPersonaT: ConteosFactor,
  graficaPuesto: ConteosFactor,
): ConteosFactor {
  return {
    D: graficaPersonaT.D - graficaPuesto.D,
    I: graficaPersonaT.I - graficaPuesto.I,
    S: graficaPersonaT.S - graficaPuesto.S,
    C: graficaPersonaT.C - graficaPuesto.C,
  };
}

export type CleaverPuestoPayload = {
  respuestas: RespuestasCleaverJob;
  resultado: ResultadoCleaverJob;
};

export function asCleaverPuesto(raw: unknown): CleaverPuestoPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Partial<CleaverPuestoPayload>;
  if (!obj.resultado || typeof obj.resultado !== "object") return null;
  return obj as CleaverPuestoPayload;
}
