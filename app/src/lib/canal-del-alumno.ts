/**
 * A qué canal pertenece una persona según lo que realmente tiene.
 *
 * Se usa para dos cosas: decidir a dónde cae al iniciar sesión, y evitar
 * que entre a la zona de un canal donde no contrató nada.
 */

import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import {
  accessCodes,
  courseCategories,
  courseEnrollments,
  courses,
  studentExpedientes,
} from "@/db/schema";
import { CHANNEL_IDS, type ChannelId } from "./channels";
import { tieneAreaAlumno } from "./area-alumno";

export type PertenenciaCanal = Record<ChannelId, number>;

/**
 * Cuenta cuánto contenido tiene la persona en cada canal.
 * Cero significa que ese canal no le corresponde.
 */
export async function contenidoPorCanal(userId: string): Promise<PertenenciaCanal> {
  const db = getDb();
  const conteo = Object.fromEntries(CHANNEL_IDS.map((c) => [c, 0])) as PertenenciaCanal;

  const [inscripciones, expedientes, codigos] = await Promise.all([
    // Cursos: el canal viene de la escuela a la que pertenece el curso
    db
      .select({ canal: courseCategories.channelId, total: sql<number>`count(*)` })
      .from(courseEnrollments)
      .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
      .leftJoin(courseCategories, eq(courses.categoryId, courseCategories.id))
      .where(eq(courseEnrollments.userId, userId))
      .groupBy(courseCategories.channelId),

    // Expediente de certificación → siempre CEDUCT
    db
      .select({ total: sql<number>`count(*)` })
      .from(studentExpedientes)
      .where(eq(studentExpedientes.userId, userId)),

    // Códigos de evaluación emitidos a esta empresa → Psicología Aplicada
    db
      .select({ total: sql<number>`count(*)` })
      .from(accessCodes)
      .where(and(eq(accessCodes.clienteUserId, userId), eq(accessCodes.active, true))),
  ]);

  for (const fila of inscripciones) {
    const canal = (fila.canal ?? "ige") as ChannelId;
    if (canal in conteo) conteo[canal] += Number(fila.total ?? 0);
  }
  conteo.ceduct += Number(expedientes[0]?.total ?? 0);
  conteo.psicologia += Number(codigos[0]?.total ?? 0);

  return conteo;
}

/**
 * Canal al que debe entrar la persona.
 *
 * Se respeta el canal desde el que llegó siempre que tenga algo ahí; si no,
 * se le manda al canal donde sí tiene contenido. Si no tiene nada en ningún
 * lado, devuelve null y se le muestra el catálogo público.
 */
export async function canalDeEntrada(
  userId: string,
  canalActual: ChannelId | null,
): Promise<ChannelId | null> {
  const conteo = await contenidoPorCanal(userId);

  if (canalActual && tieneAreaAlumno(canalActual) && conteo[canalActual] > 0) {
    return canalActual;
  }

  const conContenido = CHANNEL_IDS.filter((c) => tieneAreaAlumno(c) && conteo[c] > 0).sort(
    (a, b) => conteo[b] - conteo[a],
  );

  return conContenido[0] ?? null;
}
