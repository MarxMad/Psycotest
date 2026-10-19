/**
 * Formatos y etiquetas de diplomados.
 *
 * Aparte de la capa de datos: el carrito y la inscripción corren en el
 * navegador, y al importar de un módulo que toca la base se arrastraba
 * código de servidor al cliente.
 */

export type Modalidad = "online" | "presencial" | "mixta";
export type Nivel = "basico" | "intermedio" | "avanzado";

export const MODALIDAD_LABEL: Record<Modalidad, string> = {
  online: "100% en línea",
  presencial: "Presencial",
  mixta: "Mixta",
};

export const NIVEL_LABEL: Record<Nivel, string> = {
  basico: "Básico",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

/** Minutos → horas. Los diplomados se miden en horas. */
export function enHoras(minutos: number): number {
  return Math.round(minutos / 60);
}

export function precioMxn(centavos: number): string {
  if (centavos <= 0) return "Consultar";
  return (centavos / 100).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  });
}

export type Diplomado = {
  id: string;
  slug: string;
  titulo: string;
  subtitulo: string | null;
  descripcion: string;
  precioMxn: number;
  imagen: string | null;
  instructor: string;
  nivel: Nivel;
  modalidad: Modalidad;
  estandarClave: string | null;
  horas: number;
  categoria: string | null;
  categoriaSlug: string | null;
  cupo: number | null;
  vendidos: number;
};
