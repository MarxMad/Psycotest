import type Stripe from "stripe";
import { and, eq, ne } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { orders } from "@/db/schema";
import { logAudit } from "@/lib/auth";
import { derivedAccessCodePlain, hashAccessCodeLookup, normalizeAccessCode } from "@/lib/access-codes";
import { correoVentas, enviarCorreo, escapar, pesos, plantilla, textoPlano } from "@/lib/correo";
import { ETIQUETA_FLUJO, OPCIONES_DE_PAGO, usuarioPorCorreo } from "@/lib/pagos";
import {
  MAX_CANDIDATOS_EN_LINEA,
  PRUEBAS,
  cotizarEnLinea,
  esDigital,
  type PruebaDigital,
} from "@/lib/pruebas-catalogo";
import { psycotest } from "@/lib/routes";
import { stripe } from "@/lib/stripe";

/**
 * Cobro en línea de Psicología Aplicada.
 *
 * Se compran pruebas por candidato. Al confirmarse el pago se genera un código
 * de acceso por candidato, con exactamente las pruebas pagadas, y se manda por
 * correo a quien compró. Los códigos salen de la sesión de pago de forma
 * determinista: si Stripe reintenta el aviso o la página de confirmación pide
 * cumplir el pedido a la vez, salen los mismos y no se duplican.
 *
 * El pedido vive en `orders` (sin renglones: no son cursos) para que aparezca
 * en Pagos → Transacciones; el detalle va en los metadatos de Stripe.
 */

/** Días que vale un código comprado en línea. */
const VIGENCIA_DIAS = 180;

export type Modo = "empresa" | "persona";

type Compra = {
  pedidoId: string;
  pruebas: PruebaDigital[];
  candidatos: number;
  modo: Modo;
  nombre: string;
  empresa: string | null;
};

function leerCompra(sesion: Stripe.Checkout.Session): Compra | null {
  const m = sesion.metadata ?? {};
  if (m.tipo !== "psicologia" || !m.pedidoId) return null;
  const pruebas = (m.pruebas ?? "").split(",").filter(esDigital);
  const candidatos = Math.min(MAX_CANDIDATOS_EN_LINEA, Math.max(1, Number(m.candidatos) || 1));
  if (pruebas.length === 0) return null;
  return {
    pedidoId: m.pedidoId,
    pruebas,
    candidatos,
    modo: m.modo === "persona" ? "persona" : "empresa",
    nombre: m.nombre ?? "",
    empresa: m.empresa || null,
  };
}

/** Los códigos de una sesión pagada, en claro. Siempre los mismos. */
export function codigosDeSesion(sesionId: string, candidatos: number): string[] {
  return Array.from({ length: candidatos }, (_, i) => derivedAccessCodePlain(`psicologia:${sesionId}:${i}`));
}

export function nombresDe(pruebas: readonly string[]): string[] {
  return PRUEBAS.filter((p) => pruebas.includes(p.id)).map((p) => p.nombre);
}

/* ------------------------------------------------------------ crear pago */

