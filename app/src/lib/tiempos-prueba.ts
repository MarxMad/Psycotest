/**
 * Cuándo empezó, cuándo terminó y cuánto tardó una persona en contestar.
 *
 * Las horas se muestran en la hora del centro de México: el servidor corre
 * en UTC y quien lee el informe está aquí.
 */

const ZONA = "America/Mexico_City";

export function fechaHora(iso: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: ZONA,
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

/** «1 h 03 min 05 s», «47 min 12 s» o «38 s». Null si las fechas no cuadran. */
export function duracion(inicio: string, fin: string): string | null {
  const ms = new Date(fin).getTime() - new Date(inicio).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const total = Math.round(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const dos = (n: number) => String(n).padStart(2, "0");
  if (h > 0) return `${h} h ${dos(m)} min ${dos(s)} s`;
  if (m > 0) return `${m} min ${dos(s)} s`;
  return `${s} s`;
}

export type Tiempos = { inicio: string; fin: string; duracion: string | null };

export function tiemposDe(inicio: string, fin: string | null | undefined): Tiempos | null {
  if (!fin) return null;
  return { inicio: fechaHora(inicio), fin: fechaHora(fin), duracion: duracion(inicio, fin) };
}
