import type Stripe from "stripe";
import { and, eq, ne } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { orders } from "@/db/schema";
import { logAudit } from "@/lib/auth";
import { derivedAccessCodePlain, hashAccessCodeLookup, normalizeAccessCode } from "@/lib/access-codes";
import { correoVentas, enviarCorreo, escapar, pesos, plantilla, textoPlano } from "@/lib/correo";
import { ETIQUETA_FLUJO, OPCIONES_DE_PAGO, usuarioPorCorreo } from "@/lib/pagos";
import {
  DIGITALES,
  HORAS_ENTREGA,
  HORAS_PARA_CONTESTAR,
  PRUEBAS,
  cantidadesATexto,
  cotizarPorPrueba,
  esDigital,
  textoACantidades,
  type Cantidades,
  type PruebaDigital,
} from "@/lib/pruebas-catalogo";
import { psycotest } from "@/lib/routes";
import { buscarSesionDePago, IDENTIDAD_COBRO, stripeDe } from "@/lib/stripe";
import { urlDelSitio } from "@/lib/sitio";

/**
 * Cobro en línea de Psicología Aplicada.
 *
 * Se compra una cantidad de cada prueba. Al confirmarse el pago se genera un
 * código por cada unidad: cada código abre una sola prueba para una persona.
 * (En una evaluación personal sale un solo código con todas sus pruebas.)
 * Los códigos salen del pedido de forma determinista: si Stripe reintenta el
 * aviso o la página de confirmación pide cumplir el pedido a la vez, salen los
 * mismos y no se duplican; y el panel de la empresa puede volver a mostrarlos
 * sin guardarlos en claro.
 *
 * El pedido vive en `orders` (sin renglones: no son cursos) para que aparezca
 * en Pagos → Transacciones; el detalle va en los metadatos de Stripe.
 */

/** Días que vale un código comprado en línea. */
const VIGENCIA_DIAS = 180;

export type Modo = "empresa" | "persona";

type Compra = {
  pedidoId: string;
  /** Cuántos códigos de cada prueba. */
  cantidades: Partial<Record<PruebaDigital, number>>;
  modo: Modo;
  nombre: string;
  empresa: string | null;
  /** Pedido de antes del cambio a un código por prueba. */
  legado?: { pruebas: PruebaDigital[]; candidatos: number };
};

function leerCompra(sesion: Stripe.Checkout.Session): Compra | null {
  const m = sesion.metadata ?? {};
  if (m.tipo !== "psicologia" || !m.pedidoId) return null;
  const base = {
    pedidoId: m.pedidoId,
    modo: (m.modo === "persona" ? "persona" : "empresa") as Modo,
    nombre: m.nombre ?? "",
    empresa: m.empresa || null,
  };
  if (m.cantidades) {
    const cantidades = textoACantidades(m.cantidades);
    if (Object.keys(cantidades).length === 0) return null;
    return { ...base, cantidades };
  }
  // Pedidos abiertos antes del cambio (p. ej. un OXXO que se paga después).
  const pruebas = (m.pruebas ?? "").split(",").filter(esDigital);
  if (pruebas.length === 0) return null;
  const candidatos = Math.min(50, Math.max(1, Number(m.candidatos) || 1));
  return {
    ...base,
    cantidades: Object.fromEntries(pruebas.map((p) => [p, candidatos])),
    legado: { pruebas, candidatos },
  };
}

export type CodigoComprado = {
  id: string;
  plano: string;
  pruebas: PruebaDigital[];
  etiqueta: string;
};

/** Patrón del id de un código comprado por prueba: de aquí se recalcula el código. */
const ID_POR_PRUEBA = new RegExp(`^code-psi-(.+)-(${DIGITALES.join("|")})-(\\d+)$`);

function semillaPorPrueba(pedidoId: string, prueba: PruebaDigital, i: number) {
  return `psicologia:${pedidoId}:${prueba}:${i}`;
}

/**
 * El código en claro de un código comprado, si se puede recalcular (los de
 * un código por prueba y los personales). Solo para mostrárselo a su dueño.
 */
export function codigoEnClaro(codeId: string): string | null {
  const m = ID_POR_PRUEBA.exec(codeId);
  if (m) return derivedAccessCodePlain(semillaPorPrueba(m[1], m[2] as PruebaDigital, Number(m[3])));
  const p = /^code-psi-(.+)-persona$/.exec(codeId);
  if (p) return derivedAccessCodePlain(`psicologia:${p[1]}:persona`);
  return null;
}

/**
 * Un código por cada aplicación de cada prueba. Lo usan las compras en línea
 * (con el folio del pedido) y los lotes del panel (con el id del lote).
 */
export function codigosDeLote(
  folio: string,
  cantidades: Partial<Record<PruebaDigital, number>>,
  quien: string,
): CodigoComprado[] {
  return DIGITALES.filter((p) => (cantidades[p] ?? 0) > 0).flatMap((prueba) => {
    const n = cantidades[prueba] ?? 0;
    const nombre = nombresDe([prueba])[0];
    return Array.from({ length: n }, (_, i) => ({
      id: `code-psi-${folio}-${prueba}-${i}`,
      plano: derivedAccessCodePlain(semillaPorPrueba(folio, prueba, i)),
      pruebas: [prueba],
      etiqueta: `${quien} · ${nombre} ${i + 1} de ${n}`,
    }));
  });
}

