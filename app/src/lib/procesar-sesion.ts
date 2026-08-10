/**
 * Calificación e interpretación centralizadas (manual MABE / PAPI / Hartman).
 * Usado al finalizar una aplicación y en el endpoint público.
 */

import type { Instrumento } from "./storage";
import { calificarHartman } from "./hartman";
import { calificarMabe, type RespuestasMabe } from "./mabe";
import { calificarPapi, type Respuestas } from "./papi";
import { interpretarHartman, interpretarMabe, interpretarPapi } from "./informes";

export function procesarSesion(
  instrumento: Instrumento,
  respuestas: unknown,
  participante: string,
  puesto?: string,
): { calificacion: unknown; interpretacion: string } {
  switch (instrumento) {
    case "papi": {
      const cal = calificarPapi(respuestas as Respuestas);
      return { calificacion: cal, interpretacion: interpretarPapi(cal) };
    }
    case "hartman": {
      const r = respuestas as { parteI: number[]; parteII: number[] };
      const cal = calificarHartman(r.parteI, r.parteII);
      return { calificacion: cal, interpretacion: interpretarHartman(cal) };
    }
    case "mabe": {
      const cal = calificarMabe(respuestas as RespuestasMabe);
      return {
        calificacion: cal,
        interpretacion: interpretarMabe(cal, participante, puesto),
      };
    }
    default:
      throw new Error(`Instrumento no soportado: ${instrumento}`);
  }
}
