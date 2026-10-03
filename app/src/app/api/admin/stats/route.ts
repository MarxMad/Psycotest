import { NextResponse } from "next/server";
import { and, count, desc, eq, gte, sum } from "drizzle-orm";
import { getDb } from "@/db/index";
import {
  assessmentSessions,
  auditLog,
  courseEnrollments,
  courses,
  liveClasses,
  orders,
  users,
} from "@/db/schema";
import { requireUser } from "@/lib/auth";

/** Primer día del mes en curso, en ISO. */
function inicioDeMes(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

/** Rango [inicio, fin) del día de hoy, en ISO. */
function hoy(): { desde: string; hasta: string } {
  const d = new Date();
  const desde = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const hasta = new Date(desde);
  hasta.setDate(hasta.getDate() + 1);
  return { desde: desde.toISOString(), hasta: hasta.toISOString() };
}

const n = (v: unknown) => Number(v ?? 0);

export async function GET() {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const db = getDb();
    const { desde, hasta } = hoy();

    const [
      pruebasTotal,
      pruebasPendientes,
      cursosPublicados,
      estudiantes,
      clasesProgramadas,
      clasesHoy,
      ingresosMes,
      ingresosTotal,
      usuariosTotal,
      actividad,
    ] = await Promise.all([
      db.select({ v: count() }).from(assessmentSessions),
      db
        .select({ v: count() })
        .from(assessmentSessions)
        .where(eq(assessmentSessions.aprobada, false)),
      db.select({ v: count() }).from(courses).where(eq(courses.status, "published")),
      db.select({ v: count() }).from(courseEnrollments),
      db.select({ v: count() }).from(liveClasses).where(eq(liveClasses.status, "scheduled")),
      db
        .select({ v: count() })
        .from(liveClasses)
        .where(and(gte(liveClasses.scheduledAt, desde), eq(liveClasses.status, "scheduled"))),
      db
        .select({ v: sum(orders.total) })
        .from(orders)
        .where(and(eq(orders.status, "completed"), gte(orders.createdAt, inicioDeMes()))),
      db.select({ v: sum(orders.total) }).from(orders).where(eq(orders.status, "completed")),
      db.select({ v: count() }).from(users),
      db
        .select({
          id: auditLog.id,
          action: auditLog.action,
          entity: auditLog.entity,
          entityId: auditLog.entityId,
          createdAt: auditLog.createdAt,
          userNombre: users.nombre,
        })
        .from(auditLog)
        .leftJoin(users, eq(auditLog.userId, users.id))
        .orderBy(desc(auditLog.createdAt))
        .limit(12),
    ]);

    // clasesHoy cuenta desde el inicio del día; se acota al día actual
    const hoyReal = clasesHoy[0] ? n(clasesHoy[0].v) : 0;
    const programadas = n(clasesProgramadas[0]?.v);

    return NextResponse.json({
      stats: {
        pruebas: { total: n(pruebasTotal[0]?.v), pendientes: n(pruebasPendientes[0]?.v) },
        cursos: { total: n(cursosPublicados[0]?.v), estudiantes: n(estudiantes[0]?.v) },
        clasesVivo: { programadas, hoy: Math.min(hoyReal, programadas) },
        ingresos: { mes: n(ingresosMes[0]?.v), total: n(ingresosTotal[0]?.v) },
        usuarios: { total: n(usuariosTotal[0]?.v) },
      },
      actividad,
      hastaHoy: hasta,
    });
  } catch (error) {
    console.error("[admin/stats]", error);
    return NextResponse.json({ error: "Error al cargar estadísticas" }, { status: 500 });
  }
}
