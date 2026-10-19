/**
 * Interpretación MABE: estilo pensante + valores + catálogo de puestos.
 * Alineada a reportes de referencia (Jorge Hdez Galvez; Administrativo / Almacenista).
 */
import { PUESTOS_MABE, type PerfilPuestoMabe } from "@/data/mabe-puestos";
import {
  CUADRANTES,
  NOMBRES_CUADRANTE,
  NOMBRES_VALOR,
  VALORES,
  type Cuadrante,
  type ResultadoMabe,
  type Valor,
} from "./mabe";

export const ESTILOS_PENSAMIENTO: Record<
  string,
  { nombre: string; cuadrantes: Cuadrante[]; texto: string }
> = {
  "A/V": {
    nombre: "Dominante Conceptual (A/V)",
    cuadrantes: ["A", "V"],
    texto:
      "Preferencia marcada por el pensamiento cognoscitivo, teórico e intelectual. Inclina a datos, lógica, conceptos, síntesis y visión de futuro; suele respetar poco lo meramente estructurado, normativo o interpersonal cuando compite con la idea.",
  },
  "A/L": {
    nombre: "Izquierdo Doble (A/L)",
    cuadrantes: ["A", "L"],
    texto:
      "Enfoque analítico-organizado: reportes, procedimientos, control y seguimiento. Combina análisis racional con estructura, planeación y supervisión de sistemas.",
  },
  "L/I": {
    nombre: "Límbico (L/I)",
    cuadrantes: ["L", "I"],
    texto:
      "Orientación práctica e interpersonal: organizar, conservar y a la vez leer el clima humano. Útil en roles de operación con trato a personas.",
  },
  "I/V": {
    nombre: "Derecho Doble (I/V)",
    cuadrantes: ["I", "V"],
    texto:
      "Pensamiento experiencial y visionario: intuición, sentimientos, imagen panorámica e innovación. Menos atracción por el detalle numérico o la norma rígida.",
  },
};

const TEXTOS_VALOR_ALTO: Record<Valor, string> = {
  T: "Teórico alto: búsqueda de la verdad, razonamiento lógico y sistematización del conocimiento.",
  E: "Económico alto: utilidad, retorno y pragmatismo. Juzga por producción, ingreso o eficiencia.",
  A: "Estético alto: sensibilidad a forma, armonía y calidad de experiencia.",
  S: "Social alto: interés por personas, servicio y bienestar del grupo.",
  P: "Político alto: influencia, poder y posicionamiento.",
  R: "Religioso/regulatorio alto: código de conducta, unidad y juicio moral.",
};

const TEXTOS_VALOR_BAJO: Record<Valor, string> = {
  T: "Teórico bajo: menos interés por abstracciones; prioriza lo concreto y aplicable.",
  E: "Económico bajo: no se mueve principalmente por utilidad o ganancia.",
  A: "Estético bajo: práctico y programático; juzga por utilidad más que por forma.",
  S: "Social bajo: menor necesidad de afiliación; puede parecer distante en climas muy grupales.",
  P: "Político bajo: poco interés por el poder o la competencia de status.",
  R: "Religioso/regulatorio bajo: menos apego a códigos rígidos; más flexible ante normas.",
};

function graficaCuadrante(r: ResultadoMabe, c: Cuadrante, quien: "persona" | "puesto") {
  const bloque = quien === "persona" ? r.procPersona : r.procPuesto;
  return bloque.cuadrantes.find((x) => x.cuadrante === c)?.grafica ?? 0;
}

function graficaValor(r: ResultadoMabe, v: Valor, quien: "persona" | "puesto") {
  const bloque = quien === "persona" ? r.valPersona : r.valPuesto;
  return bloque.valores.find((x) => x.valor === v)?.grafica ?? 0;
}

