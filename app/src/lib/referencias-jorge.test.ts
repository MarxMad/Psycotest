/**
 * Validación de bandas Hartman vs axiograma de referencia Jorge Hdez Galvez,
 * y smoke del banco PAPI (20 factores con textos alta/baja).
 */
import { nivel, etiquetaNivel, calificarHartman, NORMA } from "./hartman";
import { JORGE_HARTMAN_NIVELES } from "./interpretacion-hartman";
import { notaFactor, textoFactor } from "./interpretacion-papi";
import { ORDEN_PERFIL } from "./papi";
import { PUESTOS_MABE } from "@/data/mabe-puestos";
import { ESTILOS_PENSAMIENTO } from "./interpretacion-mabe";

const ok = (c: boolean, m: string) => {
  console.log(`  ${c ? "OK   " : "FALLA"} ${m}`);
  if (!c) process.exitCode = 1;
};

console.log("\n1) Bandas Hartman ↔ niveles del axiograma Jorge (valores típicos)");
const muestras: Array<{ col: Parameters<typeof nivel>[0]; valor: number; esperado: number; tag: string }> = [
  { col: "DIF", valor: 35, esperado: JORGE_HARTMAN_NIVELES.externo.DIF, tag: "DIF externo" },
  { col: "DIM_EJE", valor: 15, esperado: JORGE_HARTMAN_NIVELES.externo.DIM_I, tag: "DIM I" },
  { col: "DIM_EJE", valor: 10, esperado: JORGE_HARTMAN_NIVELES.externo.DIM_E, tag: "DIM E" },
  { col: "DIM", valor: 5, esperado: JORGE_HARTMAN_NIVELES.externo.DIM, tag: "DIM" },
  { col: "DIM_PCT", valor: 14, esperado: JORGE_HARTMAN_NIVELES.externo.DIM_PCT, tag: "DIM %" },
  { col: "INT_EJE", valor: 8, esperado: JORGE_HARTMAN_NIVELES.externo.INT_I, tag: "INT I" },
  { col: "INT_EJE", valor: 3, esperado: JORGE_HARTMAN_NIVELES.externo.INT_S, tag: "INT S" },
  { col: "INT", valor: 15, esperado: JORGE_HARTMAN_NIVELES.externo.INT, tag: "INT" },
  { col: "INT_PCT", valor: 32, esperado: JORGE_HARTMAN_NIVELES.externo.INT_PCT, tag: "INT %" },
  { col: "DI", valor: 5, esperado: JORGE_HARTMAN_NIVELES.externo.DI, tag: "DI" },
  { col: "DIS", valor: 0, esperado: JORGE_HARTMAN_NIVELES.externo.DIS, tag: "DIS≈0 → excel." },
  { col: "BQr", valor: 1.0, esperado: JORGE_HARTMAN_NIVELES.sumario.BQr_1, tag: "BQr 1" },
  { col: "CQ1", valor: 40, esperado: JORGE_HARTMAN_NIVELES.sumario.CQ_1, tag: "CQ 1" },
];

for (const m of muestras) {
  const n = nivel(m.col, m.valor);
  ok(n === m.esperado, `${m.tag}: valor ${m.valor} → nivel ${n} (${etiquetaNivel(n)}), esperado ${m.esperado}`);
}

console.log("\n2) Protocolo perfecto Hartman sigue interpretable");
const perfecto = calificarHartman([...NORMA], [...NORMA]);
ok(perfecto.interpretable, "interpretable");
ok(perfecto.compuestos[0].BQr === 1, `BQr=${perfecto.compuestos[0].BQr}`);
ok(perfecto.VQ.DIFperfil === 0, `DIFperfil=${perfecto.VQ.DIFperfil}`);

console.log("\n3) Banco PAPI completo (20 factores)");
ok(ORDEN_PERFIL.length === 20, `ORDEN_PERFIL=${ORDEN_PERFIL.length}`);
for (const f of ORDEN_PERFIL) {
  const alta = textoFactor(f, 8);
  const baja = textoFactor(f, 1);
  ok(alta.nota === "alta" && Boolean(alta.positiva && alta.negativa), `${f} nota alta con +/−`);
  ok(baja.nota === "baja" && Boolean(baja.positiva && baja.negativa), `${f} nota baja con +/−`);
}
ok(notaFactor(5) === "media", "puntaje 5 → media");

console.log("\n4) Catálogo puestos MABE de referencia");
ok(PUESTOS_MABE.length >= 4, `puestos=${PUESTOS_MABE.length}`);
ok(
  PUESTOS_MABE.some((p) => p.id === "administrativo") &&
    PUESTOS_MABE.some((p) => p.id === "almacenista"),
  "incluye Administrativo y Almacenista",
);
ok(Object.keys(ESTILOS_PENSAMIENTO).includes("A/V"), "estilo Conceptual A/V (caso Jorge)");

console.log("\nListo.");
