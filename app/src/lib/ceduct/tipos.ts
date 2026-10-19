/**
 * Tipos y formatos del marketplace de CEDUCT.
 *
 * Sin dependencias de servidor: el carrito, los filtros y el checkout corren
 * en el navegador e importan de aquí.
 */

export type TipoPrograma = "diplomado" | "certificacion";
export type Modalidad = "online" | "presencial" | "mixta";
export type Nivel = "basico" | "intermedio" | "avanzado";

export type Instructor = {
  nombre: string;
  cargo: string;
  bio: string;
  /** URL de la foto. Sin foto se pintan sus iniciales. */
  foto: string | null;
};

export type Modulo = { titulo: string; lecciones: string[] };

export type Programa = {
  id: string;
  slug: string;
  tipo: TipoPrograma;
  titulo: string;
  subtitulo: string | null;
  descripcion: string;
  /** Slug de la categoría (ver CATEGORIAS en config.ts). */
  categoria: string;
  /** Centavos MXN, IVA incluido. 0 = «Consultar». */
  precioMxn: number;
  /** Precio antes de la promoción, si la hay. */
  precioAntesMxn: number | null;
  imagen: string | null;
  instructores: Instructor[];
  nivel: Nivel;
  modalidad: Modalidad;
  horas: number;
  /** Texto libre: «12 semanas», «3 sesiones». */
  duracion: string;
  /** ISO yyyy-mm-dd, o null si es de inicio inmediato. */
  fechaInicio: string | null;
  estandarClave: string | null;
  temario: Modulo[];
  requisitos: string[];
  dirigidoA: string[];
  cupo: number | null;
  vendidos: number;
  destacado: boolean;
  /** `demo`: dato de ejemplo, no existe en la base ni se puede cobrar. */
  fuente: "base" | "demo";
};

export const TIPO_LABEL: Record<TipoPrograma, string> = {
  diplomado: "Diplomado",
  certificacion: "Certificación",
};

export const TIPO_PLURAL: Record<TipoPrograma, string> = {
  diplomado: "Diplomados",
  certificacion: "Certificaciones",
};

export const MODALIDAD_LABEL: Record<Modalidad, string> = {
  online: "En línea",
  presencial: "Presencial",
  mixta: "Híbrido",
};

export const NIVEL_LABEL: Record<Nivel, string> = {
  basico: "Básico",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

/** Centavos → «$12,500». Cero se lee «Consultar». */
export function precio(centavos: number, conDecimales = false): string {
  if (centavos <= 0) return "Consultar";
  return (centavos / 100).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: conDecimales ? 2 : 0,
    maximumFractionDigits: conDecimales ? 2 : 0,
  });
}

/** «2026-11-09» → «9 nov 2026». Sin fecha: «Inicio inmediato». */
export function fechaCorta(iso: string | null): string {
  if (!iso) return "Inicio inmediato";
  const [a, m, d] = iso.split("-").map(Number);
  if (!a || !m || !d) return iso;
  return new Date(Date.UTC(a, m - 1, d)).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function iniciales(nombre: string): string {
  return nombre
    .replace(/^(Dra?\.|Mtr[oa]\.|Lic\.|Ing\.)\s*/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
