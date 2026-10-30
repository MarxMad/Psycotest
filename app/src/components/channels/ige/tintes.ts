/** Un tinte de cielo por bloque del catálogo, en el orden en que se presentan. */
export const TINTES_CATALOGO = ["#d9d6f7", "#f8d5c0", "#cbebdd", "#d3e3f5", "#f3d3e0"];

export function tinteDeBloque(indice: number) {
  return TINTES_CATALOGO[(indice < 0 ? 0 : indice) % TINTES_CATALOGO.length];
}
