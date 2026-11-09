/**
 * Pruebas del motor LIFO.
 *
 *   npx tsx src/lib/lifo.test.ts
 */
import assert from "node:assert/strict";
import { COMBINACIONES, ESTILOS, PERFILES } from "../data/lifo";
import {
  ESTILOS_LIFO,
  GRUPOS_ESTRES,
  GRUPOS_HABITUAL,
  GRUPOS_LIFO,
  calificarLifo,
  clasificarPerfil,
  grupoValido,
  type EstiloLifo,
  type PuntajesLifo,
  type RespuestasLifo,
} from "./lifo";
import { interpretarLifo } from "./informes";

let n = 0;
function prueba(nombre: string, fn: () => void) {
  fn();
  n += 1;
  console.log(`  OK    ${nombre}`);
}

const pts = (da: number, tc: number, mc: number, an: number): PuntajesLifo => ({ da, tc, mc, an });

prueba("estructura: 18 grupos × 4 términos, 9 por condición sin traslape", () => {
  assert.equal(GRUPOS_LIFO.length, 18);
  assert.ok(GRUPOS_LIFO.every((g, i) => g.id === i + 1 && g.terminos.length === 4));
  assert.equal(GRUPOS_HABITUAL.length, 9);
  assert.equal(GRUPOS_ESTRES.length, 9);
  assert.equal(new Set([...GRUPOS_HABITUAL, ...GRUPOS_ESTRES]).size, 18);
});

prueba("hoja de calificación: ítems 1–12, 25–36, 49–60 son habituales", () => {
  const habituales = GRUPOS_HABITUAL.flatMap((g) => [1, 2, 3, 4].map((k) => (g - 1) * 4 + k));
  const esperados = [
    ...Array.from({ length: 12 }, (_, i) => i + 1),
    ...Array.from({ length: 12 }, (_, i) => i + 25),
    ...Array.from({ length: 12 }, (_, i) => i + 49),
  ];
  assert.deepEqual(habituales.sort((a, b) => a - b), esperados);
});

prueba("redacción: grupo 1 y grupo 18 conservan el texto de la hoja", () => {
  assert.match(GRUPOS_LIFO[0].terminos[0], /idealismo y optimismo/);
  assert.match(GRUPOS_LIFO[17].terminos[3], /Impacientes e indiferentes/);
});

prueba("grupo válido: solo 4, 3, 2, 1 sin repetir", () => {
  assert.ok(grupoValido([4, 3, 2, 1]));
  assert.ok(grupoValido([1, 4, 2, 3]));
  assert.ok(!grupoValido([4, 4, 2, 1]));
  assert.ok(!grupoValido([4, 3, 2]));
  assert.ok(!grupoValido(undefined));
});

prueba("calificación: posición → estilo, cada condición suma 90", () => {
  // Siempre 4 al primero (Da/Ap) en habituales; 4 al segundo (Tm/Ct) en estrés.
  const r: RespuestasLifo = {};
  for (const g of GRUPOS_HABITUAL) r[g] = [4, 3, 2, 1];
  for (const g of GRUPOS_ESTRES) r[g] = [3, 4, 1, 2];
  const c = calificarLifo(r);
  assert.ok(c.completo);
  assert.deepEqual(c.habitual.puntajes, pts(36, 27, 18, 9));
  assert.deepEqual(c.estres.puntajes, pts(27, 36, 9, 18));
  assert.equal(c.habitual.total, 90);
  assert.equal(c.estres.total, 90);
  assert.deepEqual(c.habitual.preferidos, ["da"]);
  assert.deepEqual(c.estres.preferidos, ["tc"]);
  assert.deepEqual(c.habitual.menosPreferidos, ["an"]);
  assert.ok(c.cambiaBajoEstres);
  assert.equal(c.alertas.length, 0);
});

prueba("protocolo incompleto: alerta y grupos señalados", () => {
  const r: RespuestasLifo = { 1: [4, 3, 2, 1], 4: [4, 4, 2, 1] };
  const c = calificarLifo(r);
  assert.ok(!c.completo);
  assert.equal(c.respondidas, 1);
  assert.ok(c.estres.gruposInvalidos.includes(4));
  assert.match(c.alertas[0], /1\/18/);
});

