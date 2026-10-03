import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db/index";
import { coupons, courses, orderItems, orders, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";

/** Órdenes de compra con comprador, cupón y cursos incluidos. */
export async function GET(request: Request) {
  try {
    await requireUser(["admin", "psicologo"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const db = getDb();
    const estado = new URL(request.url).searchParams.get("status");

    const base = db
      .select({
        id: orders.id,
        total: orders.total,
        subtotal: orders.subtotal,
        discount: orders.discount,
        status: orders.status,
        stripePaymentIntentId: orders.stripePaymentIntentId,
        createdAt: orders.createdAt,
        completedAt: orders.completedAt,
        compradorNombre: users.nombre,
        compradorEmail: users.email,
        cuponCodigo: coupons.code,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .leftJoin(coupons, eq(orders.couponId, coupons.id))
      .orderBy(desc(orders.createdAt));

    const filas =
      estado && ["pending", "completed", "cancelled", "refunded"].includes(estado)
        ? await base.where(eq(orders.status, estado as "pending"))
        : await base;

    // Cursos de cada orden, en una sola consulta
    const items = await db
      .select({
        orderId: orderItems.orderId,
        price: orderItems.price,
        cursoTitulo: courses.title,
      })
      .from(orderItems)
      .leftJoin(courses, eq(orderItems.courseId, courses.id));

    const porOrden = new Map<string, { cursoTitulo: string | null; price: number }[]>();
    for (const it of items) {
      const lista = porOrden.get(it.orderId) ?? [];
      lista.push({ cursoTitulo: it.cursoTitulo, price: it.price });
      porOrden.set(it.orderId, lista);
    }

    return NextResponse.json({
      orders: filas.map((o) => ({ ...o, items: porOrden.get(o.id) ?? [] })),
    });
  } catch (error) {
    console.error("[api/orders]", error);
    return NextResponse.json({ error: "Error al cargar las órdenes" }, { status: 500 });
  }
}
