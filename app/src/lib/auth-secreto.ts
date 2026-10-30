/**
 * Secreto con el que se firman las sesiones (personal y aplicantes).
 *
 * En producción no hay respaldo: sin AUTH_SECRET (de al menos 16 caracteres;
 * lo recomendable son 32 o más, aleatorios) nadie entra. Un secreto conocido permitiría fabricar una sesión de
 * administrador, y ese panel concentra cuatro empresas.
 */

const RESPALDO_LOCAL = "dev-secret-psycotest-min16";
const MINIMO = 16;

export function secretoDeSesion(): Uint8Array {
  const s = process.env.AUTH_SECRET ?? "";
  if (s.length >= MINIMO && s !== RESPALDO_LOCAL) return new TextEncoder().encode(s);
  if (process.env.NODE_ENV === "production") {
    throw new Error(`AUTH_SECRET ausente o menor a ${MINIMO} caracteres: las sesiones están deshabilitadas.`);
  }
  return new TextEncoder().encode(RESPALDO_LOCAL);
}
