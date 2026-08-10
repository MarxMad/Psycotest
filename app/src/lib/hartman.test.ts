import { calificarHartman, calificarParte, NORMA, nivel, etiquetaNivel } from "./hartman.ts";

const ok = (c: boolean, m: string) => console.log(`  ${c ? "OK   " : "FALLA"} ${m}`);

console.log("\n1) Protocolo perfecto (respuestas = norma)");
const p = calificarParte([...NORMA]);
ok(p.DIF === 171, `DIF = ${p.DIF} (integridad)`);
ok(p.DIS === 0, `DIS = ${p.DIS}`);
ok(p.DIM === 0 && p.INT === 0, `DIM = ${p.DIM}, INT = ${p.INT} (sin desviacion)`);
ok(p.ejes.I.DIM === 57 && p.ejes.E.DIM === 57 && p.ejes.S.DIM === 57,
   `DIM por eje = ${p.ejes.I.DIM}/${p.ejes.E.DIM}/${p.ejes.S.DIM}`);
ok(p.Q1 === 171 && p.Q2 === 0, `VQ(1) = ${p.Q1}, VQ(2) = ${p.Q2}`);

console.log("\n2) Compuestos con dos partes perfectas");
const r = calificarHartman([...NORMA], [...NORMA]);
ok(r.compuestos[0].BQr === 1, `BQr(1) = ${r.compuestos[0].BQr.toFixed(2)}`);
ok(r.compuestos[0].BQa === 171, `BQa(1) = ${r.compuestos[0].BQa.toFixed(1)}`);
ok(etiquetaNivel(nivel("BQr", 1.0)) === "Excelente", `BQr 1.00 -> ${etiquetaNivel(nivel("BQr", 1.0))}`);

console.log("\n3) Reglas de signo y ajuste -2");
const t = calificarParte([8,9,10,11,13,5,17,16,12,4,1,18,2,14,6,15,3,7]);
const a = t.items.find(i => i.id === "a")!;   // norma 6 (1 digito), respuesta 8 -> peor
const o = t.items.find(i => i.id === "o")!;   // norma 8 (1 digito), respuesta 6 -> mejor
ok(a.diferencia === -2, `a: norma 6, respuesta 8 -> diferencia ${a.diferencia} (negativa)`);
ok(a.ajustada === 0,    `a: magnitud 2 -> ajustada ${a.ajustada}`);
ok(o.diferencia === 2,  `o: norma 8, respuesta 6 -> diferencia ${o.diferencia} (positiva)`);

const t2 = calificarParte([11,9,10,6,13,5,17,16,12,4,1,18,2,14,8,15,3,7]);
const a2 = t2.items.find(i => i.id === "a")!;  // norma 6, respuesta 11
ok(a2.magnitud === 5 && a2.ajustada === -3, `a: |11-6| = ${a2.magnitud} -> ajustada ${a2.ajustada}`);
ok(a2.disimilitud === true, `a: 11 (2 digitos) vs norma 6 (1 digito) -> disimilitud`);

console.log("\n4) Puerta de validez: 6 o mas disimilitudes");
const malo = [10,11,12,13,14,15,16,17,18,1,2,3,4,5,6,7,8,9];
const rr = calificarHartman(malo, [...NORMA]);
ok(!rr.interpretable, `DIS = ${rr.VQ.DIS} -> interpretable = ${rr.interpretable}`);
ok(rr.compuestos.length === 0, "no se calculan compuestos");

console.log("\n5) Invariante: 10 000 permutaciones aleatorias");
let malas = 0, sumas = 0;
for (let k = 0; k < 10000; k++) {
  const perm = [...NORMA].sort(() => Math.random() - 0.5);
  const x = calificarParte(perm);
  if (x.DIF !== 171) malas++;
  sumas += x.DIS % 2 === 0 ? 0 : 1;
}
ok(malas === 0, `DIF = 171 en las 10 000 (fallos: ${malas})`);
console.log(`  info  protocolos con DIS impar: ${sumas} de 10 000`);
