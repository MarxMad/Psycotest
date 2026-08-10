/**
 * Textos borrador para el panel del psicólogo.
 */

import type { ResultadoMabe } from "./mabe";
import { NOMBRES_CUADRANTE, NOMBRES_VALOR } from "./mabe";
import type { ResultadoPapi } from "./papi";
import { NOMBRES, DIADAS } from "./papi";
import type { ResultadoHartman } from "./hartman";

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
        `· ${d.rol} (${r.puntajes[d.rol]}) — ${NOMBRES[d.rol]} · ${d.necesidad} (${r.puntajes[d.necesidad]}) — ${NOMBRES[d.necesidad]}`,
    ),
    altos.length === 0 ? "· Ninguno en rango alto." : "",
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
    `Parte I (V.Q.): DIF ${r.VQ.DIF}, DIS ${r.VQ.DIS}, Q₁ ${r.VQ.Q1}, Q₂ ${r.VQ.Q2}`,
    `Parte II (S.Q.): DIF ${r.SQ.DIF}, DIS ${r.SQ.DIS}, Q₁ ${r.SQ.Q1}, Q₂ ${r.SQ.Q2}`,
    "",
    c1
      ? `BQr: ${c1.BQr.toFixed(2)} · BQa: ${c1.BQa.toFixed(1)} · CQ: ${c1.CQ.toFixed(1)}`
      : "Índices compuestos no calculados (protocolo no interpretable).",
    "",
    "Alertas:",
    ...r.VQ.alertas.map((a) => `· VQ: ${a}`),
    ...r.SQ.alertas.map((a) => `· SQ: ${a}`),
    "",
    "Completar con textos de Plantillas Hartman.docx.",
  ];
  return lineas.join("\n");
}

export function interpretarMabe(r: ResultadoMabe, participante: string, puesto?: string): string {
  const mayorBrechaProc = Object.entries(r.brechas.proceso).sort(
    (a, b) => Math.abs(b[1]) - Math.abs(a[1]),
  )[0];
  const mayorBrechaVal = Object.entries(r.brechas.valores).sort(
    (a, b) => Math.abs(b[1]) - Math.abs(a[1]),
  )[0];

  return [
    "Informe borrador — MABE",
    "",
    `Participante: ${participante}`,
    puesto ? `Puesto de referencia: ${puesto}` : "",
    "",
    "Proceso pensante — brecha persona − puesto (positivo = persona por encima):",
    ...Object.entries(r.brechas.proceso).map(
      ([k, v]) => `· ${k} (${NOMBRES_CUADRANTE[k as keyof typeof NOMBRES_CUADRANTE]}): ${v > 0 ? "+" : ""}${v}`,
    ),
    "",
    `Mayor brecha en cuadrante: ${mayorBrechaProc?.[0]} (${mayorBrechaProc?.[1]})`,
    "",
    "Valores — brecha persona − puesto:",
    ...Object.entries(r.brechas.valores).map(
      ([k, v]) => `· ${k} (${NOMBRES_VALOR[k as keyof typeof NOMBRES_VALOR]}): ${v > 0 ? "+" : ""}${v}`,
    ),
    "",
    `Mayor brecha en valor: ${mayorBrechaVal?.[0]} (${NOMBRES_VALOR[mayorBrechaVal?.[0] as keyof typeof NOMBRES_VALOR]})`,
    "",
    "Combinaciones cuadrantes (puesto):",
    `· L (A+L)=${r.combinaciones.L} · R (I+V)=${r.combinaciones.R} · C (A+V)=${r.combinaciones.C} · S (L+I)=${r.combinaciones.S}`,
    "",
    "Completar con manual MABE_2007.docx (combinaciones de valores y supervisión).",
  ]
    .filter(Boolean)
    .join("\n");
}
