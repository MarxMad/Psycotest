/**
 * Nombres comerciales de los instrumentos.
 *
 * Los slugs internos (papi, hartman, mabe, cleaver) siguen viviendo en la base
 * de datos, las rutas y el motor de calificación. Estos son los ÚNICOS nombres
 * que se muestran en pantalla, tanto en los canales públicos como en el panel.
 */

import type { Instrumento } from "@/lib/storage";

export const NOMBRE_INSTRUMENTO: Record<Instrumento, string> = {
  papi: "Inventario de Personalidad",
  hartman: "Axiología de Valores",
  mabe: "Toma de Decisiones",
  cleaver: "Compatibilidad Puesto–Persona",
};

/** Versión corta para chips, tablas y columnas estrechas. */
export const NOMBRE_CORTO: Record<Instrumento, string> = {
  papi: "Personalidad",
  hartman: "Valores",
  mabe: "Decisiones",
  cleaver: "Compatibilidad",
};

/** Qué mide, en una línea. */
export const MIDE: Record<Instrumento, string> = {
  papi: "Rasgos estables y estilo de trabajo",
  hartman: "Jerarquía de valores y motivación",
  mabe: "Criterio y razonamiento aplicado",
  cleaver: "Ajuste entre el perfil y el puesto",
};

/** Encabezado descriptivo para informes y PDF. */
export const SUBTITULO_INSTRUMENTO: Record<Instrumento, string> = {
  papi: "Inventario de Personalidad — rasgos y estilo de trabajo",
  hartman: "Axiología de Valores — jerarquía de valores y motivación",
  mabe: "Toma de Decisiones — criterio y ajuste al puesto",
  cleaver: "Compatibilidad Puesto–Persona — ajuste conductual al rol",
};

export function nombreInstrumento(slug: string): string {
  return NOMBRE_INSTRUMENTO[slug as Instrumento] ?? slug;
}
