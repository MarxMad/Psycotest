/**
 * Motor del Estudio Socioeconómico.
 *
 * No hay calificación psicométrica: lo que se «calcula» es el avance de cada
 * sección, el balance de ingresos contra egresos y el promedio de lo que
 * contestaron los patrones. Con eso se arma el resumen que ve el investigador
 * y el borrador de la interpretación del informe.
 *
 * Funciones puras, como los demás motores: no tocan base, red ni DOM.
 */

import {
  CONCEPTOS_EGRESO,
  CONCEPTOS_PATRON,
  ESCALA_RIESGO,
  FUENTES_INGRESO,
  SECCIONES_CANDIDATO,
  SECCIONES_INVESTIGADOR,
  TRANSFERENCIA,
  type Campo,
  type Fila,
  type Quien,
  type Seccion,
  type Valor,
  type ValoresSeccion,
} from "@/data/socioeconomico";

export type AvisoAceptado = {
  transferencia: keyof typeof TRANSFERENCIA;
  /** Nombre completo escrito por el candidato: hace las veces de firma. */
  nombre: string;
  fecha: string;
};

export type RespuestasSocioeconomico = {
  version: 1;
  aviso: AvisoAceptado | null;
  candidato: Record<string, ValoresSeccion>;
  investigador: Record<string, ValoresSeccion>;
};

export type AvanceSeccion = { id: string; titulo: string; completa: boolean };

export type ResumenSocioeconomico = {
  /** Lo que le falta al investigador para poder validar: secciones incompletas o el dictamen. */
  pendientesValidar: string[];
  ingresos: number;
  egresos: number;
  diferencia: number;
  avanceCandidato: AvanceSeccion[];
  avanceInvestigador: AvanceSeccion[];
  verificaciones: { empresa: string; promedio: number | null; recomienda: string }[];
  /** Promedio de todas las calificaciones de patrones, 1–10. */
  promedioReferencias: number | null;
  riesgosZona: { concepto: string; nivel: string }[];
  dictamen: string | null;
  avisoAceptado: boolean;
  /** La parte del candidato está completa y la del investigador también. */
  completo: boolean;
};

export function respuestasVacias(): RespuestasSocioeconomico {
  return { version: 1, aviso: null, candidato: {}, investigador: {} };
}

/* ------------------------------------------------------------------ */
/* Lectura de valores                                                  */
/* ------------------------------------------------------------------ */

export function texto(v: Valor | Fila[] | undefined): string {
  if (v == null) return "";
  if (Array.isArray(v)) return v.every((x) => typeof x === "string") ? (v as string[]).join(", ") : "";
  return String(v).trim();
}

