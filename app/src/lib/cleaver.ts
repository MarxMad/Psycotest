/**
 * Motor de calificación — Técnica Cleaver (Autodescripción / Self Description)
 *
 * Fuentes: Manual Cleaver.pdf, Plantilla de calificación.pdf, Hoja de calificación.pdf
 * Spec: docs/CLEAVER-CALIFICACION.md
 *
 * 24 series × 4 adjetivos. En cada serie:
 *   M = la que MÁS lo describe · L = la que MENOS lo describe
 * Conteos M/L por factor D/I/S/C; T = M − L; validez ΣT ≈ 0.
 * Baremo → intensidad gráfica 0–100; aplanado = 40–60 (manual).
 */

import itemsJson from "@/data/cleaver-items.json";
import baremoJson from "@/data/cleaver-baremo.json";
import interpJson from "@/data/cleaver-interpretacion.json";

export type FactorCleaver = "D" | "I" | "S" | "C";
export const FACTORES_CLEAVER: FactorCleaver[] = ["D", "I", "S", "C"];

export const NOMBRES_FACTOR: Record<FactorCleaver, string> = {
  D: "Dominio",
  I: "Influencia",
  S: "Constancia / Steadiness",
  C: "Apego / Cumplimiento",
};

export type EleccionSerie = { mas: number; menos: number };
/** Respuestas: serie (1–24) → { mas, menos } */
export type RespuestasCleaver = Record<number, EleccionSerie>;

export type SerieCleaver = {
  id: number;
  adjetivos: { texto: string; factor: FactorCleaver }[];
};

export const SERIES_CLEAVER = itemsJson.series as SerieCleaver[];

export type ConteosFactor = Record<FactorCleaver, number>;

export type GraficaCleaver = {
  M: ConteosFactor;
  L: ConteosFactor;
  T: ConteosFactor;
};

export type EstiloClasico = {
  id: number;
  nombre: string;
  segmento: string;
  resumen: string;
};

export type ResultadoCleaver = {
  M: ConteosFactor;
  L: ConteosFactor;
  T: ConteosFactor;
  /** Intensidad gráfica 0–100 según baremo */
  grafica: GraficaCleaver;
  aplanado: { M: boolean; L: boolean; T: boolean };
  estiloClasico: EstiloClasico | null;
  combinaciones: { id: string; nombre: string; texto: string }[];
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

export function factorDominante(T: ConteosFactor): FactorCleaver {
  return [...FACTORES_CLEAVER].sort(
    (a, b) => T[b] - T[a] || FACTORES_CLEAVER.indexOf(a) - FACTORES_CLEAVER.indexOf(b),
  )[0];
}

function lookup(
  map: Record<string, number>,
  raw: number,
  clampMin: number,
  clampMax: number,
): number {
  const clamped = Math.max(clampMin, Math.min(clampMax, raw));
  const key = String(Math.round(clamped));
  if (key in map) return map[key];
  const nums = Object.keys(map)
    .map(Number)
    .sort((a, b) => a - b);
  if (clamped <= nums[0]) return map[String(nums[0])];
  if (clamped >= nums[nums.length - 1]) return map[String(nums[nums.length - 1])];
  for (let i = 0; i < nums.length - 1; i++) {
    const a = nums[i];
    const b = nums[i + 1];
    if (clamped >= a && clamped <= b) {
      const t = (clamped - a) / (b - a || 1);
      return map[String(a)] + t * (map[String(b)] - map[String(a)]);
    }
  }
  return 50;
}

export function aplicarBaremoML(raw: number, tipo: "M" | "L"): number {
  return lookup(baremoJson[tipo] as Record<string, number>, raw, 0, 24);
}

export function aplicarBaremoT(raw: number): number {
  return lookup(baremoJson.T as Record<string, number>, raw, -12, 12);
}

export function esAplanado(g: ConteosFactor): boolean {
  const lo = baremoJson.aplanadoMin as number;
  const hi = baremoJson.aplanadoMax as number;
  return FACTORES_CLEAVER.every((f) => g[f] >= lo && g[f] <= hi);
}

function banda(g: number): "alto" | "medio" | "bajo" {
  if (g >= 60) return "alto";
  if (g <= 40) return "bajo";
  return "medio";
}

export function detectarEstiloClasico(graficaT: ConteosFactor): EstiloClasico | null {
  if (esAplanado(graficaT)) return null;
  const d = banda(graficaT.D);
  const i = banda(graficaT.I);
  const s = banda(graficaT.S);
  const c = banda(graficaT.C);
  const estilos = interpJson.estilosClasicos as EstiloClasico[];

  let id = 2;
  if (d === "alto" && i === "alto") id = 3;
  else if (d === "alto" && i !== "alto" && s === "bajo") id = 1;
  else if (d === "alto") id = 2;
  else if (i === "alto" && d === "bajo" && s === "alto") id = 8;
  else if (i === "alto" && c !== "alto") id = 4;
  else if (c === "alto" && s === "alto") id = 6;
  else if (c === "alto") id = 5;
  else if (s === "alto") id = 7;

  return estilos.find((e) => e.id === id) ?? null;
}

export function combinacionesActivas(
  T: ConteosFactor,
): { id: string; nombre: string; texto: string }[] {
  const bank = interpJson.combinaciones as {
    id: string;
    nombre: string;
    regla: string;
    texto: string;
  }[];

  const scored = bank
    .map((row) => {
      const [a, b] = row.id.split("") as [FactorCleaver, FactorCleaver];
      return { row, mag: T[a] - T[b] };
    })
    .filter((x) => x.mag > 0)
    .sort((a, b) => b.mag - a.mag)
    .slice(0, 4);

  return scored.map(({ row }) => ({
    id: row.id,
    nombre: row.nombre,
    texto: row.texto,
  }));
}

export function textoGenericoFactor(f: FactorCleaver, intensidad: number): string {
  if (intensidad >= 60) return (interpJson.alto as Record<FactorCleaver, string>)[f];
  if (intensidad <= 40) return (interpJson.bajo as Record<FactorCleaver, string>)[f];
  return `Nivel intermedio en ${NOMBRES_FACTOR[f]} (zona 40–60): matizar con entrevista y contexto del puesto.`;
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

  const grafica: GraficaCleaver = {
    M: {
      D: aplicarBaremoML(M.D, "M"),
      I: aplicarBaremoML(M.I, "M"),
      S: aplicarBaremoML(M.S, "M"),
      C: aplicarBaremoML(M.C, "M"),
    },
    L: {
      D: aplicarBaremoML(L.D, "L"),
      I: aplicarBaremoML(L.I, "L"),
      S: aplicarBaremoML(L.S, "L"),
      C: aplicarBaremoML(L.C, "L"),
    },
    T: {
      D: aplicarBaremoT(T.D),
      I: aplicarBaremoT(T.I),
      S: aplicarBaremoT(T.S),
      C: aplicarBaremoT(T.C),
    },
  };

  return {
    M,
    L,
    T,
    grafica,
    aplanado: {
      M: esAplanado(grafica.M),
      L: esAplanado(grafica.L),
      T: esAplanado(grafica.T),
    },
    estiloClasico: detectarEstiloClasico(grafica.T),
    combinaciones: combinacionesActivas(T),
    validez,
    validezEtiqueta: etiquetaValidez(validez),
    respondidas,
    completo,
    alertas,
  };
}
