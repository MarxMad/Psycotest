import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import {
  courseEnrollments,
  courses,
  liveClassAttendances,
  liveClasses,
  users,
  type LiveClass,
} from "@/db/schema";
import type { AuthUser } from "@/lib/auth";
import { salaDeClase } from "@/lib/livekit";
import { yaTermino } from "@/lib/clase-horario";

const JOIN_EARLY_MS = 15 * 60 * 1000;

/**
 * Referencia de la sala que se guarda en la clase. La sala de verdad vive en
 * LiveKit y se abre con un pase firmado; esto solo deja constancia de cuál es.
 */
export function referenciaDeSala(liveClassId: string): string {
  return `livekit:${salaDeClase(liveClassId)}`;
}

export function isWithinJoinWindow(liveClass: LiveClass, now = Date.now()): boolean {
  if (liveClass.status === "cancelled" || liveClass.status === "completed") return false;
  if (liveClass.status === "live") return true;
  const start = new Date(liveClass.scheduledAt).getTime();
  if (Number.isNaN(start)) return false;
  const end = start + (liveClass.durationMinutes || 60) * 60 * 1000;
  return now >= start - JOIN_EARLY_MS && now <= end;
}

/**
 * Una clase en vivo que nadie terminó se quedaba «En vivo» para siempre. Al
 * leer las clases, las que ya pasaron su hora (más el margen) se completan.
 */
export async function cerrarClasesVencidas(): Promise<void> {
  const db = getDb();
  const enVivo = await db.select().from(liveClasses).where(eq(liveClasses.status, "live"));
  const vencidas = enVivo.filter((c) => yaTermino(c)).map((c) => c.id);
  if (vencidas.length === 0) return;
  await db
    .update(liveClasses)
    .set({ status: "completed" })
    .where(inArray(liveClasses.id, vencidas));
}

export function canTransitionStatus(
  from: LiveClass["status"],
  to: LiveClass["status"],
): boolean {
  if (from === to) return true;
  if (from === "scheduled" && (to === "live" || to === "cancelled")) return true;
  if (from === "live" && (to === "completed" || to === "cancelled")) return true;
  return false;
}

/** Cursos que tiene asignados un profesor (es su instructor). */
export async function cursosDelProfesor(userId: string): Promise<string[]> {
  const filas = await getDb()
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.instructorId, userId));
  return filas.map((f) => f.id);
}

/**
 * ¿Lleva esta persona la clase? El admin, todas; el profesor, las de los
 * cursos que tiene asignados. Quien la lleva abre la sala fuera de horario,
 * la arranca, la edita y maneja pizarra, salas y dinámicas.
 */
export async function dirigeLaClase(
  user: AuthUser,
  liveClass: Pick<LiveClass, "courseId">,
): Promise<boolean> {
  if (user.rol === "admin") return true;
  if (user.rol !== "profesor" || !liveClass.courseId) return false;
  return (await cursosDelProfesor(user.id)).includes(liveClass.courseId);
}

export async function userCanAccessLiveClass(
  user: AuthUser,
  liveClass: LiveClass,
): Promise<boolean> {
  if (await dirigeLaClase(user, liveClass)) return true;
  if (!liveClass.courseId) return false;

  const db = getDb();
  const [enrollment] = await db
    .select({ id: courseEnrollments.id })
    .from(courseEnrollments)
    .where(
      and(
        eq(courseEnrollments.userId, user.id),
        eq(courseEnrollments.courseId, liveClass.courseId),
        inArray(courseEnrollments.status, ["active", "completed"]),
      ),
    )
    .limit(1);

  return Boolean(enrollment);
}

/** Las clases que ve en el panel quien las lleva. */
export async function listLiveClassesForHost(user: AuthUser): Promise<LiveClass[]> {
  const db = getDb();
  await cerrarClasesVencidas();
  if (user.rol === "admin") return db.select().from(liveClasses);
  if (user.rol !== "profesor") return [];
  const propios = await cursosDelProfesor(user.id);
  if (propios.length === 0) return [];
  return db.select().from(liveClasses).where(inArray(liveClasses.courseId, propios));
}

