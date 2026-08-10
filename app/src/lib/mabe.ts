/**
 * Motor de calificación — MABE (Managerial Behavior Evaluation)
 * Cuadernillo: mabe-cuestionario.ts · Claves: mabe-keys.json (Excel verificado)
 */

import keysJson from "@/data/mabe-keys.json";
import { MABE_BLOQUES, MABE_ESCALA, type ItemMabe } from "@/data/mabe-cuestionario";

export { MABE_BLOQUES, MABE_ESCALA };

export const CUADRANTES = ["A", "L", "I", "V"] as const;
export const VALORES = ["T", "E", "A", "S", "P", "R"] as const;

export type Cuadrante = (typeof CUADRANTES)[number];
export type Valor = (typeof VALORES)[number];

export type RespuestasMabe = Record<string, number>;

const oldGroups = keysJson.groups as Array<{
  id: string;
  items: Array<{ id: string; block: string; tag?: string | null }>;
}>;

/** Ítems con texto del cuadernillo + bloque de calificación del Excel. */
export interface ItemMabeUI extends ItemMabe {
  block: string;
}

export interface GrupoMabeUI {
  id: string;
  title: string;
  subtitle: string;
  instrucciones: string[];
  encabezado?: string[];
  secciones: Array<{ id: string; titulo: string; items: ItemMabeUI[] }>;
  items: ItemMabeUI[];
}

function buildGrupos(): GrupoMabeUI[] {
  return MABE_BLOQUES.map((bloque) => {
    const old = oldGroups.find((g) => g.id === bloque.id);
    if (!old) throw new Error(`Grupo MABE sin claves: ${bloque.id}`);

    const flatNew = bloque.secciones.flatMap((s) => s.items);
    if (flatNew.length !== old.items.length) {
      throw new Error(
        `MABE ${bloque.id}: ${flatNew.length} ítems en cuadernillo vs ${old.items.length} en claves Excel`,
      );
    }

    const merged: ItemMabeUI[] = flatNew.map((item, i) => ({
      ...item,
      block: old.items[i].block,
      tag: old.items[i].tag ?? item.tag,
    }));

    let cursor = 0;
    const secciones = bloque.secciones.map((sec) => {
      const slice = merged.slice(cursor, cursor + sec.items.length);
      cursor += sec.items.length;
      return { id: sec.id, titulo: sec.titulo, items: slice };
    });

    return {
      id: bloque.id,
      title: bloque.titulo,
      subtitle: bloque.subtitulo,
      instrucciones: bloque.instrucciones,
      encabezado: bloque.encabezado,
      secciones,
      items: merged,
    };
  });
}

function buildKeys(): Record<string, string[]> {
  const idMap = new Map<string, string>();
  for (const g of oldGroups) {
    const ui = GRUPOS_MABE.find((x) => x.id === g.id)!;
    g.items.forEach((oldItem, i) => {
      idMap.set(`${g.id}:${oldItem.id}`, ui.items[i].id);
    });
  }

  const raw = keysJson.keys as Record<string, string[]>;
  const out: Record<string, string[]> = {};
  for (const [key, refs] of Object.entries(raw)) {
    out[key] = refs.map((oldRef) => {
      for (const g of oldGroups) {
        if (g.items.some((it) => it.id === oldRef)) {
          return idMap.get(`${g.id}:${oldRef}`) ?? oldRef;
        }
      }
      return oldRef;
    });
  }
  return out;
}

export const GRUPOS_MABE = buildGrupos();
const KEYS = buildKeys();

export const NOMBRES_CUADRANTE: Record<Cuadrante, string> = {
  A: "Analítico",
  L: "Lógico",
  I: "Intuitivo",
  V: "Visionario",
};

export const NOMBRES_VALOR: Record<Valor, string> = {
  T: "Teórico",
  E: "Económico",
  A: "Estético",
  S: "Social",
  P: "Político",
  R: "Religioso",
};

export function promedioMabe(valor: number): number {
  const entero = Math.trunc(valor);
  const frac = valor - entero;
  if (frac < 0.5) return entero;
  if (frac === 0.5) return valor;
  return entero + 1;
}

function suma(respuestas: RespuestasMabe, refs: string[]): number {
  return refs.reduce((acc, ref) => acc + (respuestas[ref] ?? 0), 0);
}

export interface CurvaCuadrante {
  cuadrante: Cuadrante;
  bruto: number;
  desviacion: number;
  escalado: number;
  grafica: number;
}

export interface CurvaValor {
  valor: Valor;
  bruto: number;
  desviacion: number;
  escalado: number;
  grafica: number;
}

export interface ResultadoMabe {
  procPuesto: {
    cuadrantes: CurvaCuadrante[];
    total: number;
    promedio: number;
  };
  procPersona: {
    cuadrantes: CurvaCuadrante[];
    promedios: Record<Cuadrante, number>;
  };
  valPuesto: {
    valores: CurvaValor[];
    total: number;
    promedio: number;
  };
  valPersona: {
    valores: CurvaValor[];
    total: number;
    promedio: number;
  };
  combinaciones: {
    L: number;
    R: number;
    C: number;
    S: number;
  };
  brechas: {
    proceso: Record<Cuadrante, number>;
    valores: Record<Valor, number>;
  };
  completo: boolean;
  faltantes: string[];
}

