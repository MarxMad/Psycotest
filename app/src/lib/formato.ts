/** Formatos de presentación compartidos por el panel. */

/** Centavos → "$1,234" en pesos mexicanos. */
export function mxn(centavos: number, decimales = 0): string {
  return (centavos / 100).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}

/** ISO → "03 oct 2026"; null → "—". */
export function fechaCorta(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** ISO → "03 oct 2026, 14:30". */
export function fechaHora(iso: string): string {
  return new Date(iso).toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** ISO → "hace 5 min" / "ayer" / "hace 3 días". */
export function haceCuanto(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "hace un momento";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "ayer" : `hace ${d} días`;
}
