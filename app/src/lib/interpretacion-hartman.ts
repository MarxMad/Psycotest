/**
 * Informe Hartman estructurado (3 axiogramas) con niveles 1–7.
 * Textos: Plantillas Hartman.docx → hartman-axiogramas.ts
 * Bandas: hoja Gráfica del Excel de calificación.
 */
import { AXIOGRAMAS, type Axiograma } from "@/data/hartman-axiogramas";
import {
  etiquetaNivel,
  nivel,
  type ResultadoHartman,
  type ResultadoParte,
} from "./hartman";

type Fila = {
  clave: string;
  columna: Parameters<typeof nivel>[0];
  valor: number;
};

function filasParte(p: ResultadoParte): Fila[] {
  return [
    { clave: "DIF", columna: "DIF", valor: p.DIFperfil },
    { clave: "DIM_I", columna: "DIM_EJE", valor: Math.abs(p.ejes.I.balance) },
    { clave: "DIM_E", columna: "DIM_EJE", valor: Math.abs(p.ejes.E.balance) },
    { clave: "DIM_S", columna: "DIM_EJE", valor: Math.abs(p.ejes.S.balance) },
    { clave: "DIM", columna: "DIM", valor: Math.abs(p.DIM) },
    { clave: "DIM_PCT", columna: "DIM_PCT", valor: Math.abs(p.DIMpct) },
    { clave: "INT_I", columna: "INT_EJE", valor: Math.abs(p.ejes.I.INT) },
    { clave: "INT_E", columna: "INT_EJE", valor: Math.abs(p.ejes.E.INT) },
    { clave: "INT_S", columna: "INT_EJE", valor: Math.abs(p.ejes.S.INT) },
    { clave: "INT", columna: "INT", valor: Math.abs(p.INT) },
    { clave: "INT_PCT", columna: "INT_PCT", valor: Math.abs(p.INTpct) },
    { clave: "DI", columna: "DI", valor: Math.abs(p.DIM) },
    { clave: "DIS", columna: "DIS", valor: p.DIS },
  ];
}

function bloqueAxiograma(ax: Axiograma, p: ResultadoParte): string[] {
  const meta = AXIOGRAMAS[ax];
  const lineas = [`── ${meta.titulo} ──`, ""];
  for (const fila of filasParte(p)) {
    const ind = meta.indicadores.find((i) => i.clave === fila.clave);
    if (!ind) continue;
    const n = nivel(fila.columna, fila.valor);
    const valorTxt = Number.isInteger(fila.valor) ? String(fila.valor) : fila.valor.toFixed(1);
    lineas.push(
      `${ind.sigla}: ${valorTxt} → Nivel ${n} (${etiquetaNivel(n)})`,
      ind.texto,
      "",
    );
  }
  return lineas;
}

export function interpretarHartmanCompleto(r: ResultadoHartman): string {
  const lineas: string[] = [
    "Informe Hartman — Inventario de Valores (perfil de desarrollo)",
    "",
  ];

  if (!r.interpretable) {
    lineas.push(
      `⚠ Protocolo NO interpretable: ${r.motivo ?? "disimilitudes excesivas"}.`,
      `VQ DIS=${r.VQ.DIS} · SQ DIS=${r.SQ.DIS}`,
      "",
      "Se requiere revisión manual o reaplicación antes de emitir informe.",
    );
    return lineas.join("\n");
  }

  lineas.push(
    `Validez: interpretable · VQ DIS=${r.VQ.DIS} · SQ DIS=${r.SQ.DIS}`,
    `VQ Q₁=${r.VQ.Q1} (${etiquetaNivel(nivel("Q1", r.VQ.Q1))}) · Q₂=${r.VQ.Q2} (${etiquetaNivel(nivel("Q2", r.VQ.Q2))})`,
    `SQ Q₁=${r.SQ.Q1} (${etiquetaNivel(nivel("Q1", r.SQ.Q1))}) · Q₂=${r.SQ.Q2} (${etiquetaNivel(nivel("Q2", r.SQ.Q2))})`,
    "",
  );

  lineas.push(...bloqueAxiograma("externo", r.VQ));
  lineas.push(...bloqueAxiograma("propio", r.SQ));

  const c1 = r.compuestos.find((c) => c.componente === 1);
  const c2 = r.compuestos.find((c) => c.componente === 2);
  const sumario = AXIOGRAMAS.sumario;
  lineas.push(`── ${sumario.titulo} ──`, "");

  if (c1) {
    const difRatio = r.SQ.Q1 === 0 ? 0 : r.VQ.Q1 / r.SQ.Q1;
    lineas.push(
      `DIF 1 / DIF 2 (Q₁ VQ/SQ): ${difRatio.toFixed(2)} → ${etiquetaNivel(nivel("BQr", difRatio))}`,
      sumario.indicadores.find((i) => i.clave === "DIF_1_2")?.texto ?? "",
      "",
      `BQr 1: ${c1.BQr.toFixed(2)} → ${etiquetaNivel(nivel("BQr", c1.BQr))}`,
      sumario.indicadores.find((i) => i.clave === "BQr_1")?.texto ?? "",
      "",
      `BQa 1: ${c1.BQa.toFixed(1)} → ${etiquetaNivel(nivel("BQa1", c1.BQa))}`,
      sumario.indicadores.find((i) => i.clave === "BQa_1")?.texto ?? "",
      "",
      `CQ 1: ${c1.CQ.toFixed(1)} → ${etiquetaNivel(nivel("CQ1", c1.CQ))}`,
      sumario.indicadores.find((i) => i.clave === "CQ_1")?.texto ?? "",
      "",
    );
  }
  if (c2) {
    lineas.push(
      `Componente 2 (calidad): BQr=${c2.BQr.toFixed(2)} · BQa=${c2.BQa.toFixed(1)} · CQ=${c2.CQ.toFixed(1)}`,
      "",
    );
  }

  const alertas = [...r.VQ.alertas, ...r.SQ.alertas];
  if (alertas.length) {
    lineas.push("Alertas de protocolo:", ...alertas.map((a) => `· ${a}`), "");
  }

  lineas.push(
    "Niveles: 1 Excelente · 2 Muy bueno · 3 Bueno · 4 Promedio · 5 Pobre · 6 Muy pobre · 7 Pésimo.",
    "El psicólogo debe validar el perfil gráfico y completar el juicio clínico.",
  );

  return lineas.join("\n");
}

/** Niveles del axiograma de referencia Jorge Hdez Galvez (DOCX). */
export const JORGE_HARTMAN_NIVELES = {
  externo: {
    DIF: 2,
    DIM_I: 3,
    DIM_E: 2,
    DIM_S: 2,
    DIM: 2,
    DIM_PCT: 2,
    INT_I: 3,
    INT_E: 3,
    INT_S: 2,
    INT: 3,
    INT_PCT: 4,
    DI: 2,
    DIS: 1,
  },
  propio: {
    DIF: 2,
    DIM_I: 2,
    DIM_E: 3,
    DIM_S: 2,
    DIM: 3,
    DIM_PCT: 3,
    INT_I: 2,
    INT_E: 3,
    INT_S: 2,
    INT: 3,
    INT_PCT: 5,
    DI: 3,
    DIS: 3,
  },
  sumario: { DIF_1_2: 1, BQr_1: 1, BQa_1: 2, CQ_1: 1 },
} as const;
