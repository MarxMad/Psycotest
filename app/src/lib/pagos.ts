import type Stripe from "stripe";
import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { courseCategories, courseEnrollments, coupons, courses, orderItems, orders, users } from "@/db/schema";
import { logAudit } from "@/lib/auth";
import { activateEnrollment } from "@/lib/course-access";
import { correoVentas, enviarCorreo, esMarca, pesos, plantilla, textoPlano, type Marca } from "@/lib/correo";
import { stripe } from "@/lib/stripe";

/**
 * Cobro de cursos y diplomados.
 *
 * Todo pasa por la misma pieza: un pedido (`orders` + `order_items`) es la
 * unidad que se cobra y que se cumple. Da igual que venga del carrito de
 * CEDUCT o del botón de un curso del catálogo; así solo hay un sitio donde
 * se concede el acceso y un sitio donde puede fallar.
 */

/** Etiqueta para comparar flujos de cobro en el panel de Stripe. */
export const ETIQUETA_FLUJO = "psycotest-vqhtzmrk";

/**
 * Opciones de pago comunes a todas las sesiones. Los métodos no se fijan aquí
 * (eso lo decide el panel de Stripe: tarjeta, OXXO, SPEI…); solo se ajusta
 * cómo se comporta cada uno si está activo.
 *
 * - OXXO: la ficha vence en 3 días.
 * - SPEI: transferencia a una CLABE que Stripe asigna al cliente y concilia
 *   sola. Necesita un cliente en Stripe, de ahí `customer_creation`.
 */
export const OPCIONES_DE_PAGO = {
  customer_creation: "always",
  payment_method_options: {
    oxxo: { expires_after_days: 3 },
    customer_balance: {
      funding_type: "bank_transfer",
      bank_transfer: { type: "mx_bank_transfer" },
    },
  },
} satisfies Partial<Stripe.Checkout.SessionCreateParams>;

/**
 * Usuario por correo: el de la sesión si lo hay, uno existente con ese correo,
 * o uno nuevo sin contraseña (entra después con «Entrar con mi correo»).
 */
