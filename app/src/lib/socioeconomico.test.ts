/**
 * Pruebas del motor del Estudio Socioeconómico.
 *
 *   npx tsx src/lib/socioeconomico.test.ts
 */
import assert from "node:assert/strict";
import { SECCIONES_CANDIDATO, textoAviso } from "../data/socioeconomico";
import {
  faltantes,
  interpretarSocioeconomico,
  limpiarParte,
  respuestasDelCandidato,
  resumirSocioeconomico,
  type RespuestasSocioeconomico,
} from "./socioeconomico";

let n = 0;
function prueba(nombre: string, fn: () => void) {
  fn();
  n += 1;
  console.log(`  OK    ${nombre}`);
}

const base: RespuestasSocioeconomico = {
  version: 1,
  aviso: { nombre: "Ana Pérez", transferencia: "acepta", fecha: "2026-10-30T12:00:00.000Z" },
  candidato: {
    economia: {
      ingreso_prospecto: "18,000",
      ingreso_conyuge: "$7500.50",
      egreso_renta: "6000",
      egreso_alimentacion: "8000",
      egreso_transporte: "1500",
    },
  },
  investigador: {
    patronReferencias: {
      verificaciones: [
        { empresa: "Acme", cal_responsabilidad: "9", cal_puntualidad: "7", recomienda: "Sí" },
        { empresa: "Beta", cal_responsabilidad: "6", recomienda: "No" },
      ],
    },
    vivienda: { delincuencia: "Alto", alcoholismo: "Bajo" },
    conclusion: { dictamen: "Favorable con reservas", elaboro: "Luis" },
  },
};

console.log("1) Resumen");
prueba("ingresos admiten «18,000» y «$7500.50»", () => {
  const r = resumirSocioeconomico(base);
  assert.equal(r.ingresos, 25500.5);
  assert.equal(r.egresos, 15500);
  assert.equal(r.diferencia, 10000.5);
});
prueba("promedio por verificación y global", () => {
  const r = resumirSocioeconomico(base);
  assert.equal(r.verificaciones[0].promedio, 8);
  assert.equal(r.verificaciones[1].promedio, 6);
  assert.equal(r.promedioReferencias, 7.3);
});
prueba("riesgos y dictamen", () => {
  const r = resumirSocioeconomico(base);
  assert.deepEqual(r.riesgosZona.map((z) => z.nivel), ["Bajo", "Alto"]);
  assert.equal(r.dictamen, "Favorable con reservas");
  assert.equal(r.completo, false);
});
prueba("interpretación menciona el déficit cuando lo hay", () => {
  const deficit = structuredClone(base);
  deficit.candidato.economia!.egreso_deudas = "20000";
  deficit.candidato.economia!.comoCubreGastos = "Préstamos familiares.";
  const txt = interpretarSocioeconomico(deficit);
  assert.match(txt, /déficit de/);
  assert.match(txt, /Préstamos familiares/);
  assert.match(txt, /riesgo alto de delincuencia/);
});

console.log("2) Saneamiento");
prueba("el candidato no puede escribir la parte del investigador", () => {
  const r = respuestasDelCandidato({ ...base, investigador: { conclusion: { dictamen: "Favorable" } } });
  assert.deepEqual(r.investigador, {});
});
prueba("descarta secciones y campos desconocidos, y opciones inválidas", () => {
  const p = limpiarParte("candidato", {
    generales: { nombre: "Ana", estadoCivil: "Inventado", hack: "x" },
    inexistente: { a: 1 },
  });
  assert.equal(p.generales.nombre, "Ana");
  assert.equal(p.generales.estadoCivil, undefined);
  assert.equal(p.generales.hack, undefined);
  assert.equal("inexistente" in p, false);
});
prueba("acota el largo y el número de filas", () => {
  const p = limpiarParte("candidato", {
    generales: { nombre: "x".repeat(5000) },
    refPersonales: { referencias: Array.from({ length: 10 }, () => ({ nombre: "R" })) },
  });
  assert.equal((p.generales.nombre as string).length, 2000);
  assert.equal((p.refPersonales.referencias as unknown[]).length, 3);
});
prueba("sin nombre en el aviso no hay aviso", () => {
  assert.equal(respuestasDelCandidato({ aviso: { transferencia: "acepta", nombre: "  " } }).aviso, null);
});

console.log("3) Obligatorios");
prueba("referencias personales exige tres, con nombre y teléfono", () => {
  const sec = SECCIONES_CANDIDATO.find((s) => s.id === "refPersonales")!;
  assert.ok(faltantes(sec, {}).some((f) => f.startsWith("Al menos 3")));
  const tres = { referencias: [1, 2, 3].map((i) => ({ nombre: `R${i}`, telefono: "55" })) };
  assert.deepEqual(faltantes(sec, tres), []);
});
prueba("una lista con mínimo 0 está completa vacía", () => {
  const sec = SECCIONES_CANDIDATO.find((s) => s.id === "refLaborales")!;
  assert.deepEqual(faltantes(sec, {}), []);
});

console.log("4) Aviso de privacidad");
const vacio = { empresa: "", encargado: "", telefono: "", correo: "" };
prueba("sin razón social ni contacto: redacción neutra, sin huecos", () => {
  const t = textoAviso(undefined, vacio);
  assert.match(t.apertura, /^La empresa que solicita este estudio es responsable/);
  assert.match(t.contacto, /investigador que realice la visita/);
  assert.doesNotMatch(Object.values(t).join(" "), /pendiente|\[/);
});
prueba("usa la empresa del código si no hay razón social", () => {
  assert.match(textoAviso("Acme SA", vacio).apertura, /^La empresa Acme SA es responsable/);
  assert.match(textoAviso("Acme SA", { ...vacio, empresa: "Beta SC" }).apertura, /^La empresa Beta SC/);
});
prueba("contacto solo con los medios que existen", () => {
  const t = textoAviso(undefined, { ...vacio, correo: "datos@x.mx" });
  assert.match(t.contacto, /el encargado de protección de datos personales, al correo datos@x\.mx\.$/);
});

console.log(`\nListo: ${n} pruebas del Estudio Socioeconómico.`);