/** «$12,500.50» o «12500,5» → 12500.5. Vacío o ilegible → 0. */
export function monto(v: Valor | Fila[] | undefined): number {
  const n = Number(texto(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function pesos(n: number): string {
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 2 });
}

function lleno(campo: Campo, v: Valor | Fila[] | undefined): boolean {
  if (campo.tipo === "multiple") return Array.isArray(v) && v.length > 0;
  return texto(v) !== "";
}

function camposDe(s: Seccion): Campo[] {
  return [...(s.campos ?? []), ...(s.camposFinales ?? [])];
}

export function filasDe(valores: ValoresSeccion | undefined, s: Seccion): Fila[] {
  if (!s.lista) return [];
  const v = valores?.[s.lista.id];
  return Array.isArray(v) ? (v as Fila[]).filter((f) => f && typeof f === "object" && !Array.isArray(f)) : [];
}

/** ¿Están todos los obligatorios de la sección, y la lista con su mínimo? */
export function seccionCompleta(s: Seccion, valores: ValoresSeccion | undefined): boolean {
  const v = valores ?? {};
  for (const c of camposDe(s)) if (c.requerido && !lleno(c, v[c.id] as Valor)) return false;
  if (s.lista) {
    const filas = filasDe(v, s);
    if (filas.length < s.lista.min) return false;
    for (const f of filas) {
      for (const c of s.lista.campos) if (c.requerido && !lleno(c, f[c.id])) return false;
    }
  }
  return true;
}

/** Los campos obligatorios que faltan, con su etiqueta, para avisarle a quien llena. */
export function faltantes(s: Seccion, valores: ValoresSeccion | undefined): string[] {
  const v = valores ?? {};
  const fuera: string[] = [];
  for (const c of camposDe(s)) if (c.requerido && !lleno(c, v[c.id] as Valor)) fuera.push(c.etiqueta);
  if (s.lista) {
    const filas = filasDe(v, s);
    if (filas.length < s.lista.min) {
      fuera.push(`Al menos ${s.lista.min} ${s.lista.elemento.toLowerCase()}${s.lista.min === 1 ? "" : "s"}`);
    }
    filas.forEach((f, i) => {
      for (const c of s.lista!.campos) {
        if (c.requerido && !lleno(c, f[c.id])) fuera.push(`${s.lista!.elemento} ${i + 1}: ${c.etiqueta}`);
      }
    });
  }
  return fuera;
}

/* ------------------------------------------------------------------ */
/* Resumen                                                             */
/* ------------------------------------------------------------------ */

export function resumirSocioeconomico(r: RespuestasSocioeconomico): ResumenSocioeconomico {
  const eco = r.candidato.economia ?? {};
  const ingresos = FUENTES_INGRESO.reduce((n, f) => n + monto(eco[`ingreso_${f.id}`]), 0);
  const egresos = CONCEPTOS_EGRESO.reduce((n, [id]) => n + monto(eco[`egreso_${id}`]), 0);

  const avance = (secciones: Seccion[], valores: Record<string, ValoresSeccion>) =>
    secciones.map((s) => ({ id: s.id, titulo: s.titulo, completa: seccionCompleta(s, valores[s.id]) }));

  const patron = SECCIONES_INVESTIGADOR.find((s) => s.id === "patronReferencias")!;
  const todas: number[] = [];
  const verificaciones = filasDe(r.investigador.patronReferencias, patron).map((f) => {
    const notas = CONCEPTOS_PATRON.map(([id]) => Number(texto(f[`cal_${id}`]))).filter(
      (n) => Number.isFinite(n) && n >= 1 && n <= 10,
    );
    todas.push(...notas);
    return {
      empresa: texto(f.empresa),
      promedio: notas.length ? redondear(notas.reduce((a, b) => a + b, 0) / notas.length) : null,
      recomienda: texto(f.recomienda),
    };
  });

  const viv = r.investigador.vivienda ?? {};
  const riesgosZona = (
    [
      ["drogadiccion", "Drogadicción"],
      ["alcoholismo", "Alcoholismo"],
      ["delincuencia", "Delincuencia"],
    ] as const
  )
    .map(([id, concepto]) => ({ concepto, nivel: texto(viv[id]) }))
    .filter((x) => (ESCALA_RIESGO as readonly string[]).includes(x.nivel));

  const avanceCandidato = avance(SECCIONES_CANDIDATO, r.candidato);
  const avanceInvestigador = avance(SECCIONES_INVESTIGADOR, r.investigador);

  const dictamen = texto(r.investigador.conclusion?.dictamen) || null;

  return {
    pendientesValidar: avanceInvestigador.filter((a) => !a.completa).map((a) => a.titulo),
    ingresos,
    egresos,
    diferencia: ingresos - egresos,
    avanceCandidato,
    avanceInvestigador,
    verificaciones,
    promedioReferencias: todas.length ? redondear(todas.reduce((a, b) => a + b, 0) / todas.length) : null,
    riesgosZona,
    dictamen,
    avisoAceptado: Boolean(r.aviso?.nombre),
    completo:
      Boolean(r.aviso?.nombre) &&
      avanceCandidato.every((a) => a.completa) &&
      avanceInvestigador.every((a) => a.completa),
  };
}

function redondear(n: number) {
  return Math.round(n * 10) / 10;
}

/* ------------------------------------------------------------------ */
/* Interpretación                                                      */
/* ------------------------------------------------------------------ */

/**
 * Borrador del informe. Resume lo que dicen los datos; el juicio es del
 * investigador y va en su dictamen y observaciones.
 */
export function interpretarSocioeconomico(
  r: RespuestasSocioeconomico,
  res: ResumenSocioeconomico = resumirSocioeconomico(r),
): string {
  const g = r.candidato.generales ?? {};
  const fam = r.candidato.familia ?? {};
  const viv = r.investigador.vivienda ?? {};
  const concl = r.investigador.conclusion ?? {};
  const partes: string[] = [];

  const pendientesInv = res.avanceInvestigador.filter((a) => !a.completa).map((a) => a.titulo);
  if (pendientesInv.length) {
    partes.push(`Investigación en curso. Falta completar: ${pendientesInv.join(", ")}.`);
  }

  const datos = [
    texto(g.estadoCivil) && `estado civil ${texto(g.estadoCivil).toLowerCase()}`,
    texto(g.nivelAcademico) && `nivel académico ${texto(g.nivelAcademico).toLowerCase()}`,
    texto(fam.viveCon) && `vive con ${texto(fam.viveCon)}`,
    texto(fam.dependientes) && `${texto(fam.dependientes)} dependientes económicos`,
  ].filter(Boolean);
  if (datos.length) partes.push(`Generales: ${datos.join("; ")}.`);

  if (res.ingresos || res.egresos) {
    const balance =
      res.diferencia >= 0
        ? `un remanente de ${pesos(res.diferencia)}`
        : `un déficit de ${pesos(-res.diferencia)}`;
    partes.push(
      `Situación económica: ingresos familiares de ${pesos(res.ingresos)} y egresos de ${pesos(res.egresos)} al mes, con ${balance}.`,
    );
    const cubre = texto(r.candidato.economia?.comoCubreGastos);
    if (res.diferencia < 0 && cubre) partes.push(`Declara cubrir la diferencia así: ${cubre}`);
  }

  const vivienda = [texto(viv.tipoVivienda), texto(viv.tenencia) && texto(viv.tenencia).toLowerCase()]
    .filter(Boolean)
    .join(" ");
  if (vivienda) {
    const zona = [texto(viv.zona) && `zona ${texto(viv.zona).toLowerCase()}`, texto(viv.clase).toLowerCase()]
      .filter(Boolean)
      .join(", nivel ");
    partes.push(`Vivienda: ${vivienda}${zona ? `, en ${zona}` : ""}.`);
  }
  const altos = res.riesgosZona.filter((z) => z.nivel === "Alto").map((z) => z.concepto.toLowerCase());
  if (altos.length) partes.push(`En la zona se observa riesgo alto de ${altos.join(" y ")}.`);

  if (res.verificaciones.length) {
    const recomiendan = res.verificaciones.filter((v) => v.recomienda === "Sí").length;
    partes.push(
      `Referencias laborales: ${res.verificaciones.length} verificadas, ${recomiendan} lo recomendarían nuevamente` +
        (res.promedioReferencias != null ? `; calificación promedio ${res.promedioReferencias} de 10.` : "."),
    );
  }

  if (res.dictamen) partes.push(`Dictamen: ${res.dictamen}.`);
  const obs = texto(concl.observaciones);
  if (obs) partes.push(obs);

  if (r.aviso?.transferencia === "noAcepta") {
    partes.push("El candidato NO aceptó la transferencia de sus datos a terceros.");
  }

  return partes.join("\n\n") || "Sin datos suficientes para el informe.";
}

/* ------------------------------------------------------------------ */
/* Saneamiento                                                         */
/* ------------------------------------------------------------------ */

const LARGO_MAX = 2000;

function limpiarValor(c: Campo, v: unknown): Valor | undefined {
  if (c.tipo === "multiple") {
    if (!Array.isArray(v)) return undefined;
    return v.filter((x): x is string => typeof x === "string" && (c.opciones ?? []).includes(x));
  }
  if (typeof v !== "string" && typeof v !== "number") return undefined;
  const s = String(v).slice(0, LARGO_MAX);
  if ((c.tipo === "opcion" || c.tipo === "sino" || c.tipo === "escala") && s && !(c.opciones ?? []).includes(s)) {
    return undefined;
  }
  return s;
}

function limpiarSeccion(s: Seccion, crudo: unknown): ValoresSeccion {
  const fuente = (crudo && typeof crudo === "object" ? crudo : {}) as Record<string, unknown>;
  const out: ValoresSeccion = {};
  for (const c of camposDe(s)) {
    const v = limpiarValor(c, fuente[c.id]);
    if (v !== undefined) out[c.id] = v;
  }
  if (s.lista) {
    const filas = Array.isArray(fuente[s.lista.id]) ? (fuente[s.lista.id] as unknown[]) : [];
    out[s.lista.id] = filas.slice(0, s.lista.max).map((f) => {
      const fila: Fila = {};
      const ff = (f && typeof f === "object" ? f : {}) as Record<string, unknown>;
      for (const c of s.lista!.campos) {
        const v = limpiarValor(c, ff[c.id]);
        if (v !== undefined) fila[c.id] = v;
      }
      return fila;
    });
  }
  return out;
}

/** Sólo las secciones y campos conocidos de quien llena, con opciones válidas y largo acotado. */
export function limpiarParte(quien: Quien, crudo: unknown): Record<string, ValoresSeccion> {
  const fuente = (crudo && typeof crudo === "object" ? crudo : {}) as Record<string, unknown>;
  const secciones = quien === "candidato" ? SECCIONES_CANDIDATO : SECCIONES_INVESTIGADOR;
  return Object.fromEntries(secciones.map((s) => [s.id, limpiarSeccion(s, fuente[s.id])]));
}

export function limpiarAviso(crudo: unknown): AvisoAceptado | null {
  if (!crudo || typeof crudo !== "object") return null;
  const a = crudo as Record<string, unknown>;
  const nombre = typeof a.nombre === "string" ? a.nombre.trim().slice(0, 200) : "";
  const transferencia = a.transferencia === "noAcepta" ? "noAcepta" : a.transferencia === "acepta" ? "acepta" : null;
  if (!nombre || !transferencia) return null;
  const fecha = typeof a.fecha === "string" && !Number.isNaN(Date.parse(a.fecha)) ? a.fecha : new Date().toISOString();
  return { transferencia, nombre, fecha };
}

/**
 * Lo que manda el candidato. La parte del investigador se descarta siempre:
 * el candidato no puede escribirla, aunque la mande.
 */
export function respuestasDelCandidato(crudo: unknown): RespuestasSocioeconomico {
  const r = (crudo && typeof crudo === "object" ? crudo : {}) as Record<string, unknown>;
  return {
    version: 1,
    aviso: limpiarAviso(r.aviso),
    candidato: limpiarParte("candidato", r.candidato),
    investigador: {},
  };
}

/** Normaliza lo que viene de la base, por si es de una versión anterior o está incompleto. */
export function comoRespuestas(crudo: unknown): RespuestasSocioeconomico {
  const r = (crudo && typeof crudo === "object" ? crudo : {}) as Partial<RespuestasSocioeconomico>;
  return {
    version: 1,
    aviso: r.aviso ?? null,
    candidato: r.candidato ?? {},
    investigador: r.investigador ?? {},
  };
}
