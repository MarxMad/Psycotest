import type { Programa } from "./tipos";

/*
 * Fotografías de escena de cada programa (public/ceduct/escenas): la persona
 * ejerciendo el oficio del estándar. Cada una existe en dos tamaños:
 * `<base>.webp` (2560 px) y `<base>-800.webp`.
 */

const RAIZ = "/ceduct/escenas";

/** Ruta base (sin tamaño ni extensión) por clave de estándar o, en diplomados, por slug. */
export function escenaDe(p: Pick<Programa, "estandarClave" | "slug">): string | null {
  const clave = p.estandarClave?.toLowerCase().match(/ec\d{4}/)?.[0];
  if (clave) return `${RAIZ}/${clave}`;
  if (p.slug.includes("coach")) return `${RAIZ}/coach-en-accion`;
  if (p.slug.includes("formador")) return `${RAIZ}/formador-que-inspira`;
  return null;
}

/** Imagen para mostrar: la que se subió al programa o, si no hay, su escena. */
export function imagenDe(
  p: Pick<Programa, "estandarClave" | "slug" | "imagen">,
  tamano: "chica" | "grande" = "chica",
): string | null {
  if (p.imagen) return p.imagen;
  const base = escenaDe(p);
  if (!base) return null;
  return tamano === "chica" ? `${base}-800.webp` : `${base}.webp`;
}
