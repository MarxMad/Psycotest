/**
 * Textos borrador para el panel del psicólogo.
 */

import type { ResultadoMabe } from "./mabe";
import { CUADRANTES, NOMBRES_CUADRANTE, NOMBRES_VALOR, VALORES } from "./mabe";
import type { ResultadoPapi } from "./papi";
import { NOMBRES, DIADAS, banda } from "./papi";
import type { ResultadoHartman } from "./hartman";
import { etiquetaNivel, nivel } from "./hartman";
import type { ResultadoCleaver } from "./cleaver";
import type { ResultadoCondicion, ResultadoLifo } from "./lifo";
import {
  COMBINACIONES as COMBINACIONES_LIFO,
  ESTILOS as ESTILOS_LIFO_TXT,
  ESTILOS_LIFO,
  MENOS_PREFERIDO as MENOS_PREFERIDO_LIFO,
  PERFILES as PERFILES_LIFO,
  type EstiloLifo,
} from "@/data/lifo";
import {
  FACTORES_CLEAVER,
  NOMBRES_FACTOR,
  factorDominante,
  textoGenericoFactor,
} from "./cleaver";

function topEntries<T extends string>(
  record: Record<T, number>,
  nombres: Record<T, string>,
  n = 2,
) {
  return Object.entries(record)
    .map(([k, v]) => ({ key: k as T, val: v as number, nombre: nombres[k as T] }))
    .sort((a, b) => Math.abs(b.val) - Math.abs(a.val))
    .slice(0, n);
}

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
        `· ${d.rol} (${r.puntajes[d.rol]}, ${banda(r.puntajes[d.rol])}) — ${NOMBRES[d.rol]} · ${d.necesidad} (${r.puntajes[d.necesidad]}, ${banda(r.puntajes[d.necesidad])}) — ${NOMBRES[d.necesidad]}`,
    ),
    altos.length === 0 ? "· Ninguno en rango alto." : "",
    "",
    "Puntos de atención interpretativa:",
    "· Contrastar rol vs necesidad en cada díada (L–P, G–N, etc.).",
    "· Revisar dimensiones con factores en banda alta o baja en las gráficas.",
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
    `Parte I (V.Q.): DIF ${r.VQ.DIF}, DIS ${r.VQ.DIS}, Q₁ ${r.VQ.Q1} (${r.interpretable ? etiquetaNivel(nivel("Q1", r.VQ.Q1)) : "—"}), Q₂ ${r.VQ.Q2}`,
    `Parte II (S.Q.): DIF ${r.SQ.DIF}, DIS ${r.SQ.DIS}, Q₁ ${r.SQ.Q1}, Q₂ ${r.SQ.Q2}`,
    "",
    c1
      ? `BQr: ${c1.BQr.toFixed(2)} · BQa: ${c1.BQa.toFixed(1)} · CQ: ${c1.CQ.toFixed(1)}`
      : "Índices compuestos no calculados (protocolo no interpretable).",
    "",
    "Alertas:",
    ...(r.VQ.alertas.length + r.SQ.alertas.length === 0
      ? ["· Ninguna alerta automática."]
      : []),
    ...r.VQ.alertas.map((a) => `· VQ: ${a}`),
    ...r.SQ.alertas.map((a) => `· SQ: ${a}`),
    "",
    "Completar con textos de Plantillas Hartman.docx.",
  ];
  return lineas.join("\n");
}