// Los ejemplos del manual, §6.1.5 (en el orden de la hoja Da Tm Mt Ad).
const EJEMPLOS: [string, number[]][] = [
  ["uniforme", [23, 21, 23, 23]],
  ["uniforme", [22, 21, 25, 22]],
  ["primario", [18, 19, 32, 21]],
  ["primario", [20, 29, 20, 21]],
  ["combinado", [24, 21, 18, 27]],
  ["combinado", [19, 27, 25, 11]],
  ["diferenciado", [25, 30, 20, 16]],
  ["diferenciado", [15, 19, 32, 24]],
  ["backup", [22, 28, 24, 16]],
  ["backup", [17, 21, 32, 20]],
  ["triada", [23, 15, 25, 27]],
  ["triada", [26, 26, 24, 14]],
];

for (const [esperado, [a, b, c, d]] of EJEMPLOS) {
  prueba(`perfil del manual ${[a, b, c, d].join(" ")} → ${esperado}`, () => {
    const r = clasificarPerfil(pts(a, b, c, d));
    assert.equal(r.perfil, esperado);
    assert.equal(r.primarioModerado, false);
  });
}

prueba("primario moderado: ventaja de 4 a 7 con los otros parejos", () => {
  const r = clasificarPerfil(pts(28, 21, 20, 21));
  assert.equal(r.perfil, "primario");
  assert.ok(r.primarioModerado);
});

prueba("contenido: los cuatro estilos y las seis combinaciones están completos", () => {
  for (const e of ESTILOS_LIFO) {
    const d = ESTILOS[e];
    assert.equal(d.terminos.length, 10, e);
    assert.ok(d.habituales.fuerza.length && d.lucha.fuerza.length && d.tension.fuerza.length, e);
    assert.ok(d.comunicacion.comoComunicarse && d.expresion.liderazgo, e);
  }
  const pares = ESTILOS_LIFO.flatMap((a, i) => ESTILOS_LIFO.slice(i + 1).map((b) => `${a}-${b}`));
  assert.deepEqual(Object.keys(COMBINACIONES).sort(), pares.sort());
  assert.equal(Object.keys(PERFILES).length, 6);
});

prueba("informe: secciones del formato RESULTADOS LIFO", () => {
  const r: RespuestasLifo = {};
  for (const g of GRUPOS_LIFO) r[g.id] = [3, 4, 2, 1];
  const texto = interpretarLifo(calificarLifo(r));
  for (const s of [
    "COMBINACIONES PREFERIDAS DE ESTILO EN CONDICIONES HABITUALES",
    "CONDICIONES DE OPOSICIÓN Y DE ESTRÉS",
    "CONDICIONES DE LUCHA",
    "CONDICIONES DE TENSIÓN",
    "COMUNICACIÓN E INFLUENCIA PERSONAL",
    "CONTRIBUCIONES AL EQUIPO DE TRABAJO",
    "ORIENTACIÓN BÁSICA",
    "LIDERAZGO",
    "OBSERVACIONES FINALES",
  ]) {
    assert.ok(texto.includes(s), s);
  }
  // Da 27 · Tm 36: combinado no (diferencia 9); primario no (Mt 18 vs Ad 9).
  assert.match(texto, /Tm\/Ct 36/);
});

prueba("informe: combinado y tríada traen su texto específico", () => {
  const combinado: RespuestasLifo = {};
  // Da y Ad arriba, parejos.
  for (const g of GRUPOS_LIFO) combinado[g.id] = g.id % 2 ? [4, 2, 1, 3] : [3, 1, 2, 4];
  const c = calificarLifo(combinado);
  assert.equal(c.habitual.perfil, "combinado");
  assert.deepEqual(c.habitual.combinaciones, ["da-an"]);
  assert.match(interpretarLifo(c), /Portavoz y apoyador popular/);

  const triada: RespuestasLifo = {};
  const ciclo: number[][] = [
    [4, 3, 2, 1],
    [3, 2, 4, 1],
    [2, 4, 3, 1],
  ];
  GRUPOS_LIFO.forEach((g, i) => (triada[g.id] = ciclo[i % 3]));
  const t = calificarLifo(triada);
  const ausentes: EstiloLifo[] = [t.habitual.ausente!, t.estres.ausente!];
  assert.equal(t.habitual.perfil, "triada");
  assert.deepEqual(ausentes, ["an", "an"]);
  assert.match(interpretarLifo(t), /El padre fuerte/);
});

console.log(`\n${n} pruebas LIFO OK`);
