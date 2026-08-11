/**
 * Textos borrador para el panel del psicólogo.
 */

import type { ResultadoMabe } from "./mabe";
import { CUADRANTES, NOMBRES_CUADRANTE, NOMBRES_VALOR, VALORES } from "./mabe";
import type { ResultadoPapi } from "./papi";
import { NOMBRES, DIADAS, banda } from "./papi";
import type { ResultadoHartman } from "./hartman";
import { etiquetaNivel, nivel } from "./hartman";

function topEntries<T extends string>(
  record: Record<T, number>,
  nombres: Record<T, string>,
  n = 2,
) {
  return Object.entries(record)
    .map(([k, v]) => ({ key: k as T, val: v as number, nombre: nombres[k as T] }))
    .sort((a, b) => Math.abs(b.val) - Math.abs(a.val))
    .slice(0, n);
}

export function interpretarPapi(r: ResultadoPapi): string {
  const altos = DIADAS.filter((d) => r.puntajes[d.rol] >= 7 || r.puntajes[d.necesidad] >= 7);
  const lineas = [
    "Informe borrador — PAPI",
    "",
    `Control de sumas: roles ${r.totalRoles}/45, necesidades ${r.totalNecesidades}/45${r.controlOk ? " (OK)" : " (revisar)"}.`,
    "",
    "Factores más elevados (≥ 7):",
    ...altos.map(
      (d) =>
        `· ${d.rol} (${r.puntajes[d.rol]}, ${banda(r.puntajes[d.rol])}) — ${NOMBRES[d.rol]} · ${d.necesidad} (${r.puntajes[d.necesidad]}, ${banda(r.puntajes[d.necesidad])}) — ${NOMBRES[d.necesidad]}`,
    ),
    altos.length === 0 ? "· Ninguno en rango alto." : "",
    "",
    "Puntos de atención interpretativa:",
    "· Contrastar rol vs necesidad en cada díada (L–P, G–N, etc.).",
    "· Revisar dimensiones con factores en banda alta o baja en las gráficas.",
    "",
    "El psicólogo debe completar la interpretación clínica según el manual PAPI.",
  ];
  return lineas.filter(Boolean).join("\n");
}

export function interpretarHartman(r: ResultadoHartman): string {
  const c1 = r.compuestos.find((x) => x.componente === 1);
  const lineas = [
    "Informe borrador — Hartman",
    "",
    r.interpretable
      ? "Protocolo interpretable según reglas de disimilitud."
      : `⚠ Protocolo NO interpretable: ${r.motivo ?? "revisar validez"}.`,
    "",
    `Parte I (V.Q.): DIF ${r.VQ.DIF}, DIS ${r.VQ.DIS}, Q₁ ${r.VQ.Q1} (${r.interpretable ? etiquetaNivel(nivel("Q1", r.VQ.Q1)) : "—"}), Q₂ ${r.VQ.Q2}`,
    `Parte II (S.Q.): DIF ${r.SQ.DIF}, DIS ${r.SQ.DIS}, Q₁ ${r.SQ.Q1}, Q₂ ${r.SQ.Q2}`,
    "",
    c1
      ? `BQr: ${c1.BQr.toFixed(2)} · BQa: ${c1.BQa.toFixed(1)} · CQ: ${c1.CQ.toFixed(1)}`
      : "Índices compuestos no calculados (protocolo no interpretable).",
    "",
    "Alertas:",
    ...(r.VQ.alertas.length + r.SQ.alertas.length === 0
      ? ["· Ninguna alerta automática."]
      : []),
    ...r.VQ.alertas.map((a) => `· VQ: ${a}`),
    ...r.SQ.alertas.map((a) => `· SQ: ${a}`),
    "",
    "Completar con textos de Plantillas Hartman.docx.",
  ];
  return lineas.join("\n");
}

export function interpretarMabe(r: ResultadoMabe, participante: string, puesto?: string): string {
  const topProc = topEntries(r.brechas.proceso, NOMBRES_CUADRANTE);
  const topVal = topEntries(r.brechas.valores, NOMBRES_VALOR);

  const dominantePuesto = [...CUADRANTES].sort(
    (a, b) =>
      (r.procPuesto.cuadrantes.find((c) => c.cuadrante === b)?.grafica ?? 0) -
      (r.procPuesto.cuadrantes.find((c) => c.cuadrante === a)?.grafica ?? 0),
  )[0];

  const dominantePersona = [...CUADRANTES].sort(
    (a, b) =>
      (r.procPersona.cuadrantes.find((c) => c.cuadrante === b)?.grafica ?? 0) -
      (r.procPersona.cuadrantes.find((c) => c.cuadrante === a)?.grafica ?? 0),
  )[0];

  return [
    "Informe borrador — MABE",
    "",
    `Participante: ${participante}`,
    puesto ? `Puesto de referencia: ${puesto}` : "",
    "",
    "══ AJUSTE PERSONA – PUESTO ══",
    "",
    "Cuadrante dominante del puesto:",
    `· ${dominantePuesto} (${NOMBRES_CUADRANTE[dominantePuesto]})`,
    "",
    "Cuadrante dominante de la persona:",
    `· ${dominantePersona} (${NOMBRES_CUADRANTE[dominantePersona]})`,
    "",
    "Mayores brechas — proceso pensante:",
    ...topProc.map(
      (b) =>
        `· ${b.key} (${b.nombre}): ${b.val > 0 ? "+" : ""}${b.val} — ${b.val > 0 ? "persona por encima del puesto" : "persona por debajo del puesto"}`,
    ),
    "",
    "Mayores brechas — valores:",
    ...topVal.map(
      (b) =>
        `· ${b.key} (${b.nombre}): ${b.val > 0 ? "+" : ""}${b.val}`,
    ),
    "",
    "Detalle proceso pensante (brecha persona − puesto):",
    ...CUADRANTES.map(
      (k) =>
        `· ${k} (${NOMBRES_CUADRANTE[k]}): ${r.brechas.proceso[k] > 0 ? "+" : ""}${r.brechas.proceso[k]}`,
    ),
    "",
    "Detalle valores (brecha persona − puesto):",
    ...VALORES.map(
      (k) =>
        `· ${k} (${NOMBRES_VALOR[k]}): ${r.brechas.valores[k] > 0 ? "+" : ""}${r.brechas.valores[k]}`,
    ),
    "",
    "Combinaciones cuadrantes (puesto):",
    `· L (A+L)=${r.combinaciones.L} · R (I+V)=${r.combinaciones.R} · C (A+V)=${r.combinaciones.C} · S (L+I)=${r.combinaciones.S}`,
    "",
    "Puntos para completar en la entrevista:",
    "· Contrastar curvas roja/azul en gráficas de proceso y valores.",
    "· Identificar pares de valores altos (manual §III y §V).",
    "· Evaluar implicaciones de supervisión (manual §VI).",
    "",
    "Completar con manual MABE_2007.docx.",
  ]
    .filter(Boolean)
    .join("\n");
}
