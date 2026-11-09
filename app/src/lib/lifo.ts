/**
 * Motor de calificación — LIFO® Orientaciones de Vida.
 *
 * Hoja de calificación (TABLA CALIF OK LIFO):
 *   18 grupos × 4 términos; el candidato ordena cada grupo con 4, 3, 2 y 1.
 *   La posición del término dentro del grupo es el estilo: 1.º Da/Ap,
 *   2.º Tm/Ct, 3.º Mt/Cs, 4.º Ad/Nc.
 *   · Condiciones habituales: ítems 1–12, 25–36 y 49–60 (grupos 1–3, 7–9, 13–15).
 *   · Condiciones de estrés: ítems 13–24, 37–48 y 61–72 (grupos 4–6, 10–12, 16–18).
 *   Cada estilo va de 9 a 36 por condición y los cuatro suman 90.
 *
 * Interpretación (manual §5 y §6.1.5):
 *   · Preferidos: a 3 puntos o menos del puntaje más alto.
 *   · Menos preferidos: a 3 puntos o menos del más bajo.
 *   · Seis perfiles básicos según las distancias entre las cuatro calificaciones.
 */

import {
  ESTILOS_LIFO,
  GRUPOS_LIFO,
  type EstiloLifo,
  type TipoPerfil,
} from "@/data/lifo";

export { ESTILOS_LIFO, GRUPOS_LIFO, type EstiloLifo, type TipoPerfil };

/** Grupo (1–18) → los números asignados a sus cuatro términos, en el orden de la hoja. */
export type RespuestasLifo = Record<number, number[]>;

export type Condicion = "habitual" | "estres";

export const GRUPOS_HABITUAL = [1, 2, 3, 7, 8, 9, 13, 14, 15];
export const GRUPOS_ESTRES = [4, 5, 6, 10, 11, 12, 16, 17, 18];

export const MIN_ESTILO = 9;
export const MAX_ESTILO = 36;
export const TOTAL_CONDICION = 90;

export type PuntajesLifo = Record<EstiloLifo, number>;

export type ResultadoCondicion = {
  puntajes: PuntajesLifo;
  total: number;
  /** De mayor a menor; los empates conservan el orden de la hoja. */
  orden: EstiloLifo[];
  preferidos: EstiloLifo[];
  menosPreferidos: EstiloLifo[];
  perfil: TipoPerfil;
  /**
   * Primario con una ventaja de 4 a 7 puntos: el manual pide 8 o más, pero
   * con los otros tres empatados no encaja en ningún otro perfil.
   */
  primarioModerado: boolean;
  /** Parejas con texto de combinación aplicable (claves de COMBINACIONES). */
  combinaciones: string[];
  /** En tríada, el estilo menos preferido que caracteriza al perfil. */
  ausente: EstiloLifo | null;
  /** Grupos de esta condición que no estaban bien contestados. */
  gruposInvalidos: number[];
};

export type ResultadoLifo = {
  habitual: ResultadoCondicion;
  estres: ResultadoCondicion;
  respondidas: number;
  completo: boolean;
  /** Los estilos preferidos no son los mismos bajo estrés. */
  cambiaBajoEstres: boolean;
  alertas: string[];
};

/** Un grupo vale solo si usa 4, 3, 2 y 1 exactamente una vez. */
export function grupoValido(valores: number[] | undefined): valores is number[] {
  if (!Array.isArray(valores) || valores.length !== 4) return false;
  const ordenados = [...valores].sort((a, b) => a - b);
  return ordenados.every((v, i) => v === i + 1);
}

/** Clave de COMBINACIONES para dos estilos, en el orden de la hoja. */
export function claveCombinacion(a: EstiloLifo, b: EstiloLifo): string {
  return [a, b].sort((x, y) => ESTILOS_LIFO.indexOf(x) - ESTILOS_LIFO.indexOf(y)).join("-");
}

export function puntuarCondicion(
  respuestas: RespuestasLifo,
  grupos: number[],
): { puntajes: PuntajesLifo; gruposInvalidos: number[] } {
  const puntajes: PuntajesLifo = { da: 0, tc: 0, mc: 0, an: 0 };
  const gruposInvalidos: number[] = [];
  for (const g of grupos) {
    const v = respuestas[g];
    if (!grupoValido(v)) {
      gruposInvalidos.push(g);
      continue;
    }
    ESTILOS_LIFO.forEach((e, i) => {
      puntajes[e] += v[i];
    });
  }
  return { puntajes, gruposInvalidos };
}

