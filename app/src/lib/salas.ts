/**
 * Nombres de sala de videollamada.
 *
 * Aparte de la capa de datos: la pantalla del panel que avisa de las salas
 * antiguas es un componente de cliente, y al importarlo de un módulo que toca
 * la base se arrastraba código de servidor al navegador.
 */

/** Doce bytes al azar en hexadecimal: 96 bits, no se acierta probando. */
export function azarDeSala(): string {
  const bytes = new Uint8Array(12);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Semilla legible para reconocer la sala de un vistazo. */
export function semillaDeSala(classId: string): string {
  return classId.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toLowerCase() || "sala";
}

/** Las salas que llevan cola al azar. Las anteriores se podían adivinar. */
const SALA_PROTEGIDA = /\/sistemapsic-[a-z0-9]+-[0-9a-f]{24}$/;

export function salaEsAdivinable(roomUrl: string | null | undefined): boolean {
  if (!roomUrl) return false;
  return !SALA_PROTEGIDA.test(roomUrl);
}
