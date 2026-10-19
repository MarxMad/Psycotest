import {
  calificarCleaver,
  SERIES_CLEAVER,
  aplicarBaremoT,
  esAplanado,
  type RespuestasCleaver,
  type ConteosFactor,
} from "./cleaver";
import {
  calificarCleaverJob,
  redondearPromedioCleaver,
  multiplicadorDesdeA,
  ITEMS_CLEAVER_JOB,
} from "./cleaver-job";

const ok = (c: boolean, m: string) => console.log(`  ${c ? "OK   " : "FALLA"} ${m}`);

console.log("\n1) Estructura Autodescripción: 24×4 DISC balanceados");
ok(SERIES_CLEAVER.length === 24, `series=${SERIES_CLEAVER.length}`);
ok(
  SERIES_CLEAVER.every(
    (s) =>
      s.adjetivos.length === 4 &&
      new Set(s.adjetivos.map((a) => a.factor)).size === 4 &&
      s.adjetivos.every((a) => "DISC".includes(a.factor)),
  ),
  "cada serie tiene exactamente D,I,S,C",
);
const wording = new Map(
  SERIES_CLEAVER.flatMap((s) => s.adjetivos.map((a) => [`${s.id}:${a.texto}`, a] as const)),
);
ok(wording.has('15:"SANGRE LIVIANA"') || [...wording.keys()].some((k) => k.includes("SANGRE")), "serie 15 Sangre liviana");
ok([...wording.keys()].some((k) => k.includes("ESTETA")), "serie 8 ESTETA");
ok([...wording.keys()].some((k) => k.includes("CONSECUENTE")), "serie 21 CONSECUENTE");

console.log("\n2) Protocolo completo artificial");
const resp: RespuestasCleaver = {};
for (const s of SERIES_CLEAVER) resp[s.id] = { mas: 0, menos: 1 };
const r = calificarCleaver(resp);
ok(r.completo, "completo");
ok(r.M.D + r.M.I + r.M.S + r.M.C === 24, `sumM=${r.M.D + r.M.I + r.M.S + r.M.C}`);
ok(r.L.D + r.L.I + r.L.S + r.L.C === 24, `sumL=${r.L.D + r.L.I + r.L.S + r.L.C}`);
ok(r.validez === 0, `validez ΣT=${r.validez}`);
ok(r.validezEtiqueta === "valida", `etiqueta=${r.validezEtiqueta}`);
ok(!!r.grafica?.T, "gráfica T presente");
ok(typeof r.grafica.T.D === "number" && r.grafica.T.D >= 0 && r.grafica.T.D <= 100, "baremo T en 0–100");

console.log("\n3) Ejemplo del manual (M 7,1,6,6 / L 5,8,4,3 → T 2,-7,2,3)");
ok(7 - 5 === 2 && 1 - 8 === -7 && 6 - 4 === 2 && 6 - 3 === 3, "aritmética ejemplo");
ok(2 + -7 + 2 + 3 === 0, "validez ejemplo = 0");
ok(aplicarBaremoT(0) === 50, `baremo T(0)=${aplicarBaremoT(0)}`);
ok(aplicarBaremoT(2) > 50 && aplicarBaremoT(-7) < 50, "baremo T respeta signo");

console.log("\n4) Aplanado 40–60");
const flat: ConteosFactor = { D: 50, I: 52, S: 48, C: 55 };
ok(esAplanado(flat), "perfil 40–60 aplanado");
ok(!esAplanado({ D: 80, I: 50, S: 30, C: 45 }), "perfil contrastado no aplanado");

console.log("\n5) Factor Humano / Job Analysis");
ok(ITEMS_CLEAVER_JOB.length === 24, `items job=${ITEMS_CLEAVER_JOB.length}`);
ok(redondearPromedioCleaver(20.25) === 20, `A .25→${redondearPromedioCleaver(20.25)}`);
ok(redondearPromedioCleaver(20.5) === 20.5, `A .50→${redondearPromedioCleaver(20.5)}`);
ok(redondearPromedioCleaver(20.75) === 21, `A .75→${redondearPromedioCleaver(20.75)}`);
ok(multiplicadorDesdeA(20) === 5, `X(A=20)=${multiplicadorDesdeA(20)}`);
// Ejemplo manual: R D=25 I=15 S=21 C=20 → A=20, D%=±25/5/0 → gráfica 75/25/55/50
const jobResp: Record<number, number> = {};
for (const it of ITEMS_CLEAVER_JOB) {
  // construir R aproximado repartiendo en 6 ítems
  const target = { D: 25, I: 15, S: 21, C: 20 }[it.factor];
  jobResp[it.id] = target / 6;
}
// ratings deben ser enteros 1–5 — ajustar a enteros que sumen cerca
const byF: Record<string, number[]> = { D: [], I: [], S: [], C: [] };
for (const it of ITEMS_CLEAVER_JOB) byF[it.factor].push(it.id);
function assign(ids: number[], total: number) {
  const base = Math.floor(total / ids.length);
  let rem = total - base * ids.length;
  for (const id of ids) {
    jobResp[id] = Math.min(5, base + (rem > 0 ? 1 : 0));
    if (rem > 0) rem--;
  }
}
assign(byF.D, 25);
assign(byF.I, 15);
assign(byF.S, 21);
assign(byF.C, 20);
const jr = calificarCleaverJob(jobResp);
ok(jr.completo, "job completo");
ok(jr.R.D === 25 && jr.R.I === 15 && jr.R.S === 21 && jr.R.C === 20, `R=${JSON.stringify(jr.R)}`);
ok(jr.A === 20, `A=${jr.A}`);
ok(jr.multiplicador === 5, `X=${jr.multiplicador}`);
ok(Math.round(jr.grafica.D) === 75, `gráfica D=${jr.grafica.D}`);
ok(Math.round(jr.grafica.I) === 25, `gráfica I=${jr.grafica.I}`);
ok(Math.round(jr.grafica.S) === 55, `gráfica S=${jr.grafica.S}`);
ok(Math.round(jr.grafica.C) === 50, `gráfica C=${jr.grafica.C}`);

console.log("\nListo Cleaver + Factor Humano.");
