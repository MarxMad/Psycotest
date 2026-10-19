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
import type { ResultadoCleaver } from "./cleaver";
import {
  FACTORES_CLEAVER,
  NOMBRES_FACTOR,
  factorDominante,
  textoGenericoFactor,
} from "./cleaver";

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

export function interpretarCleaver(r: ResultadoCleaver): string {
  const dom = factorDominante(r.T);
  const lineas = [
    "Informe — Cleaver (Autodescripción / DISC)",
    "",
    `Protocolo: ${r.completo ? "completo" : `incompleto (${r.respondidas}/24)`} · Validez ΣT=${r.validez} (${r.validezEtiqueta})`,
    "",
    "Conteos M (motivado) / L (presión) / T (cotidiano):",
    ...FACTORES_CLEAVER.map(
      (f) =>
        `· ${f} ${NOMBRES_FACTOR[f]}: M=${r.M[f]}  L=${r.L[f]}  T=${r.T[f] >= 0 ? "+" : ""}${r.T[f]}  · gráfica T=${Math.round(r.grafica.T[f])}`,
    ),
    "",
    `Factor dominante en T: ${dom} (${NOMBRES_FACTOR[dom]}).`,
    "",
    "Lectura de gráficas (manual):",
    "· M — estilo motivado / deseos básicos",
    "· L — limitaciones bajo presión",
    "· T — conducta cotidiana observable",
    "",
    `Perfiles aplanados (40–60): M=${r.aplanado.M ? "sí" : "no"} · L=${r.aplanado.L ? "sí" : "no"} · T=${r.aplanado.T ? "sí" : "no"}`,
    ...(r.aplanado.T
      ? [
          "· T aplanada: interpretar M y L por separado; riqueza informativa limitada en el estilo cotidiano.",
        ]
      : []),
    "",
    ...(r.estiloClasico
      ? [
          `Estilo clásico sugerido: #${r.estiloClasico.id} ${r.estiloClasico.nombre} (${r.estiloClasico.segmento})`,
          r.estiloClasico.resumen,
          "",
        ]
      : ["Estilo clásico: no asignado (perfil aplanado o mixto).", ""]),
    ...(r.combinaciones.length
      ? [
          "Combinaciones básicas activas (gráfica T):",
          ...r.combinaciones.map((c) => `· ${c.nombre} (${c.id}): ${c.texto}`),
          "",
        ]
      : []),
    "Descripción genérica por factor (según intensidad en T):",
    ...FACTORES_CLEAVER.map((f) => `· ${f}: ${textoGenericoFactor(f, r.grafica.T[f])}`),
    "",
    ...(r.alertas.length ? ["Alertas:", ...r.alertas.map((a) => `· ${a}`), ""] : []),
    "Confrontar con Factor Humano del puesto (Análisis del Trabajo) cuando exista perfil en job_profiles.cleaver_puesto.",
  ];
  return lineas.join("\n");
}