/** Los códigos de una compra pagada, en claro. Siempre los mismos. */
export function codigosDeCompra(sesionId: string, compra: Compra): CodigoComprado[] {
  const quien = compra.empresa || compra.nombre || "Compra en línea";
  if (compra.legado) {
    const { pruebas, candidatos } = compra.legado;
    return Array.from({ length: candidatos }, (_, i) => ({
      id: `code-psi-${compra.pedidoId}-${i}`,
      plano: derivedAccessCodePlain(`psicologia:${sesionId}:${i}`),
      pruebas,
      etiqueta:
        compra.modo === "persona"
          ? `${quien} · evaluación personal`
          : `${quien} · candidato ${i + 1} de ${candidatos}`,
    }));
  }
  const pruebas = DIGITALES.filter((p) => (compra.cantidades[p] ?? 0) > 0);
  if (compra.modo === "persona") {
    return [
      {
        id: `code-psi-${compra.pedidoId}-persona`,
        plano: derivedAccessCodePlain(`psicologia:${compra.pedidoId}:persona`),
        pruebas,
        etiqueta: `${quien} · evaluación personal`,
      },
    ];
  }
  return codigosDeLote(compra.pedidoId, compra.cantidades, quien);
}

export function nombresDe(pruebas: readonly string[]): string[] {
  return PRUEBAS.filter((p) => pruebas.includes(p.id)).map((p) => p.nombre);
}

/* ------------------------------------------------------------ crear pago */

