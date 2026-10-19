import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import { courses, orderItems, orders } from "@/db/schema";
import { requireUser } from "@/lib/auth";

/** Reporte de ventas: ingreso por mes, por curso y uso de cupones. */
export async function GET() {
  try {
    await requireUser(["admin", "psicologo"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const db = getDb();

    const [porMes, porCurso, resumen] = await Promise.all([
      // substr(createdAt, 1, 7) → "YYYY-MM"; las fechas se guardan en ISO
      db
        .select({
          mes: sql<string>`substr(${orders.createdAt}, 1, 7)`.as("mes"),
          ordenes: sql<number>`count(*)`,
          ingreso: sql<number>`coalesce(sum(${orders.total}), 0)`,
          descuento: sql<number>`coalesce(sum(${orders.discount}), 0)`,
        })
        .from(orders)
        .where(eq(orders.status, "completed"))
        .groupBy(sql`substr(${orders.createdAt}, 1, 7)`)
        .orderBy(desc(sql`substr(${orders.createdAt}, 1, 7)`))
        .limit(12),

      db
        .select({
          cursoId: orderItems.courseId,
          titulo: courses.title,
          ventas: sql<number>`count(*)`,
          ingreso: sql<number>`coalesce(sum(${orderItems.price}), 0)`,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .leftJoin(courses, eq(orderItems.courseId, courses.id))
        .where(eq(orders.status, "completed"))
        .groupBy(orderItems.courseId, courses.title)
        .orderBy(desc(sql`coalesce(sum(${orderItems.price}), 0)`))
        .limit(20),

      db
        .select({
          ordenes: sql<number>`count(*)`,
          ingreso: sql<number>`coalesce(sum(${orders.total}), 0)`,
          descuento: sql<number>`coalesce(sum(${orders.discount}), 0)`,
          ticket: sql<number>`coalesce(avg(${orders.total}), 0)`,
        })
        .from(orders)
        .where(eq(orders.status, "completed")),
    ]);

    const n = (v: unknown) => Number(v ?? 0);

    return NextResponse.json({
      resumen: {
        ordenes: n(resumen[0]?.ordenes),
        ingreso: n(resumen[0]?.ingreso),
        descuento: n(resumen[0]?.descuento),
        ticket: Math.round(n(resumen[0]?.ticket)),
      },
      porMes: porMes.map((r) => ({
        mes: r.mes,
        ordenes: n(r.ordenes),
        ingreso: n(r.ingreso),
        descuento: n(r.descuento),
      })),
      porCurso: porCurso.map((r) => ({
        cursoId: r.cursoId,
        titulo: r.titulo ?? "Curso eliminado",
        ventas: n(r.ventas),
        ingreso: n(r.ingreso),
      })),
    });
  } catch (error) {
    console.error("[admin/reportes]", error);
    return NextResponse.json({ error: "Error al generar el reporte" }, { status: 500 });
  }
}
