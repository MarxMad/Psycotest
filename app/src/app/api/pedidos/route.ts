import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/index";
import { courseCategories, courses, orderItems, orders, users } from "@/db/schema";
import { getSessionUser, logAudit } from "@/lib/auth";

/**
 * Registra una inscripción a uno o más diplomados.
 *
 * El pedido queda en la base con estado `pending` y Martín lo ve en
 * Pagos → Transacciones. El cobro con tarjeta se conecta después; hasta
 * entonces se acuerda el pago por los medios de contacto.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    slugs?: string[];
    nombre?: string;
    email?: string;
    telefono?: string;
    notas?: string;
  };

  const slugs = (body.slugs ?? []).filter((s) => typeof s === "string").slice(0, 20);
  const nombre = body.nombre?.trim();
  const email = body.email?.trim().toLowerCase();

  if (slugs.length === 0) {
    return NextResponse.json({ error: "No hay diplomados en la solicitud." }, { status: 400 });
  }
  if (!nombre || !email) {
    return NextResponse.json({ error: "Falta tu nombre o tu correo." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Ese correo no parece válido." }, { status: 400 });
  }

  try {
    const db = getDb();

    // El precio se toma de la base, nunca de lo que mande el navegador.
    const elegidos = await db
      .select({
        id: courses.id,
        titulo: courses.title,
        precio: courses.priceMxn,
      })
      .from(courses)
      .leftJoin(courseCategories, eq(courses.categoryId, courseCategories.id))
      .where(
        and(
          inArray(courses.slug, slugs),
          eq(courses.status, "published"),
          eq(courseCategories.channelId, "ceduct"),
        ),
      );

    if (elegidos.length === 0) {
      return NextResponse.json({ error: "Los diplomados ya no están disponibles." }, { status: 409 });
    }

    const subtotal = elegidos.reduce((suma, c) => suma + c.precio, 0);
    const ahora = new Date().toISOString();

    // Si hay sesión se liga al usuario; si no, se registra a nombre del correo.
    const sesion = await getSessionUser();
    let userId = sesion?.id ?? null;
    if (!userId) {
      const [existente] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      if (existente) {
        userId = existente.id;
      } else {
        userId = `usr-sol-${Date.now().toString(36)}`;
        await db
          .insert(users)
          .values({
            id: userId,
            email,
            nombre,
            passwordHash: "",
            rol: "aplicador",
            emailVerified: false,
            createdAt: ahora,
          })
          .onConflictDoNothing();
      }
    }

    const pedidoId = `ord-${Date.now().toString(36)}`;
    await db.insert(orders).values({
      id: pedidoId,
      userId,
      subtotal,
      discount: 0,
      total: subtotal,
      status: "pending",
      createdAt: ahora,
    });

    await db.insert(orderItems).values(
      elegidos.map((c, i) => ({
        id: `itm-${pedidoId}-${i}`,
        orderId: pedidoId,
        courseId: c.id,
        price: c.precio,
        createdAt: ahora,
      })),
    );

    await logAudit(userId, "create", "order", pedidoId, {
      diplomados: elegidos.map((c) => c.titulo),
      total: subtotal,
      telefono: body.telefono?.trim() || null,
      notas: body.notas?.trim() || null,
    });

    return NextResponse.json(
      { pedidoId, total: subtotal, diplomados: elegidos.map((c) => c.titulo) },
      { status: 201 },
    );
  } catch (error) {
    console.error("[api/pedidos]", error);
    return NextResponse.json({ error: "No se pudo registrar la inscripción." }, { status: 500 });
  }
}
