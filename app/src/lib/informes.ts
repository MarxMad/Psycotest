/**
 * Informes automáticos para el panel del psicólogo y el PDF.
 * Ya no son “borrador vacío”: usan bancos de interpretación alineados a los
 * manuales y a los reportes de referencia (Jorge Hdez Galvez, puestos MABE).
 */

import type { ResultadoMabe } from "./mabe";
import type { ResultadoPapi } from "./papi";
import type { ResultadoHartman } from "./hartman";
import { interpretarPapiCompleto } from "./interpretacion-papi";
import { interpretarHartmanCompleto } from "./interpretacion-hartman";
import { interpretarMabeCompleto } from "./interpretacion-mabe";

export function interpretarPapi(r: ResultadoPapi): string {
  return interpretarPapiCompleto(r);
}

export function interpretarHartman(r: ResultadoHartman): string {
  return interpretarHartmanCompleto(r);
}

export function interpretarMabe(
  r: ResultadoMabe,
  participante: string,
  puesto?: string,
): string {
  return interpretarMabeCompleto(r, participante, puesto);
}
