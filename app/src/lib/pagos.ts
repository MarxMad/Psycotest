import type Stripe from "stripe";
import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { courseCategories, courseEnrollments, courses, orderItems, orders } from "@/db/schema";
import { logAudit } from "@/lib/auth";
import { activateEnrollment } from "@/lib/course-access";
import { stripe } from "@/lib/stripe";

/**
 * Cobro de cursos y diplomados.
 *
 * Todo pasa por la misma pieza: un pedido (`orders` + `order_items`) es la
 * unidad que se cobra y que se cumple. Da igual que venga del carrito de
 * CEDUCT o del botón de un curso del consultorio; así solo hay un sitio donde
 * se concede el acceso y un sitio donde puede fallar.
 */

/** Etiqueta para comparar flujos de cobro en el panel de Stripe. */
const ETIQUETA_FLUJO = "psycotest-vqhtzmrk";

export type Resultado =
  | { ok: true; url: string }
  | { ok: false; error: string; status: number };

/** Origen absoluto para las URLs de vuelta de Stripe. */
export function origenDe(request: Request): string {
  const cabecera = request.headers.get("origin");
  if (cabecera) return cabecera.replace(/\/$/, "");
  try {
    return new URL(request.url).origin;
  } catch {
    return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  }
}

/**
 * Crea el pedido de un curso suelto del consultorio.
 *
 * Devuelve el pedido pendiente que ya existía si lo hay, para que recargar la
 * página o volver atrás no deje una ristra de pedidos huérfanos.
 */
