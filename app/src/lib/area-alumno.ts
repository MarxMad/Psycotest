/**
 * Zonas privadas por canal.
 *
 * Las cuatro páginas públicas venden cosas distintas a propósito, para no
 * confundir a quien compra. La zona privada sigue la misma lógica: quien
 * contrató evaluaciones no debe toparse con un catálogo de cursos.
 *
 * Todo alimenta el mismo panel de administración; lo que cambia es qué ve
 * cada persona de su propio contenido.
 */

import type { ChannelId } from "./channels";

export type SeccionAlumno = {
  /** Ruta relativa dentro de la zona privada */
  href: string;
  label: string;
  /** Qué encuentra ahí, para la pantalla de inicio de la zona */
  descripcion: string;
};

/** Raíz de la zona privada. Igual en los cuatro canales. */
export const AREA_BASE = "/mi-cuenta";

export const SECCIONES_ALUMNO: Record<ChannelId, SeccionAlumno[]> = {
  ceduct: [
    {
      href: `${AREA_BASE}/expediente`,
      label: "Mi expediente",
      descripcion: "Tu avance hacia la certificación: evidencias, evaluaciones y dictamen.",
    },
    {
      href: `${AREA_BASE}/constancias`,
      label: "Mis constancias",
      descripcion: "Descarga los documentos que ya obtuviste y comparte su verificación.",
    },
    {
      href: `${AREA_BASE}/programas`,
      label: "Mis programas",
      descripcion: "Los diplomados y estándares en los que estás inscrito.",
    },
  ],
  psicologia: [
    {
      href: `${AREA_BASE}/evaluaciones`,
      label: "Mis evaluaciones",
      descripcion: "Resultados de los candidatos que evaluaste y sus informes.",
    },
    {
      href: `${AREA_BASE}/programas`,
      label: "Mis diplomados",
      descripcion: "Tu avance en los diplomados de 90 horas.",
    },
  ],
  ige: [
    {
      href: `${AREA_BASE}/cursos`,
      label: "Mis cursos",
      descripcion: "Las clases que compraste, con tu avance por lección.",
    },
    {
      href: `${AREA_BASE}/en-vivo`,
      label: "Clases en vivo",
      descripcion: "Las sesiones programadas y las grabaciones de las que ya pasaron.",
    },
  ],
  // El portafolio no vende nada por sí mismo: no tiene zona privada.
  martin: [],
};

/** ¿Este canal ofrece zona privada? */
export function tieneAreaAlumno(canal: ChannelId): boolean {
  return SECCIONES_ALUMNO[canal].length > 0;
}

/** Primera sección del canal; es a donde cae alguien al entrar. */
export function inicioDelArea(canal: ChannelId): string {
  return SECCIONES_ALUMNO[canal][0]?.href ?? AREA_BASE;
}

/** Título de la zona, para el encabezado. */
export const TITULO_AREA: Record<ChannelId, string> = {
  ceduct: "Mi certificación",
  psicologia: "Mi cuenta",
  ige: "Mi formación",
  martin: "Mi cuenta",
};

/** ¿Esta sección pertenece al canal? */
export function seccionPertenece(canal: ChannelId, href: string): boolean {
  return SECCIONES_ALUMNO[canal].some((s) => s.href === href);
}