export async function crearCompraPsicologia(entrada: {
  cantidades: Cantidades;
  modo: Modo;
  nombre: string;
  email: string;
  empresa?: string | null;
  origen: string;
  sesionUsuarioId?: string | null;
}): Promise<{ ok: true; url: string } | { ok: false; error: string; status: number }> {
  const stripe = stripeDe("psicologia");
  if (!stripe) return { ok: false, error: "El cobro en línea no está configurado.", status: 503 };

  // Una evaluación personal es una sola persona: una de cada prueba elegida.
  const cantidades: Cantidades =
    entrada.modo === "persona"
      ? Object.fromEntries(Object.entries(entrada.cantidades).map(([id, n]) => [id, (n ?? 0) > 0 ? 1 : 0]))
      : entrada.cantidades;
  const c = cotizarPorPrueba(cantidades);
  if (c.renglones.length === 0) {
    return { ok: false, error: "Elige al menos una prueba que se pueda pagar en línea.", status: 400 };
  }
  if (c.total <= 0) return { ok: false, error: "No hay nada que cobrar.", status: 400 };

  const db = getDb();
  const userId = await usuarioPorCorreo({
    sesionId: entrada.sesionUsuarioId,
    email: entrada.email,
    nombre: entrada.nombre,
  });

  const pedidoId = `ord-psi-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const resumen = c.renglones.map((r) => `${r.cantidad} × ${r.prueba.nombre}`).join(", ");

  await db.insert(orders).values({
    id: pedidoId,
    userId,
    subtotal: c.subtotal,
    discount: c.descuento,
    total: c.total,
    status: "pending",
    createdAt: new Date().toISOString(),
  });

  await logAudit(userId, "create", "order", pedidoId, {
    canal: "psicologia",
    cantidades: cantidadesATexto(cantidades),
    codigos: c.codigos,
    total: c.total,
    empresa: entrada.empresa || null,
  });

  const descripcion =
    entrada.modo === "persona"
      ? `Evaluación personal: ${c.renglones.map((r) => r.prueba.nombre).join(", ")}`
      : `${c.codigos} código${c.codigos === 1 ? "" : "s"} · ${resumen}`;

  try {
    const sesion = await stripe.checkout.sessions.create({
      mode: "payment",
      // Un renglón por prueba, con su precio final (impuestos incluidos y
      // descuento por volumen ya aplicado). Sin desglose de IVA.
      line_items: c.renglones.map((r) => ({
        quantity: r.cantidad,
        price_data: {
          currency: "mxn",
          unit_amount: r.unitario,
          product_data: {
            name: entrada.modo === "persona" ? r.prueba.nombre : `${r.prueba.nombre} · código de evaluación`,
            description: (entrada.modo === "persona"
              ? r.prueba.descripcion
              : `Un código por aplicación. ${r.prueba.descripcion}`
            ).slice(0, 500),
          },
        },
      })),
      client_reference_id: pedidoId,
      customer_email: entrada.email,
      metadata: {
        tipo: "psicologia",
        marca: "psicologia",
        pedidoId,
        cantidades: cantidadesATexto(cantidades),
        modo: entrada.modo,
        nombre: entrada.nombre.slice(0, 200),
        empresa: (entrada.empresa ?? "").slice(0, 200),
        origen: entrada.origen,
      },
      payment_intent_data: {
        description: `${IDENTIDAD_COBRO.psicologia.nombre} · ${descripcion}`.slice(0, 1000),
        statement_descriptor_suffix: IDENTIDAD_COBRO.psicologia.sufijo,
        metadata: { tipo: "psicologia", marca: "psicologia", pedidoId },
      },
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
  const codigos = codigosDeCompra(sesion.id, compra);

  // Primero los códigos (repetirlo no hace nada: mismo id, mismo hash).
  await db
    .insert(schema.accessCodes)
    .values(
      codigos.map((c) => {
        const normal = normalizeAccessCode(c.plano);
        return {
          id: c.id,
          label: c.etiqueta,
          empresa: compra.empresa,
          // Le da acceso a los resultados de sus candidatos desde su cuenta.
          clienteUserId: pedido.userId,
          lookupHash: hashAccessCodeLookup(normal),
          codeSuffix: normal.slice(-4),
          allowedInstruments: c.pruebas,
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

async function avisarCompra(sesion: Stripe.Checkout.Session, compra: Compra, codigos: CodigoComprado[], vence: string) {
  const para = sesion.customer_details?.email || sesion.customer_email;
  const origen = sesion.metadata?.origen || urlDelSitio();
  const acceso = `${origen}${psycotest.acceso}`;
  const panel = `${origen}/mi-cuenta/evaluaciones`;
  const pruebas = nombresDe(Object.keys(compra.cantidades));
  const persona = compra.modo === "persona";
  const total = pesos(sesion.amount_total ?? 0);
  const fechaVence = new Intl.DateTimeFormat("es-MX", { dateStyle: "long" }).format(new Date(vence));
  const nombre = compra.nombre.split(" ")[0];
  const concepto = (c: CodigoComprado) => (persona ? "Tu código" : nombresDe(c.pruebas).join(", "));

  const tablaCodigos = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 14px;border:1px solid #e3e0d6;border-radius:10px">
${codigos
  .map(
    (c) => `<tr><td style="padding:10px 14px;border-bottom:1px solid #eeebe3;font-size:14px;color:#666">${escapar(
      concepto(c),
    )}</td><td style="padding:10px 14px;border-bottom:1px solid #eeebe3;font-family:Menlo,Consolas,monospace;font-size:17px;letter-spacing:.06em;color:#111;text-align:right"><strong>${escapar(c.plano)}</strong></td></tr>`,
  )
  .join("")}
</table>`;

  const valor = `El informe lo revisa y firma un psicólogo, en formato de reporte profesional, y llega en ${HORAS_ENTREGA} horas.`;
  const instrucciones = persona
    ? `Entra a ${acceso} y escribe tu código. Desde que lo activas tienes ${HORAS_PARA_CONTESTAR} horas para contestar. ${valor}`
    : `Cada código abre una sola prueba para una persona: manda a cada candidato el código de cada prueba que le toca. Entran a ${acceso}, escriben su código y contestan desde donde estén. Desde que activan un código tienen ${HORAS_PARA_CONTESTAR} horas para terminar. Los códigos sin activar vencen el ${fechaVence}. En tu panel (${panel}) ves cuántos te quedan, quién contestó y sus resultados. ${valor}`;

  const contenido = {
    titulo: persona ? "Tu código de evaluación" : `Tus ${codigos.length} códigos de evaluación`,
    intro: `${nombre ? `Hola, ${nombre}. ` : ""}Recibimos tu pago de ${total}. ${
      persona ? "Este es tu código" : "Estos son tus códigos, uno por prueba,"
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
        boton: persona ? { texto: "Ir a contestar", url: acceso } : { texto: "Ver mis códigos en el panel", url: panel },
      }),
      texto: textoPlano("psicologia", {
        ...contenido,
        extra: codigos.map((c) => `${concepto(c)}: ${c.plano}`).join("\n"),
        boton: persona ? { texto: "Ir a contestar", url: acceso } : { texto: "Ver mis códigos en el panel", url: panel },
      }),
      clave: `pago-psicologia-${compra.pedidoId}`,
    });
  }

  // A ventas va el pedido, no los códigos: esos solo los tiene quien pagó.
  const aviso = {
    titulo: `Nueva venta · ${total}`,
    intro: `${compra.nombre || "Un cliente"}${compra.empresa ? ` (${compra.empresa})` : ""}, ${
      para ?? "sin correo"
    }, pagó ${persona ? "una evaluación personal" : `${codigos.length} códigos de evaluación`} en línea.`,
    folio: compra.pedidoId,
    filas: Object.entries(compra.cantidades).map(([id, n]) => ({
      concepto: `${persona ? "" : `${n} × `}${nombresDe([id])[0]}`,
    })),
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
  const sesion = await buscarSesionDePago(sesionId, "psicologia");
  if (!sesion) return null;
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
    pruebas: nombresDe(Object.keys(compra.cantidades)),
    folio: compra.pedidoId,
    codigos: pagado
      ? codigosDeCompra(sesion.id, compra).map((c) => ({ codigo: c.plano, pruebas: nombresDe(c.pruebas) }))
      : [],
  };
}
