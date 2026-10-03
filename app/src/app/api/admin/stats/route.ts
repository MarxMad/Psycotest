import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import { auditLog, users } from "@/db/schema";
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

    // Un solo viaje a la base: el pool es de una conexión en producción,
    // así que diez consultas en paralelo se encolan y agotan el tiempo límite.
    const [agregados] = await db.execute<{
      pruebas_total: number;
      pruebas_pendientes: number;
      cursos_publicados: number;
      estudiantes: number;
      clases_programadas: number;
      clases_hoy: number;
      ingresos_mes: number;
      ingresos_total: number;
      usuarios_total: number;
    }>(sql`
      select
        (select count(*) from assessment_sessions)                      as pruebas_total,
        (select count(*) from assessment_sessions where aprobada = false) as pruebas_pendientes,
        (select count(*) from courses where status = 'published')        as cursos_publicados,
        (select count(*) from course_enrollments)                        as estudiantes,
        (select count(*) from live_classes where status = 'scheduled')   as clases_programadas,
        (select count(*) from live_classes
          where status = 'scheduled'
            and scheduled_at >= ${desde} and scheduled_at < ${hasta})    as clases_hoy,
        (select coalesce(sum(total), 0) from orders
          where status = 'completed' and created_at >= ${inicioDeMes()}) as ingresos_mes,
        (select coalesce(sum(total), 0) from orders
          where status = 'completed')                                    as ingresos_total,
        (select count(*) from users)                                     as usuarios_total
    `);

    const actividad = await db
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
      .limit(12);

    const a = agregados;

    return NextResponse.json({
      stats: {
        pruebas: { total: n(a?.pruebas_total), pendientes: n(a?.pruebas_pendientes) },
        cursos: { total: n(a?.cursos_publicados), estudiantes: n(a?.estudiantes) },
        clasesVivo: { programadas: n(a?.clases_programadas), hoy: n(a?.clases_hoy) },
        ingresos: { mes: n(a?.ingresos_mes), total: n(a?.ingresos_total) },
        usuarios: { total: n(a?.usuarios_total) },
      },
      actividad,
    });
  } catch (error) {
    console.error("[admin/stats]", error);
    return NextResponse.json({ error: "Error al cargar estadísticas" }, { status: 500 });
  }
}