function calificarProcPuesto(respuestas: RespuestasMabe): ResultadoMabe["procPuesto"] {
  const brutos: Record<Cuadrante, number> = { A: 0, L: 0, I: 0, V: 0 };
  for (const q of CUADRANTES) {
    brutos[q] = suma(respuestas, KEYS[`procPuesto_${q}`]);
  }
  const total = CUADRANTES.reduce((a, q) => a + brutos[q], 0);
  const promedio = promedioMabe(total / 4);
  const cuadrantes = CUADRANTES.map((q) => {
    const desviacion = brutos[q] - promedio;
    const escalado = desviacion * 5;
    return {
      cuadrante: q,
      bruto: brutos[q],
      desviacion,
      escalado,
      grafica: escalado + 70,
    };
  });
  return { cuadrantes, total, promedio };
}

function calificarProcPersona(respuestas: RespuestasMabe): ResultadoMabe["procPersona"] {
  const promedios: Record<Cuadrante, number> = { A: 0, L: 0, I: 0, V: 0 };
  const cuadrantes = CUADRANTES.map((q) => {
    const sI = suma(respuestas, KEYS[`procPs_I_${q}`]);
    const sII = suma(respuestas, KEYS[`procPs_II_${q}`]);
    const sIII = suma(respuestas, KEYS[`procPs_III_${q}`]);
    const promedio = (sI * 2 + sII * 3 + sIII * 5) / 10;
    promedios[q] = promedio;
    const desviacion = promedio - 5;
    const escalado = desviacion * 5;
    return {
      cuadrante: q,
      bruto: promedio,
      desviacion,
      escalado,
      grafica: escalado,
    };
  });
  return { cuadrantes, promedios };
}

function calificarValPuesto(respuestas: RespuestasMabe): ResultadoMabe["valPuesto"] {
  const brutos: Record<Valor, number> = { T: 0, E: 0, A: 0, S: 0, P: 0, R: 0 };
  for (const v of VALORES) {
    brutos[v] = suma(respuestas, KEYS[`valPuesto_${v}`]);
  }
  const total = VALORES.reduce((a, v) => a + brutos[v], 0);
  const promedio = total / 6;
  const valores = VALORES.map((v) => {
    const desviacion = brutos[v] - promedio;
    const escalado = desviacion * 6;
    return {
      valor: v,
      bruto: brutos[v],
      desviacion,
      escalado,
      grafica: escalado + 50,
    };
  });
  return { valores, total, promedio };
}

function calificarValPersona(respuestas: RespuestasMabe): ResultadoMabe["valPersona"] {
  const brutos: Record<Valor, number> = { T: 0, E: 0, A: 0, S: 0, P: 0, R: 0 };
  for (const v of VALORES) {
    brutos[v] = suma(respuestas, KEYS[`valPs_${v}`]);
  }
  const total = VALORES.reduce((a, v) => a + brutos[v], 0);
  const promedio = total / 6;
  const valores = VALORES.map((v) => {
    const desviacion = brutos[v] - promedio;
    const escalado = desviacion * 6;
    return {
      valor: v,
      bruto: brutos[v],
      desviacion,
      escalado,
      grafica: escalado + 50,
    };
  });
  return { valores, total, promedio };
}

export function calificarMabe(respuestas: RespuestasMabe): ResultadoMabe {
  const allRefs = GRUPOS_MABE.flatMap((g) => g.items.map((it) => it.id));
  const faltantes = allRefs.filter((r) => {
    const v = respuestas[r];
    return v == null || v < 1 || v > 5;
  });

  const procPuesto = calificarProcPuesto(respuestas);
  const procPersona = calificarProcPersona(respuestas);
  const valPuesto = calificarValPuesto(respuestas);
  const valPersona = calificarValPersona(respuestas);

  const pp = Object.fromEntries(
    procPuesto.cuadrantes.map((c) => [c.cuadrante, c.bruto]),
  ) as Record<Cuadrante, number>;
  const combinaciones = {
    L: pp.A + pp.L,
    R: pp.I + pp.V,
    C: pp.A + pp.V,
    S: pp.L + pp.I,
  };

  const brechas = {
    proceso: Object.fromEntries(
      CUADRANTES.map((q) => {
        const p = procPuesto.cuadrantes.find((c) => c.cuadrante === q)!;
        const per = procPersona.cuadrantes.find((c) => c.cuadrante === q)!;
        return [q, Math.round((per.grafica - p.grafica) * 10) / 10];
      }),
    ) as Record<Cuadrante, number>,
    valores: Object.fromEntries(
      VALORES.map((v) => {
        const p = valPuesto.valores.find((x) => x.valor === v)!;
        const per = valPersona.valores.find((x) => x.valor === v)!;
        return [v, Math.round((per.grafica - p.grafica) * 10) / 10];
      }),
    ) as Record<Valor, number>,
  };

  return {
    procPuesto,
    procPersona,
    valPuesto,
    valPersona,
    combinaciones,
    brechas,
    completo: faltantes.length === 0,
    faltantes,
  };
}

export function respuestasVaciasMabe(): RespuestasMabe {
  const r: RespuestasMabe = {};
  for (const g of GRUPOS_MABE) {
    for (const item of g.items) r[item.id] = 0;
  }
  return r;
}
