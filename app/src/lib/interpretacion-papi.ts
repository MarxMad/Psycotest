/**
 * Banco de interpretación PAPI (Nota Alta / Nota Baja × Positiva / Negativa).
 * Fuente: Prueba PAPI.docx. Factor P complementado con informe Jorge Hdez Galvez.
 */
import bankJson from "@/data/papi-interpretacion.json";
import {
  GRUPOS,
  NOMBRES,
  ORDEN_PERFIL,
  banda,
  type Factor,
  type ResultadoPapi,
} from "./papi";

export type NotaPapi = "alta" | "media" | "baja";

type FactorBank = {
  titulo: string;
  notaAlta: { positiva: string; negativa: string };
  notaBaja: { positiva: string; negativa: string };
};

const FACTORES = bankJson.factores as Record<string, FactorBank>;

export function notaFactor(p: number): NotaPapi {
  if (p >= 7) return "alta";
  if (p <= 2) return "baja";
  return "media";
}

export function textoFactor(factor: Factor, puntaje: number) {
  const bank = FACTORES[factor];
  const nota = notaFactor(puntaje);
  const titulo = bank?.titulo ?? NOMBRES[factor];
  if (!bank || nota === "media") return { nota, titulo };
  const bloque = nota === "alta" ? bank.notaAlta : bank.notaBaja;
  return { nota, titulo, positiva: bloque.positiva, negativa: bloque.negativa };
}

/** Informe al estilo del reporte Jorge Hdez Galvez. */
export function interpretarPapiCompleto(r: ResultadoPapi): string {
  const lineas: string[] = [
    "Informe PAPI — Inventario de Preferencias de Personalidad",
    "",
    `Control de cálculo: roles ${r.totalRoles}/45 · necesidades ${r.totalNecesidades}/45${
      r.controlOk ? " ✓" : " ⚠ revisar"
    }`,
    `Ítems respondidos: ${r.respondidos}/90`,
    "",
  ];

  const extremos = ORDEN_PERFIL.filter((f) => notaFactor(r.puntajes[f]) !== "media");

  if (extremos.length === 0) {
    lineas.push(
      "Perfil equilibrado: ningún factor en nota alta (≥7) ni baja (≤2).",
      "Revisar díadas y correlaciones en entrevista según el manual.",
      "",
    );
  }

  for (const grupo of GRUPOS) {
    const relevantes = grupo.factores.filter((f) => extremos.includes(f));
    if (relevantes.length === 0) continue;
    lineas.push(`══ ${grupo.nombre.toUpperCase()} ══`, "");
    for (const f of relevantes) {
      const p = r.puntajes[f];
      const t = textoFactor(f, p);
      lineas.push(
        `${f}: ${t.titulo}`,
        `Puntaje ${p}/9 (${banda(p)}) — Nota ${t.nota === "alta" ? "Alta" : "Baja"}`,
        "",
      );
      if (t.positiva) lineas.push("Interpretación positiva:", t.positiva, "");
      if (t.negativa) lineas.push("Interpretación negativa:", t.negativa, "");
    }
  }

  lineas.push(
    "══ PERFIL COMPLETO (0–9) ══",
    "",
    ...ORDEN_PERFIL.map((f) => `${f} ${NOMBRES[f]}: ${r.puntajes[f]} (${banda(r.puntajes[f])})`),
    "",
    "Base automática según el manual PAPI. El psicólogo debe contrastarla en entrevista",
    "antes de emitir dictamen de selección.",
  );

  return lineas.join("\n");
}
