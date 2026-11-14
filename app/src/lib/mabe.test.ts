/**
 * Pruebas del motor MABE.
 *
 *   npx tsx src/lib/mabe.test.ts
 */
import assert from "node:assert/strict";
import { GRUPOS_MABE, calificarMabe, respuestasVaciasMabe } from "./mabe";

let n = 0;
function ok(nombre: string, fn: () => void) {
  fn();
  n++;
  console.log(`  OK    ${nombre}`);
}

const HOJA: Record<string, (r: ReturnType<typeof calificarMabe>) => number> = {
  procPuesto: (r) => r.procPuesto.total,
  valPuesto: (r) => r.valPuesto.total,
  valPs: (r) => r.valPersona.total,
  procPs: (r) => r.procPersona.cuadrantes.reduce((s, c) => s + c.bruto, 0),
};

console.log("1) Cada respuesta cuenta sólo en su hoja");
for (const g of GRUPOS_MABE) {
  ok(`${g.id}: sus ${g.items.length} ítems no tocan las otras hojas`, () => {
    for (const it of g.items) {
      const r = respuestasVaciasMabe();
      r[it.id] = 5;
      const cal = calificarMabe(r);
      for (const [hoja, total] of Object.entries(HOJA)) {
        if (hoja === g.id) assert.ok(total(cal) > 0, `${it.id} no suma en ${hoja}`);
        else assert.equal(total(cal), 0, `${it.id} (${g.id}) se coló en ${hoja}`);
      }
    }
  });
}

console.log("2) Totales con todo en 3");
const tres = respuestasVaciasMabe();
for (const k of Object.keys(tres)) tres[k] = 3;
const cal = calificarMabe(tres);
ok("completo", () => assert.equal(cal.completo, true));
ok("Proc. Puesto: 24 ítems × 3 = 72, cada cuadrante en 70", () => {
  assert.equal(cal.procPuesto.total, 72);
  for (const c of cal.procPuesto.cuadrantes) assert.equal(c.grafica, 70);
});
ok("Val. Puesto: 30 ítems × 3 = 90, cada valor en 50", () => {
  assert.equal(cal.valPuesto.total, 90);
  for (const v of cal.valPuesto.valores) assert.equal(v.grafica, 50);
});
ok("Val. Ps.: 30 ítems × 3 = 90", () => assert.equal(cal.valPersona.total, 90));
ok("Proc. Ps.: promedio ponderado 15 por cuadrante", () => {
  for (const c of cal.procPersona.cuadrantes) assert.equal(c.bruto, 15);
});

console.log(`\n${n} pruebas MABE OK`);