export async function crearPedidoDeCurso(
  userId: string,
  courseSlug: string,
): Promise<{ ok: true; pedidoId: string; total: number } | { ok: false; error: string; status: number }> {
  const db = getDb();

  const [curso] = await db
    .select({ id: courses.id, titulo: courses.title, precio: courses.priceMxn })
    .from(courses)
    .where(and(eq(courses.slug, courseSlug), eq(courses.status, "published")))
    .limit(1);

  if (!curso) return { ok: false, error: "Ese curso no está disponible.", status: 404 };
  if (curso.precio <= 0) {
    return { ok: false, error: "Ese curso no tiene precio publicado.", status: 409 };
  }

  const [inscrito] = await db
    .select({ id: courseEnrollments.id })
    .from(courseEnrollments)
    .where(
      and(
        eq(courseEnrollments.userId, userId),
        eq(courseEnrollments.courseId, curso.id),
        eq(courseEnrollments.status, "active"),
      ),
    )
    .limit(1);
  if (inscrito) return { ok: false, error: "Ya estás inscrito en este curso.", status: 409 };

  // ¿Hay un pedido pendiente con exactamente este curso? Se reutiliza.
  const pendientes = await db
    .select({ id: orders.id, total: orders.total })
    .from(orders)
    .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
    .where(
      and(
        eq(orders.userId, userId),
        eq(orders.status, "pending"),
        eq(orderItems.courseId, curso.id),
      ),
    )
    .limit(1);
  if (pendientes[0]) {
    return { ok: true, pedidoId: pendientes[0].id, total: pendientes[0].total };
  }

  const ahora = new Date().toISOString();
  const pedidoId = `ord-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

  await db.insert(orders).values({
    id: pedidoId,
    userId,
    subtotal: curso.precio,
    discount: 0,
    total: curso.precio,
    status: "pending",
    createdAt: ahora,
  });
  await db.insert(orderItems).values({
    id: `itm-${pedidoId}-0`,
    orderId: pedidoId,
    courseId: curso.id,
    price: curso.precio,
    createdAt: ahora,
  });

  return { ok: true, pedidoId, total: curso.precio };
}

/** Abre la sesión de pago de un pedido ya existente. */
export async function crearSesionDePago(opciones: {
  pedidoId: string;
  origen: string;
  email?: string | null;
  cancelarEn?: string;
}): Promise<Resultado> {
  if (!stripe) {
    return { ok: false, error: "El cobro con tarjeta no está configurado.", status: 503 };
  }

  const db = getDb();
  const [pedido] = await db.select().from(orders).where(eq(orders.id, opciones.pedidoId)).limit(1);
  if (!pedido) return { ok: false, error: "Pedido no encontrado.", status: 404 };
  if (pedido.status === "completed") {
    return { ok: false, error: "Ese pedido ya está pagado.", status: 409 };
  }
  if (pedido.status !== "pending") {
    return { ok: false, error: "Ese pedido ya no se puede pagar.", status: 409 };
  }

  const lineas = await db
    .select({ titulo: courses.title, precio: orderItems.price })
    .from(orderItems)
    .innerJoin(courses, eq(orderItems.courseId, courses.id))
    .where(eq(orderItems.orderId, pedido.id));

  if (lineas.length === 0) {
    return { ok: false, error: "El pedido no tiene programas.", status: 400 };
  }
  // Stripe no cobra importes de cero. Un diplomado con precio «Consultar» se
  // cierra por contacto, no aquí.
  if (lineas.some((l) => l.precio <= 0)) {
    return {
      ok: false,
      error: "Hay programas sin precio publicado. Te contactamos para cerrarlo.",
      status: 409,
    };
  }

  const suma = lineas.reduce((n, l) => n + l.precio, 0);
  // El desglose solo se manda si cuadra con el total del pedido; si hay un
  // descuento aplicado, se cobra el total y no la suma de las partes.
  const conceptos =
    suma === pedido.total
      ? lineas.map((l) => ({
          quantity: 1,
          price_data: {
            currency: "mxn",
            unit_amount: l.precio,
            product_data: { name: l.titulo },
          },
        }))
      : [
          {
            quantity: 1,
            price_data: {
              currency: "mxn",
              unit_amount: pedido.total,
              product_data: {
                name: `Inscripción · ${lineas.length} programa${lineas.length === 1 ? "" : "s"}`,
                description: lineas.map((l) => l.titulo).join(", ").slice(0, 500),
              },
            },
          },
        ];

  try {
    const sesion = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: conceptos,
      client_reference_id: pedido.id,
      metadata: { pedidoId: pedido.id },
      payment_intent_data: { metadata: { pedidoId: pedido.id } },
      customer_email: opciones.email || undefined,
      locale: "es",
      success_url: `${opciones.origen}/gracias?pedido=${pedido.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${opciones.origen}${opciones.cancelarEn ?? "/carrito"}`,
      integration_identifier: ETIQUETA_FLUJO,
    });

    if (!sesion.url) {
      return { ok: false, error: "Stripe no devolvió una URL de pago.", status: 502 };
    }
    return { ok: true, url: sesion.url };
  } catch (error) {
    console.error("[pagos] crearSesionDePago:", error);
    return { ok: false, error: "No se pudo abrir el pago.", status: 502 };
  }
}

/**
 * Concede lo comprado.
 *
 * Se llama desde el webhook, nunca desde la página de vuelta: quien paga y
 * pierde la conexión antes de que cargue esa página también tiene que recibir
 * su acceso. Es idempotente porque Stripe reintenta los eventos.
 */
export async function cumplirPedido(sesion: Stripe.Checkout.Session): Promise<void> {
  const pedidoId = sesion.metadata?.pedidoId || sesion.client_reference_id;
  if (!pedidoId) {
    console.error("[pagos] sesión sin pedido:", sesion.id);
    return;
  }

  const db = getDb();
  const [pedido] = await db.select().from(orders).where(eq(orders.id, pedidoId)).limit(1);
  if (!pedido) {
    console.error("[pagos] pedido inexistente:", pedidoId);
    return;
  }
  if (pedido.status === "completed") return;

  const pagoId =
    typeof sesion.payment_intent === "string"
      ? sesion.payment_intent
      : sesion.payment_intent?.id ?? null;
  const ahora = new Date().toISOString();

  await db
    .update(orders)
    .set({ status: "completed", completedAt: ahora, stripePaymentIntentId: pagoId })
    .where(eq(orders.id, pedido.id));

  const items = await db
    .select({ courseId: orderItems.courseId })
    .from(orderItems)
    .where(eq(orderItems.orderId, pedido.id));

  for (const item of items) {
    await activateEnrollment({
      userId: pedido.userId,
      courseId: item.courseId,
      stripeSessionId: sesion.id,
      stripePaymentIntentId: pagoId,
    });
  }

  await logAudit(pedido.userId, "update", "order", pedido.id, {
    via: "stripe",
    total: pedido.total,
    programas: items.length,
  });
}

/** El pago falló o la sesión caducó: el pedido deja de estar pendiente. */
export async function cancelarPedido(sesion: Stripe.Checkout.Session): Promise<void> {
  const pedidoId = sesion.metadata?.pedidoId || sesion.client_reference_id;
  if (!pedidoId) return;
  const db = getDb();
  await db
    .update(orders)
    .set({ status: "cancelled" })
    .where(and(eq(orders.id, pedidoId), eq(orders.status, "pending")));
}

/** Diplomados de CEDUCT publicados, por slug. El precio sale de la base. */
export async function diplomadosPorSlug(slugs: string[]) {
  const db = getDb();
  return db
    .select({ id: courses.id, titulo: courses.title, precio: courses.priceMxn })
    .from(courses)
    .leftJoin(courseCategories, eq(courses.categoryId, courseCategories.id))
    .where(
      and(
        inArray(courses.slug, slugs),
        eq(courses.status, "published"),
        eq(courseCategories.channelId, "ceduct"),
      ),
    );
}