export async function usuarioPorCorreo(opciones: {
  sesionId?: string | null;
  email: string;
  nombre: string;
}): Promise<string> {
  if (opciones.sesionId) return opciones.sesionId;
  const db = getDb();
  const [existente] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, opciones.email))
    .limit(1);
  if (existente) return existente.id;
  const id = `usr-sol-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  await db
    .insert(users)
    .values({
      id,
      email: opciones.email,
      nombre: opciones.nombre,
      passwordHash: "",
      rol: "cliente",
      emailVerified: false,
      createdAt: new Date().toISOString(),
    })
    .onConflictDoNothing();
  // Si otro pedido lo creó al mismo tiempo, se queda el que ganó.
  const [final] = await db.select({ id: users.id }).from(users).where(eq(users.email, opciones.email)).limit(1);
  return final?.id ?? id;
}

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
 * Crea el pedido de un curso suelto del catálogo.
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
      // `origen` sirve al webhook para armar los enlaces del correo.
      metadata: { tipo: "curso", pedidoId: pedido.id, origen: opciones.origen },
      payment_intent_data: { metadata: { tipo: "curso", pedidoId: pedido.id } },
      ...OPCIONES_DE_PAGO,
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
 * su acceso. Es idempotente porque Stripe reintenta los eventos: primero se
 * conceden las inscripciones (repetirlas no hace daño) y al final el pedido
 * se cierra con una sola escritura condicionada. Solo quien gana ese cierre
 * cuenta el cupón y manda el correo, así que dos avisos simultáneos no
 * duplican nada.
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

  const items = await db
    .select({
      courseId: orderItems.courseId,
      precio: orderItems.price,
      titulo: courses.title,
      canal: courseCategories.channelId,
    })
    .from(orderItems)
    .innerJoin(courses, eq(orderItems.courseId, courses.id))
    .leftJoin(courseCategories, eq(courses.categoryId, courseCategories.id))
    .where(eq(orderItems.orderId, pedido.id));

  for (const item of items) {
    await activateEnrollment({
      userId: pedido.userId,
      courseId: item.courseId,
      stripeSessionId: sesion.id,
      stripePaymentIntentId: pagoId,
    });
  }

  const cerrado = await db
    .update(orders)
    .set({ status: "completed", completedAt: new Date().toISOString(), stripePaymentIntentId: pagoId })
    .where(and(eq(orders.id, pedido.id), ne(orders.status, "completed")))
    .returning({ id: orders.id });
  if (cerrado.length === 0) return; // Otro aviso ya lo cerró.

  if (pedido.couponId) {
    await db
      .update(coupons)
      .set({ currentUses: sql`${coupons.currentUses} + 1` })
      .where(eq(coupons.id, pedido.couponId));
  }

  await logAudit(pedido.userId, "update", "order", pedido.id, {
    via: "stripe",
    total: pedido.total,
    programas: items.length,
    cupon: pedido.couponId,
  });

  await avisarCompraDeCursos({ sesion, pedido, items }).catch((e) =>
    console.error("[pagos] correo de confirmación:", e),
  );
}

/** Correo al alumno y aviso a ventas. Un fallo aquí no deshace el cobro. */
async function avisarCompraDeCursos({
  sesion,
  pedido,
  items,
}: {
  sesion: Stripe.Checkout.Session;
  pedido: typeof orders.$inferSelect;
  items: { titulo: string; precio: number; canal: string | null }[];
}) {
  const db = getDb();
  const [usuario] = await db
    .select({ email: users.email, nombre: users.nombre, sinClave: sql<boolean>`${users.passwordHash} = ''` })
    .from(users)
    .where(eq(users.id, pedido.userId))
    .limit(1);
  const para = sesion.customer_details?.email || usuario?.email;
  if (!para) return;

  const canal = items.find((i) => i.canal)?.canal;
  const marca: Marca = esMarca(canal) ? canal : "ceduct";
  const origen = sesion.metadata?.origen || (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const nombre = (usuario?.nombre || sesion.customer_details?.name || "").split(" ")[0];

  const contenido = {
    titulo: "Tu pago está confirmado",
    intro: `${nombre ? `Hola, ${nombre}. ` : ""}Recibimos tu pago y ya tienes acceso a ${
      items.length === 1 ? "tu programa" : `tus ${items.length} programas`
    }.`,
    folio: pedido.id,
    filas: items.map((i) => ({ concepto: i.titulo, importe: pesos(i.precio) })),
    total: pesos(sesion.amount_total ?? pedido.total),
    boton: origen ? { texto: "Entrar a mis cursos", url: `${origen}/mi-cuenta/cursos` } : undefined,
    nota: !usuario?.sinClave
      ? undefined
      : "Para entrar, usa «Entrar con mi correo» con esta misma dirección: te llega un código y listo.",
  };

  await enviarCorreo({
    marca,
    para,
    asunto: `Pago confirmado · ${pedido.id}`,
    html: plantilla(marca, contenido),
    texto: textoPlano(marca, contenido),
    clave: `pago-curso-${pedido.id}`,
  });

  const aviso = {
    titulo: `Nueva venta · ${pesos(sesion.amount_total ?? pedido.total)}`,
    intro: `${usuario?.nombre ?? "Un cliente"} (${para}) pagó en línea.`,
    folio: pedido.id,
    filas: contenido.filas,
    total: contenido.total,
  };
  await enviarCorreo({
    marca,
    para: correoVentas(),
    asunto: `Venta ${pesos(sesion.amount_total ?? pedido.total)} · ${pedido.id}`,
    html: plantilla(marca, aviso),
    texto: textoPlano(marca, aviso),
    clave: `venta-curso-${pedido.id}`,
    responderA: para,
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