export async function crearCompraPsicologia(entrada: {
  pruebas: string[];
  candidatos: number;
  modo: Modo;
  nombre: string;
  email: string;
  empresa?: string | null;
  origen: string;
  sesionUsuarioId?: string | null;
}): Promise<{ ok: true; url: string } | { ok: false; error: string; status: number }> {
  if (!stripe) return { ok: false, error: "El cobro en línea no está configurado.", status: 503 };

  const candidatos = entrada.modo === "persona" ? 1 : entrada.candidatos;
  const c = cotizarEnLinea(entrada.pruebas, candidatos);
  if (c.ids.length === 0) {
    return { ok: false, error: "Elige al menos una prueba que se pueda pagar en línea.", status: 400 };
  }
  if (c.totalConIva <= 0) return { ok: false, error: "No hay nada que cobrar.", status: 400 };

  const db = getDb();
  const userId = await usuarioPorCorreo({
    sesionId: entrada.sesionUsuarioId,
    email: entrada.email,
    nombre: entrada.nombre,
  });

  const n = entrada.modo === "persona" ? 1 : Math.min(MAX_CANDIDATOS_EN_LINEA, Math.max(1, candidatos));
  const pedidoId = `ord-psi-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const nombres = nombresDe(c.ids);

  await db.insert(orders).values({
    id: pedidoId,
    userId,
    subtotal: c.subtotal,
    discount: c.descuento,
    total: c.totalConIva,
    status: "pending",
    createdAt: new Date().toISOString(),
  });

  await logAudit(userId, "create", "order", pedidoId, {
    canal: "psicologia",
    pruebas: c.ids,
    candidatos: n,
    total: c.totalConIva,
    empresa: entrada.empresa || null,
  });

  const descripcion =
    entrada.modo === "persona"
      ? `Evaluación personal: ${nombres.join(", ")}`
      : `${n} candidato${n === 1 ? "" : "s"} · ${nombres.join(", ")}${
          c.descuento ? ` · incluye descuento por volumen de ${pesos(c.descuento)}` : ""
        }`;

  try {
    const sesion = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "mxn",
            unit_amount: c.total,
            product_data: {
              name: entrada.modo === "persona" ? "Evaluación psicológica personal" : "Evaluaciones psicométricas",
              description: descripcion.slice(0, 500),
            },
          },
        },
        {
          quantity: 1,
          price_data: {
            currency: "mxn",
            unit_amount: c.iva,
            product_data: { name: "IVA 16%" },
          },
        },
      ],
      client_reference_id: pedidoId,
      customer_email: entrada.email,
      metadata: {
        tipo: "psicologia",
        pedidoId,
        pruebas: c.ids.join(","),
        candidatos: String(n),
        modo: entrada.modo,
        nombre: entrada.nombre.slice(0, 200),
        empresa: (entrada.empresa ?? "").slice(0, 200),
        origen: entrada.origen,
      },
      payment_intent_data: { metadata: { tipo: "psicologia", pedidoId } },
      ...OPCIONES_DE_PAGO,
      locale: "es",
      success_url: `${entrada.origen}${psycotest.compra}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${entrada.origen}/#cotizador`,
      integration_identifier: ETIQUETA_FLUJO,
    });
    if (!sesion.url) return { ok: false, error: "Stripe no devolvió una URL de pago.", status: 502 };
    return { ok: true, url: sesion.url };
  } catch (error) {
    console.error("[pagos-psicologia] crear sesión:", error);
    return { ok: false, error: "No se pudo abrir el pago.", status: 502 };
  }
}

/* ---------------------------------------------------------- cumplir pago */

/**
 * Genera los códigos, los manda por correo y cierra el pedido. La llaman el
 * webhook y la página de confirmación; las dos pueden coincidir.
 */
export async function cumplirCompraPsicologia(sesion: Stripe.Checkout.Session): Promise<void> {
  if (sesion.payment_status === "unpaid") return;
  const compra = leerCompra(sesion);
  if (!compra) {
    console.error("[pagos-psicologia] sesión sin datos de compra:", sesion.id);
    return;
  }

  const db = getDb();
  const [pedido] = await db.select().from(orders).where(eq(orders.id, compra.pedidoId)).limit(1);
  if (!pedido) {
    console.error("[pagos-psicologia] pedido inexistente:", compra.pedidoId);
    return;
  }
  if (pedido.status === "completed") return;

  const ahora = new Date();
  const vence = new Date(ahora.getTime() + VIGENCIA_DIAS * 86_400_000).toISOString();
  const codigos = codigosDeSesion(sesion.id, compra.candidatos);
  const quien = compra.empresa || compra.nombre || "Compra en línea";

  // Primero los códigos (repetirlo no hace nada: mismo id, mismo hash).
  await db
    .insert(schema.accessCodes)
    .values(
      codigos.map((plano, i) => {
        const normal = normalizeAccessCode(plano);
        return {
          id: `code-psi-${compra.pedidoId}-${i}`,
          label:
            compra.modo === "persona"
              ? `${quien} · evaluación personal`
              : `${quien} · candidato ${i + 1} de ${compra.candidatos}`,
          empresa: compra.empresa,
          // Le da acceso a los resultados de sus candidatos desde su cuenta.
          clienteUserId: pedido.userId,
          lookupHash: hashAccessCodeLookup(normal),
          codeSuffix: normal.slice(-4),
          allowedInstruments: compra.pruebas,
          maxUses: 1,
          usedCount: 0,
          active: true,
          expiresAt: vence,
          createdById: null,
          createdAt: ahora.toISOString(),
          updatedAt: ahora.toISOString(),
        };
      }),
    )
    .onConflictDoNothing();

  const pagoId =
    typeof sesion.payment_intent === "string" ? sesion.payment_intent : sesion.payment_intent?.id ?? null;
  const cerrado = await db
    .update(orders)
    .set({ status: "completed", completedAt: ahora.toISOString(), stripePaymentIntentId: pagoId })
    .where(and(eq(orders.id, pedido.id), ne(orders.status, "completed")))
    .returning({ id: orders.id });
  if (cerrado.length === 0) return; // Otro aviso ya lo cerró y mandó el correo.

  await logAudit(pedido.userId, "update", "order", pedido.id, {
    via: "stripe",
    canal: "psicologia",
    total: pedido.total,
    codigos: codigos.length,
  });

  await avisarCompra(sesion, compra, codigos, vence).catch((e) =>
    console.error("[pagos-psicologia] correo:", e),
  );
}

