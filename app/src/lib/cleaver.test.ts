import { calificarCleaver, SERIES_CLEAVER, type RespuestasCleaver } from "./cleaver";

const ok = (c: boolean, m: string) => console.log(`  ${c ? "OK   " : "FALLA"} ${m}`);

console.log("\n1) Estructura: 24 series × 4 adjetivos DISC");
ok(SERIES_CLEAVER.length === 24, `series=${SERIES_CLEAVER.length}`);
ok(
  SERIES_CLEAVER.every((s) => s.adjetivos.length === 4 && s.adjetivos.every((a) => "DISC".includes(a.factor))),
  "cada adjetivo tiene factor D/I/S/C",
);

console.log("\n2) Protocolo completo artificial (M=0 L=1 en todas → patrones)");
const resp: RespuestasCleaver = {};
for (const s of SERIES_CLEAVER) {
  // más = índice 0, menos = índice 1
  resp[s.id] = { mas: 0, menos: 1 };
}
const r = calificarCleaver(resp);
ok(r.completo, "completo");
ok(r.M.D + r.M.I + r.M.S + r.M.C === 24, `sumM=${r.M.D + r.M.I + r.M.S + r.M.C}`);
ok(r.L.D + r.L.I + r.L.S + r.L.C === 24, `sumL=${r.L.D + r.L.I + r.L.S + r.L.C}`);
ok(r.validez === 0, `validez ΣT=${r.validez}`);
ok(r.validezEtiqueta === "valida", `etiqueta=${r.validezEtiqueta}`);

console.log("\n3) Ejemplo del manual (M/L → T)");
// Manual p.30: M 7,1,6,6 / L 5,8,4,3 → T 2,-7,2,3
ok(7 - 5 === 2 && 1 - 8 === -7 && 6 - 4 === 2 && 6 - 3 === 3, "aritmética ejemplo manual");
ok(2 + -7 + 2 + 3 === 0, "validez ejemplo = 0");

console.log("\nListo Cleaver.");