export async function listLiveClassesForUser(userId: string): Promise<LiveClass[]> {
  const db = getDb();
  await cerrarClasesVencidas();
  const enrollments = await db
    .select({ courseId: courseEnrollments.courseId })
    .from(courseEnrollments)
    .where(
      and(
        eq(courseEnrollments.userId, userId),
        inArray(courseEnrollments.status, ["active", "completed"]),
      ),
    );

  const courseIds = [...new Set(enrollments.map((e) => e.courseId))];
  if (courseIds.length === 0) return [];

  const classes = await db.select().from(liveClasses);
  return classes
    .filter((c) => c.courseId && courseIds.includes(c.courseId) && c.status !== "cancelled")
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
}

/**
 * Asistencia: una sola fila por persona y clase.
 *
 * Reconectarse, recargar o pasar a una sala de división reabre la misma fila
 * en vez de crear otra; así el tiempo conectado y el porcentaje de presencia
 * para CONOCER se acumulan en un solo lugar. `joinedAt` es la primera entrada,
 * `leftAt` la última salida y `durationSeconds` el lapso entre ambas; el
 * tiempo efectivamente conectado lo lleva `connectedSeconds`.
 */
async function filaDeAsistencia(liveClassId: string, userId: string) {
  const rows = await getDb()
    .select()
    .from(liveClassAttendances)
    .where(
      and(
        eq(liveClassAttendances.liveClassId, liveClassId),
        eq(liveClassAttendances.userId, userId),
      ),
    );
  // Filas viejas, de antes de unificar: manda la abierta, si no la primera.
  return rows.find((r) => !r.leftAt) ?? rows.sort((x, y) => x.joinedAt.localeCompare(y.joinedAt))[0];
}

async function leerAsistencia(id: string) {
  const [row] = await getDb()
    .select()
    .from(liveClassAttendances)
    .where(eq(liveClassAttendances.id, id));
  return row;
}

export async function recordJoin(liveClassId: string, userId: string) {
  const db = getDb();
  const now = new Date().toISOString();
  const fila = await filaDeAsistencia(liveClassId, userId);

  if (fila && !fila.leftAt) return fila;

  if (fila) {
    // Vuelve a entrar: se reabre. El latido arranca de cero para no regalarle
    // el tiempo que estuvo fuera.
    await db
      .update(liveClassAttendances)
      .set({ leftAt: null, lastHeartbeatAt: now })
      .where(eq(liveClassAttendances.id, fila.id));
    return leerAsistencia(fila.id);
  }

  const id = `attendance_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  await db.insert(liveClassAttendances).values({
    id,
    liveClassId,
    userId,
    joinedAt: now,
    leftAt: null,
    durationSeconds: null,
    connectedSeconds: 0,
    presencePercent: 0,
    lastHeartbeatAt: now,
  });
  return leerAsistencia(id);
}

export async function recordLeave(liveClassId: string, userId: string) {
  const fila = await filaDeAsistencia(liveClassId, userId);
  if (!fila || fila.leftAt) return fila ?? null;

  const leftAt = new Date();
  const durationSeconds = Math.max(
    0,
    Math.round((leftAt.getTime() - new Date(fila.joinedAt).getTime()) / 1000),
  );
  await getDb()
    .update(liveClassAttendances)
    .set({ leftAt: leftAt.toISOString(), durationSeconds })
    .where(eq(liveClassAttendances.id, fila.id));
  return leerAsistencia(fila.id);
}

export async function listAttendances(liveClassId: string) {
  const db = getDb();
  return db
    .select({
      id: liveClassAttendances.id,
      liveClassId: liveClassAttendances.liveClassId,
      userId: liveClassAttendances.userId,
      joinedAt: liveClassAttendances.joinedAt,
      leftAt: liveClassAttendances.leftAt,
      durationSeconds: liveClassAttendances.durationSeconds,
      connectedSeconds: liveClassAttendances.connectedSeconds,
      presencePercent: liveClassAttendances.presencePercent,
      lastHeartbeatAt: liveClassAttendances.lastHeartbeatAt,
      nombre: users.nombre,
      email: users.email,
    })
    .from(liveClassAttendances)
    .leftJoin(users, eq(users.id, liveClassAttendances.userId))
    .where(eq(liveClassAttendances.liveClassId, liveClassId));
}

export function authErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message === "FORBIDDEN") {
    return { error: "Sin permiso", status: 403 as const };
  }
  return { error: "No autorizado", status: 401 as const };
}