async function avisarCompra(sesion: Stripe.Checkout.Session, compra: Compra, codigos: string[], vence: string) {
  const para = sesion.customer_details?.email || sesion.customer_email;
  const origen = sesion.metadata?.origen || (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const acceso = `${origen}${psycotest.acceso}`;
  const pruebas = nombresDe(compra.pruebas);
  const persona = compra.modo === "persona";
  const total = pesos(sesion.amount_total ?? 0);
  const fechaVence = new Intl.DateTimeFormat("es-MX", { dateStyle: "long" }).format(new Date(vence));
  const nombre = compra.nombre.split(" ")[0];

  const tablaCodigos = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 14px;border:1px solid #e3e0d6;border-radius:10px">
${codigos
  .map(
    (c, i) => `<tr><td style="padding:10px 14px;border-bottom:1px solid #eeebe3;font-size:14px;color:#666">${
      persona ? "Tu código" : `Candidato ${i + 1}`
    }</td><td style="padding:10px 14px;border-bottom:1px solid #eeebe3;font-family:Menlo,Consolas,monospace;font-size:17px;letter-spacing:.06em;color:#111;text-align:right"><strong>${escapar(c)}</strong></td></tr>`,
  )
  .join("")}
</table>`;

  const instrucciones = persona
    ? `Entra a ${acceso}, escribe tu código y contesta a tu ritmo: puedes pausar y retomar. Tu informe, interpretado por un psicólogo, llega en 72 horas.`
    : `Manda un código a cada candidato. Cada uno entra a ${acceso}, escribe su código y contesta desde donde esté. Cada código sirve una vez y vence el ${fechaVence}. Los informes, interpretados por un psicólogo, llegan en 72 horas.`;

  const contenido = {
    titulo: persona ? "Tu código de evaluación" : `Tus ${codigos.length} códigos de evaluación`,
    intro: `${nombre ? `Hola, ${nombre}. ` : ""}Recibimos tu pago de ${total}. ${
      persona ? "Este es tu código" : "Estos son los códigos de acceso"
    } para: ${pruebas.join(", ")}.`,
    folio: compra.pedidoId,
    nota: instrucciones,
  };

  if (para) {
    await enviarCorreo({
      marca: "psicologia",
      para,
      asunto: persona ? "Tu código de evaluación · Psicología Aplicada" : "Tus códigos de evaluación · Psicología Aplicada",
      html: plantilla("psicologia", {
        ...contenido,
        extraHtml: tablaCodigos,
        boton: { texto: "Ir a contestar", url: acceso },
      }),
      texto: textoPlano("psicologia", {
        ...contenido,
        extra: codigos.map((c, i) => `${persona ? "Tu código" : `Candidato ${i + 1}`}: ${c}`).join("\n"),
        boton: { texto: "Ir a contestar", url: acceso },
      }),
      clave: `pago-psicologia-${compra.pedidoId}`,
    });
  }

  // A ventas va el pedido, no los códigos: esos solo los tiene quien pagó.
  const aviso = {
    titulo: `Nueva venta · ${total}`,
    intro: `${compra.nombre || "Un cliente"}${compra.empresa ? ` (${compra.empresa})` : ""}, ${
      para ?? "sin correo"
    }, pagó ${persona ? "una evaluación personal" : `${codigos.length} evaluaciones`} en línea.`,
    folio: compra.pedidoId,
    filas: pruebas.map((p) => ({ concepto: p })),
    total,
  };
  await enviarCorreo({
    marca: "psicologia",
    para: correoVentas(),
    asunto: `Venta ${total} · ${compra.pedidoId}`,
    html: plantilla("psicologia", aviso),
    texto: textoPlano("psicologia", aviso),
    clave: `venta-psicologia-${compra.pedidoId}`,
    responderA: para ?? undefined,
  });
}

/** Lo que ve quien pagó en la página de confirmación. */
export async function estadoDeCompra(sesionId: string) {
  if (!stripe) return null;
  const sesion = await stripe.checkout.sessions.retrieve(sesionId);
  const compra = leerCompra(sesion);
  if (!compra) return null;
  const pagado = sesion.payment_status !== "unpaid";
  // Por si el webhook todavía no llega (o no está configurado): cumplir aquí
  // es seguro, la función es idempotente y los datos vienen de Stripe.
  if (pagado) await cumplirCompraPsicologia(sesion);
  return {
    pagado,
    estado: sesion.status,
    total: sesion.amount_total,
    correo: sesion.customer_details?.email ?? null,
    modo: compra.modo,
    pruebas: nombresDe(compra.pruebas),
    folio: compra.pedidoId,
    codigos: pagado ? codigosDeSesion(sesion.id, compra.candidatos) : [],
  };
}