export function interpretarMabe(r: ResultadoMabe, participante: string, puesto?: string): string {
  const topProc = topEntries(r.brechas.proceso, NOMBRES_CUADRANTE);
  const topVal = topEntries(r.brechas.valores, NOMBRES_VALOR);

  const dominantePuesto = [...CUADRANTES].sort(
    (a, b) =>
      (r.procPuesto.cuadrantes.find((c) => c.cuadrante === b)?.grafica ?? 0) -
      (r.procPuesto.cuadrantes.find((c) => c.cuadrante === a)?.grafica ?? 0),
  )[0];

  const dominantePersona = [...CUADRANTES].sort(
    (a, b) =>
      (r.procPersona.cuadrantes.find((c) => c.cuadrante === b)?.grafica ?? 0) -
      (r.procPersona.cuadrantes.find((c) => c.cuadrante === a)?.grafica ?? 0),
  )[0];

  return [
    "Informe borrador — MABE",
    "",
    `Participante: ${participante}`,
    puesto ? `Puesto de referencia: ${puesto}` : "",
    "",
    "══ AJUSTE PERSONA – PUESTO ══",
    "",
    "Cuadrante dominante del puesto:",
    `· ${dominantePuesto} (${NOMBRES_CUADRANTE[dominantePuesto]})`,
    "",
    "Cuadrante dominante de la persona:",
    `· ${dominantePersona} (${NOMBRES_CUADRANTE[dominantePersona]})`,
    "",
    "Mayores brechas — proceso pensante:",
    ...topProc.map(
      (b) =>
        `· ${b.key} (${b.nombre}): ${b.val > 0 ? "+" : ""}${b.val} — ${b.val > 0 ? "persona por encima del puesto" : "persona por debajo del puesto"}`,
    ),
    "",
    "Mayores brechas — valores:",
    ...topVal.map(
      (b) =>
        `· ${b.key} (${b.nombre}): ${b.val > 0 ? "+" : ""}${b.val}`,
    ),
    "",
    "Detalle proceso pensante (brecha persona − puesto):",
    ...CUADRANTES.map(
      (k) =>
        `· ${k} (${NOMBRES_CUADRANTE[k]}): ${r.brechas.proceso[k] > 0 ? "+" : ""}${r.brechas.proceso[k]}`,
    ),
    "",
    "Detalle valores (brecha persona − puesto):",
    ...VALORES.map(
      (k) =>
        `· ${k} (${NOMBRES_VALOR[k]}): ${r.brechas.valores[k] > 0 ? "+" : ""}${r.brechas.valores[k]}`,
    ),
    "",
    "Combinaciones cuadrantes (puesto):",
    `· L (A+L)=${r.combinaciones.L} · R (I+V)=${r.combinaciones.R} · C (A+V)=${r.combinaciones.C} · S (L+I)=${r.combinaciones.S}`,
    "",
    "Puntos para completar en la entrevista:",
    "· Contrastar curvas roja/azul en gráficas de proceso y valores.",
    "· Identificar pares de valores altos (manual §III y §V).",
    "· Evaluar implicaciones de supervisión (manual §VI).",
    "",
    "Completar con manual MABE_2007.docx.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function interpretarCleaver(r: ResultadoCleaver): string {
  const dom = factorDominante(r.T);
  const lineas = [
    "Informe — Cleaver (Autodescripción / DISC)",
    "",
    `Protocolo: ${r.completo ? "completo" : `incompleto (${r.respondidas}/24)`} · Validez ΣT=${r.validez} (${r.validezEtiqueta})`,
    "",
    "Conteos M (motivado) / L (presión) / T (cotidiano):",
    ...FACTORES_CLEAVER.map(
      (f) =>
        `· ${f} ${NOMBRES_FACTOR[f]}: M=${r.M[f]}  L=${r.L[f]}  T=${r.T[f] >= 0 ? "+" : ""}${r.T[f]}  · gráfica T=${Math.round(r.grafica.T[f])}`,
    ),
    "",
    `Factor dominante en T: ${dom} (${NOMBRES_FACTOR[dom]}).`,
    "",
    "Lectura de gráficas (manual):",
    "· M — estilo motivado / deseos básicos",
    "· L — limitaciones bajo presión",
    "· T — conducta cotidiana observable",
    "",
    `Perfiles aplanados (40–60): M=${r.aplanado.M ? "sí" : "no"} · L=${r.aplanado.L ? "sí" : "no"} · T=${r.aplanado.T ? "sí" : "no"}`,
    ...(r.aplanado.T
      ? [
          "· T aplanada: interpretar M y L por separado; riqueza informativa limitada en el estilo cotidiano.",
        ]
      : []),
    "",
    ...(r.estiloClasico
      ? [
          `Estilo clásico sugerido: #${r.estiloClasico.id} ${r.estiloClasico.nombre} (${r.estiloClasico.segmento})`,
          r.estiloClasico.resumen,
          "",
        ]
      : ["Estilo clásico: no asignado (perfil aplanado o mixto).", ""]),
    ...(r.combinaciones.length
      ? [
          "Combinaciones básicas activas (gráfica T):",
          ...r.combinaciones.map((c) => `· ${c.nombre} (${c.id}): ${c.texto}`),
          "",
        ]
      : []),
    "Descripción genérica por factor (según intensidad en T):",
    ...FACTORES_CLEAVER.map((f) => `· ${f}: ${textoGenericoFactor(f, r.grafica.T[f])}`),
    "",
    ...(r.alertas.length ? ["Alertas:", ...r.alertas.map((a) => `· ${a}`), ""] : []),
    "Confrontar con Factor Humano del puesto (Análisis del Trabajo) cuando exista perfil en job_profiles.cleaver_puesto.",
  ];
  return lineas.join("\n");
}
const NOMBRE_CONDICION = { habitual: "condiciones habituales", estres: "condiciones de estrés" } as const;

function listaEstilos(estilos: EstiloLifo[]): string {
  return estilos.map((e) => `${ESTILOS_LIFO_TXT[e].nombre} (${ESTILOS_LIFO_TXT[e].sigla})`).join(" + ") || "—";
}

function perfilTexto(c: ResultadoCondicion): string[] {
  const p = PERFILES_LIFO[c.perfil];
  const lineas = [
    `${p.nombre}${c.primarioModerado ? " (moderado: ventaja menor a 8 puntos)" : ""}.`,
    ...p.atributos.map((a) => `· ${a}`),
    ...(p.fuerzas.length ? ["Fuerzas:", ...p.fuerzas.map((f) => `· ${f}`)] : []),
    ...(p.vulnerables.length ? ["Puntos vulnerables:", ...p.vulnerables.map((f) => `· ${f}`)] : []),
  ];
  for (const clave of c.combinaciones) {
    const t = COMBINACIONES_LIFO[clave];
    const [a, b] = clave.split("-") as EstiloLifo[];
    lineas.push(
      "",
      `Combinación ${ESTILOS_LIFO_TXT[a].sigla} + ${ESTILOS_LIFO_TXT[b].sigla}:`,
      "Condiciones favorables:",
      ...t.favorables.map((x) => `· ${x}`),
      "Condiciones adversas:",
      ...t.adversas.map((x) => `· ${x}`),
      "Excesos:",
      ...t.excesos.map((x) => `· ${x}`),
    );
  }
  if (c.ausente) {
    const t = MENOS_PREFERIDO_LIFO[c.ausente];
    lineas.push(
      "",
      `Estilo menos preferido: ${ESTILOS_LIFO_TXT[c.ausente].nombre}${t.apodo ? ` — ${t.apodo}` : ""}`,
      "Condiciones favorables:",
      ...t.favorables.map((x) => `· ${x}`),
      "Condiciones adversas:",
      ...t.adversas.map((x) => `· ${x}`),
      "Excesos:",
      ...t.excesos.map((x) => `· ${x}`),
    );
  }
  return lineas;
}

function terminosDe(estilos: EstiloLifo[]): string[] {
  return estilos.flatMap((e) => [
    `${ESTILOS_LIFO_TXT[e].nombre}:`,
    `  Uso productivo: ${ESTILOS_LIFO_TXT[e].terminos.map(([p]) => p.toLowerCase()).join(", ")}.`,
    `  Posibles excesos: ${ESTILOS_LIFO_TXT[e].terminos.map(([, x]) => x.toLowerCase()).join(", ")}.`,
  ]);
}

function fuerzaExceso(estilos: EstiloLifo[], campo: "habituales" | "lucha" | "tension"): string[] {
  return estilos.flatMap((e) => {
    const l = ESTILOS_LIFO_TXT[e][campo];
    return [
      `${ESTILOS_LIFO_TXT[e].nombre} — fuerza (productiva):`,
      ...l.fuerza.map((x) => `· ${x}`),
      `${ESTILOS_LIFO_TXT[e].nombre} — exceso (no productivo):`,
      ...l.exceso.map((x) => `· ${x}`),
    ];
  });
}

/**
 * Informe borrador LIFO. Sigue el formato RESULTADOS LIFO del cliente:
 * combinaciones preferidas, fuerza/exceso por condición, comunicación,
 * contribuciones al equipo, orientación básica y liderazgo. Las
 * observaciones finales quedan para el psicólogo.
 */
export function interpretarLifo(r: ResultadoLifo): string {
  const h = r.habitual;
  const e = r.estres;
  const fila = (c: ResultadoCondicion) =>
    ESTILOS_LIFO.map((k) => `${ESTILOS_LIFO_TXT[k].sigla} ${c.puntajes[k]}`).join(" · ") + ` (Σ ${c.total})`;

  const lineas = [
    "Informe — LIFO® Orientaciones de Vida",
    "",
    `Protocolo: ${r.completo ? "completo" : `incompleto (${r.respondidas}/18 grupos)`}. Puntajes de 9 a 36; cada condición suma 90.`,
    `Condiciones habituales: ${fila(h)}`,
    `Condiciones de estrés:  ${fila(e)}`,
    "",
    `Preferidos en condiciones habituales: ${listaEstilos(h.preferidos)}`,
    `Menos preferidos en condiciones habituales: ${listaEstilos(h.menosPreferidos)}`,
    `Preferidos en condiciones de estrés: ${listaEstilos(e.preferidos)}`,
    `Menos preferidos en condiciones de estrés: ${listaEstilos(e.menosPreferidos)}`,
    r.cambiaBajoEstres
      ? "· Su patrón cambia bajo estrés: recurre a otro estilo cuando enfrenta conflicto o adversidad."
      : "· Mantiene el mismo patrón en condiciones favorables y de estrés.",
    "",
    "══ COMBINACIONES PREFERIDAS DE ESTILO EN CONDICIONES HABITUALES ══",
    ...terminosDe(h.preferidos),
    "",
    "══ COMBINACIONES PREFERIDAS DE ESTILO EN CONDICIONES DE OPOSICIÓN Y DE ESTRÉS ══",
    ...terminosDe(e.preferidos),
    "",
    "══ FUERZA Y EXCESO — CONDICIONES HABITUALES ══",
    ...fuerzaExceso(h.preferidos, "habituales"),
    "",
    "══ FUERZA Y EXCESO — CONDICIONES DE LUCHA ══",
    ...fuerzaExceso(e.preferidos, "lucha"),
    "",
    "══ FUERZA Y EXCESO — CONDICIONES DE TENSIÓN ══",
    ...fuerzaExceso(e.preferidos, "tension"),
    "",
    "══ COMUNICACIÓN E INFLUENCIA PERSONAL ══",
    ...h.preferidos.flatMap((k) => {
      const c = ESTILOS_LIFO_TXT[k].comunicacion;
      return [
        `${ESTILOS_LIFO_TXT[k].nombre}:`,
        `· Cómo comunicarse de acuerdo a su estilo: ${c.comoComunicarse}`,
        `· El mejor ambiente para su estilo: ${c.mejorAmbiente}`,
        `· El peor ambiente para su estilo: ${c.peorAmbiente}`,
        `· Le gusta ser visto como: ${ESTILOS_LIFO_TXT[k].meta}`,
        `· Para dirigirlo con eficacia: ${c.jefeEfectivo}`,
      ];
    }),
    "",
    "══ CONTRIBUCIONES AL EQUIPO DE TRABAJO ══",
    "Productivo:",
    ...h.preferidos.map((k) => `· ${ESTILOS_LIFO_TXT[k].tiempo.usoProductivo}`),
    "Estilo de estrés:",
    ...e.preferidos.map((k) => `· ${ESTILOS_LIFO_TXT[k].tiempo.trampa} Síntomas de exceso: ${ESTILOS_LIFO_TXT[k].tiempo.sintomas}`),
    "En situaciones de dirección / equipo:",
    ...h.preferidos.flatMap((k) => [
      `· ${ESTILOS_LIFO_TXT[k].cambio.estiloDirectivo}`,
      `· Ante el cambio: ${ESTILOS_LIFO_TXT[k].cambio.primeraReaccion}`,
      `· Planeación: ${ESTILOS_LIFO_TXT[k].expresion.plan}`,
    ]),
    "",
    "══ ORIENTACIÓN BÁSICA ══",
    ...h.preferidos.flatMap((k) => [
      `${ESTILOS_LIFO_TXT[k].nombre}: ${ESTILOS_LIFO_TXT[k].orientacion}`,
      `Meta: ${ESTILOS_LIFO_TXT[k].meta}`,
    ]),
    "",
    "══ LIDERAZGO ══",
    ...h.preferidos.flatMap((k) => [
      `· ${ESTILOS_LIFO_TXT[k].expresion.liderazgo}`,
      `· Riesgo: ${ESTILOS_LIFO_TXT[k].expresion.riesgo}`,
    ]),
    "",
    `══ PERFIL EN ${NOMBRE_CONDICION.habitual.toUpperCase()} ══`,
    ...perfilTexto(h),
    "",
    `══ PERFIL EN ${NOMBRE_CONDICION.estres.toUpperCase()} ══`,
    ...perfilTexto(e),
    "",
    "══ CÓMO AYUDARLE A SUPERAR SUS EXCESOS ══",
    ...e.preferidos.flatMap((k) => [
      `${ESTILOS_LIFO_TXT[k].nombre}: ${ESTILOS_LIFO_TXT[k].superarExcesos}`,
      `Necesita: ${ESTILOS_LIFO_TXT[k].necesidades}`,
    ]),
    "",
    ...(r.alertas.length ? ["Alertas:", ...r.alertas.map((a) => `· ${a}`), ""] : []),
    "══ OBSERVACIONES FINALES ══",
    "Completar por el evaluador.",
  ];
  return lineas.join("\n");
}
