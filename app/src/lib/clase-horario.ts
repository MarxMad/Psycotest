import type { LiveClass } from "@/db/schema";

/** Margen tras la hora de fin antes de dar por cerrada una clase olvidada. */
export const GRACIA_FIN_MS = 2 * 60 * 60 * 1000;

/** Fin programado de la clase, en ms; null si la fecha no se puede leer. */
export function finDeClase(liveClass: Pick<LiveClass, "scheduledAt" | "durationMinutes">): number | null {
  const start = new Date(liveClass.scheduledAt).getTime();
  if (Number.isNaN(start)) return null;
  return start + (liveClass.durationMinutes || 60) * 60 * 1000;
}

/** La clase ya pasó su hora de fin más el margen. */
export function yaTermino(
  liveClass: Pick<LiveClass, "scheduledAt" | "durationMinutes">,
  now = Date.now(),
): boolean {
  const fin = finDeClase(liveClass);
  return fin != null && now > fin + GRACIA_FIN_MS;
}

/** Programada, pero su horario ya pasó sin que nadie la abriera. */
export function sinRealizar(liveClass: Pick<LiveClass, "status" | "scheduledAt" | "durationMinutes">, now = Date.now()) {
  const fin = finDeClase(liveClass);
  return liveClass.status === "scheduled" && fin != null && now > fin;
}