/**
 * §6.1.5 — seis perfiles básicos. Con s1 ≥ s2 ≥ s3 ≥ s4:
 *   uniforme      s1−s2 ≤ 3 y s2−s4 ≤ 3
 *   primario      s1−s2 ≥ 8 y s2−s4 ≤ 3   (4–7: primario moderado)
 *   tríada        s1−s2 ≤ 3, s1−s3 ≤ 5 y s3−s4 ≥ 3
 *   combinado     s1−s2 ≤ 3 y s2−s4 > 3
 *   diferenciado  s1−s2 > 3, s2−s4 > 3 y s2−s3 > 3
 *   back-up       s1−s2 > 3, s2−s4 > 3 y s2−s3 ≤ 3
 *
 * El texto del manual dice «mayor que 8» para el primario, pero su propio
 * ejemplo (29 21 20 20) tiene 8 justos: se toma ≥ 8.
 * El manual da «más de 2» para la segunda y tercera del diferenciado y
 * «3 o menos» para el back-up; se toma 3 como frontera para que no se
 * traslapen. Sus ejemplos caen igual con cualquiera de las dos.
 */
export function clasificarPerfil(puntajes: PuntajesLifo): {
  perfil: TipoPerfil;
  orden: EstiloLifo[];
  primarioModerado: boolean;
} {
  const orden = [...ESTILOS_LIFO].sort((a, b) => puntajes[b] - puntajes[a]);
  const [s1, s2, s3, s4] = orden.map((e) => puntajes[e]);
  const d12 = s1 - s2;
  const d24 = s2 - s4;

  let perfil: TipoPerfil;
  let primarioModerado = false;
  if (d12 <= 3 && d24 <= 3) perfil = "uniforme";
  else if (d12 > 3 && d24 <= 3) {
    perfil = "primario";
    primarioModerado = d12 < 8;
  } else if (d12 <= 3) perfil = s1 - s3 <= 5 && s3 - s4 >= 3 ? "triada" : "combinado";
  else perfil = s2 - s3 > 3 ? "diferenciado" : "backup";

  return { perfil, orden, primarioModerado };
}

function analizarCondicion(respuestas: RespuestasLifo, grupos: number[]): ResultadoCondicion {
  const { puntajes, gruposInvalidos } = puntuarCondicion(respuestas, grupos);
  const valores = ESTILOS_LIFO.map((e) => puntajes[e]);
  const max = Math.max(...valores);
  const min = Math.min(...valores);
  const { perfil, orden, primarioModerado } = clasificarPerfil(puntajes);

  const preferidos = orden.filter((e) => max - puntajes[e] <= 3);
  // En un perfil uniforme todo está «cerca» de ambos extremos: no hay un
  // menos preferido que señalar.
  const menosPreferidos =
    perfil === "uniforme"
      ? []
      : orden.filter((e) => puntajes[e] - min <= 3 && !preferidos.includes(e));

  const [p1, p2, p3, p4] = orden;
  const combinaciones =
    perfil === "combinado" || perfil === "diferenciado"
      ? [claveCombinacion(p1, p2)]
      : perfil === "backup"
        ? [claveCombinacion(p1, p2), claveCombinacion(p1, p3)]
        : [];

  return {
    puntajes,
    total: valores.reduce((a, b) => a + b, 0),
    orden,
    preferidos,
    menosPreferidos,
    perfil,
    primarioModerado,
    combinaciones,
    ausente: perfil === "triada" ? p4 : null,
    gruposInvalidos,
  };
}

export function calificarLifo(respuestas: RespuestasLifo): ResultadoLifo {
  const r = respuestas ?? {};
  const habitual = analizarCondicion(r, GRUPOS_HABITUAL);
  const estres = analizarCondicion(r, GRUPOS_ESTRES);
  const respondidas = GRUPOS_LIFO.filter((g) => grupoValido(r[g.id])).length;
  const completo = respondidas === GRUPOS_LIFO.length;

  const alertas: string[] = [];
  if (!completo) {
    const faltan = [...habitual.gruposInvalidos, ...estres.gruposInvalidos].sort((a, b) => a - b);
    alertas.push(`Protocolo incompleto: ${respondidas}/18 grupos (faltan ${faltan.join(", ")})`);
  }
  if (completo && habitual.total !== TOTAL_CONDICION) {
    alertas.push(`Condiciones habituales suman ${habitual.total} ≠ ${TOTAL_CONDICION}`);
  }
  if (completo && estres.total !== TOTAL_CONDICION) {
    alertas.push(`Condiciones de estrés suman ${estres.total} ≠ ${TOTAL_CONDICION}`);
  }

  const mismos = (a: EstiloLifo[], b: EstiloLifo[]) =>
    a.length === b.length && a.every((e) => b.includes(e));

  return {
    habitual,
    estres,
    respondidas,
    completo,
    cambiaBajoEstres: !mismos(habitual.preferidos, estres.preferidos),
    alertas,
  };
}
