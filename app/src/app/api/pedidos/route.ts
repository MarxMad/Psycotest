import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/index";
import { courseCategories, coupons, courses, orderItems, orders, users } from "@/db/schema";
import { getSessionUser, logAudit } from "@/lib/auth";
import { crearSesionDePago, origenDe } from "@/lib/pagos";
import { isStripeConfigured } from "@/lib/stripe";

/**
 * Registra una inscripción a uno o más diplomados y abre el pago.
 *
 * El pedido queda en la base con estado `pending` y Martín lo ve en
 * Pagos → Transacciones. Si hay Stripe configurado y todos los diplomados
 * tienen precio publicado, se devuelve además la URL de pago. Cuando alguno
 * va con precio «Consultar», o Stripe no está puesto, el pedido se queda
 * registrado y se cierra por contacto, como hasta ahora.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    slugs?: string[];
    nombre?: string;
    email?: string;
    telefono?: string;
    notas?: string;
    /** Código de cupón; se valida aquí, nunca se confía en el navegador. */
    cupon?: string | null;
    /** tarjeta (Stripe) · transferencia · oxxo. Por defecto, tarjeta. */
    metodoPago?: string;
    factura?: { rfc?: string; razonSocial?: string; cp?: string | null } | null;
  };

  const metodoPago = (["tarjeta", "transferencia", "oxxo"] as const).find((m) => m === body.metodoPago) ?? "tarjeta";
  const factura = body.factura
    ? {
        rfc: String(body.factura.rfc ?? "").trim().toUpperCase().slice(0, 13),
        razonSocial: String(body.factura.razonSocial ?? "").trim().slice(0, 200),
        cp: body.factura.cp ? String(body.factura.cp).trim().slice(0, 5) : null,
      }
    : null;

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

    // Cupón: mismas reglas que /api/coupons/validate. Uno inválido no tumba
    // el pedido; simplemente no descuenta.
    let descuento = 0;
    let cuponAplicado: string | null = null;
    const codigo = body.cupon?.trim().toUpperCase();
    if (codigo && subtotal > 0) {
      const [cupon] = await db.select().from(coupons).where(eq(coupons.code, codigo)).limit(1);
      const vigente =
        cupon &&
        cupon.active &&
        (!cupon.expiresAt || new Date(cupon.expiresAt) >= new Date()) &&
        (!cupon.maxUses || cupon.currentUses < cupon.maxUses);
      if (vigente) {
        descuento =
          cupon.type === "percentage"
            ? Math.round((subtotal * Math.min(100, Math.max(0, cupon.value))) / 100)
            : Math.max(0, cupon.value);
        descuento = Math.min(descuento, subtotal);
        cuponAplicado = cupon.code;
      }
    }
    const total = subtotal - descuento;

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
            rol: "cliente",
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
      discount: descuento,
      total,
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
      total,
      cupon: cuponAplicado,
      metodoPago,
      factura,
      telefono: body.telefono?.trim() || null,
      notas: body.notas?.trim() || null,
    });

    // El pago solo se abre si hay precio que cobrar; lo demás se acuerda
    // por contacto y el pedido se queda pendiente para eso.
    let pagoUrl: string | null = null;
    // Transferencia y OXXO se concilian a mano desde el panel.
    if (metodoPago === "tarjeta" && isStripeConfigured() && total > 0) {
      const sesion = await crearSesionDePago({
        pedidoId,
        origen: origenDe(request),
        email,
        cancelarEn: "/checkout",
      });
      if (sesion.ok) {
        pagoUrl = sesion.url;
      } else {
        // Que falle el pago no debe perder la inscripción: ya está registrada.
        console.error("[api/pedidos] no se pudo abrir el pago:", sesion.error);
      }
    }

    return NextResponse.json(
      {
        pedidoId,
        subtotal,
        descuento,
        total,
        cupon: cuponAplicado,
        metodoPago,
        pagoUrl,
        diplomados: elegidos.map((c) => c.titulo),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[api/pedidos]", error);
    return NextResponse.json({ error: "No se pudo registrar la inscripción." }, { status: 500 });
  }
}