export function estiloPensamientoPersona(r: ResultadoMabe) {
  const scores = CUADRANTES.map((c) => ({ c, v: graficaCuadrante(r, c, "persona") })).sort(
    (a, b) => b.v - a.v,
  );
  const key =
    Object.keys(ESTILOS_PENSAMIENTO).find((k) => {
      const set = new Set(k.split("/"));
      return set.has(scores[0].c) && set.has(scores[1].c);
    }) ?? "A/V";
  return (
    ESTILOS_PENSAMIENTO[key] ?? {
      nombre: `Preferencia ${scores[0].c}/${scores[1].c}`,
      cuadrantes: [scores[0].c, scores[1].c] as Cuadrante[],
      texto: `Cuadrantes dominantes: ${NOMBRES_CUADRANTE[scores[0].c]} y ${NOMBRES_CUADRANTE[scores[1].c]}.`,
    }
  );
}

function extremosValores(r: ResultadoMabe) {
  const ranked = VALORES.map((v) => ({ v, g: graficaValor(r, v, "persona") })).sort(
    (a, b) => b.g - a.g,
  );
  return { altos: ranked.slice(0, 2), bajos: ranked.slice(-2).reverse() };
}

function resolverPuesto(nombre?: string): PerfilPuestoMabe | undefined {
  if (!nombre) return undefined;
  const n = nombre.toLowerCase();
  return PUESTOS_MABE.find(
    (p) =>
      n.includes(p.id) ||
      n.includes(p.nombre.toLowerCase()) ||
      p.aliases.some((a) => n.includes(a)),
  );
}

export function interpretarMabeCompleto(
  r: ResultadoMabe,
  participante: string,
  puesto?: string,
): string {
  const estilo = estiloPensamientoPersona(r);
  const vals = extremosValores(r);
  const puestoRef = resolverPuesto(puesto);

  const lineas: string[] = [
    "Informe MABE — Preferencias de pensamiento y valores",
    "",
    `Participante: ${participante}`,
    puesto ? `Puesto de referencia: ${puesto}` : "Sin puesto de referencia cargado.",
    "",
    "══ PROCESO PENSANTE PREFERIDO (PERSONA) ══",
    "",
    estilo.nombre,
    estilo.texto,
    "",
    "Puntajes de gráfica (persona):",
    ...CUADRANTES.map(
      (c) => `· ${c} ${NOMBRES_CUADRANTE[c]}: ${graficaCuadrante(r, c, "persona").toFixed(0)}`,
    ),
    "",
    "══ VALORES PERSONALES ══",
    "",
    "Valores altos:",
    ...vals.altos.map((x) => `· ${NOMBRES_VALOR[x.v]} (${x.g.toFixed(0)}): ${TEXTOS_VALOR_ALTO[x.v]}`),
    "",
    "Valores bajos:",
    ...vals.bajos.map((x) => `· ${NOMBRES_VALOR[x.v]} (${x.g.toFixed(0)}): ${TEXTOS_VALOR_BAJO[x.v]}`),
    "",
  ];

  if (puestoRef) {
    lineas.push(
      "══ PERFIL DEL PUESTO (CATÁLOGO DE REFERENCIA) ══",
      "",
      `${puestoRef.nombre}${puestoRef.empresa ? ` — ${puestoRef.empresa}` : ""}`,
      "",
      "Proceso pensante del puesto:",
      puestoRef.procesoPensante,
      "",
      "Valores del puesto:",
      ...puestoRef.valores.map((v) => `· ${v}`),
      "",
    );
  }

  lineas.push(
    "══ AJUSTE PERSONA – PUESTO (BRECHAS CALCULADAS) ══",
    "",
    "Proceso pensante (persona − puesto):",
    ...CUADRANTES.map((c) => {
      const b = r.brechas.proceso[c];
      return `· ${c} ${NOMBRES_CUADRANTE[c]}: ${b > 0 ? "+" : ""}${b}`;
    }),
    "",
    "Valores (persona − puesto):",
    ...VALORES.map((v) => {
      const b = r.brechas.valores[v];
      return `· ${v} ${NOMBRES_VALOR[v]}: ${b > 0 ? "+" : ""}${b}`;
    }),
    "",
    `Combinaciones: L(A+L)=${r.combinaciones.L} · R(I+V)=${r.combinaciones.R} · C(A+V)=${r.combinaciones.C} · S(L+I)=${r.combinaciones.S}`,
    "",
    "El psicólogo debe completar supervisión efectiva y dictamen con el manual MABE.",
  );

  return lineas.join("\n");
}
