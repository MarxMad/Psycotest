import Stripe from "stripe";
import { urlDelSitio } from "@/lib/sitio";

/**
 * Clientes de Stripe, uno por cuenta.
 *
 * Las tres empresas pueden cobrar en una sola cuenta de Stripe o cada una en
 * la suya (para que el dinero y las facturas queden a nombre de quien vende):
 *
 *   STRIPE_SECRET_KEY              cuenta por defecto
 *   STRIPE_SECRET_KEY_CEDUCT       cuenta propia de CEDUCT (opcional)
 *   STRIPE_SECRET_KEY_IGE          cuenta propia de IGE (opcional)
 *   STRIPE_SECRET_KEY_PSICOLOGIA   cuenta propia de Psicología Aplicada (opcional)
 *
 * y lo mismo con STRIPE_WEBHOOK_SECRET[_MARCA]. Una marca sin clave propia
 * cobra con la de por defecto. Sin ninguna clave el resto del sistema sigue
 * funcionando sin cobro con tarjeta: los pedidos se cierran por contacto.
 *
 * Las claves viven en el entorno, nunca en el repositorio.
 */

export type MarcaCobro = "ceduct" | "ige" | "psicologia";
export const MARCAS_COBRO: readonly MarcaCobro[] = ["ceduct", "ige", "psicologia"];

const VERSION_API = "2026-08-26.dahlia" as const;

export function esMarcaCobro(v: unknown): v is MarcaCobro {
  return typeof v === "string" && (MARCAS_COBRO as readonly string[]).includes(v);
}

function claveDe(marca?: MarcaCobro | null): string | null {
  const propia = marca ? process.env[`STRIPE_SECRET_KEY_${marca.toUpperCase()}`] : undefined;
  return propia || process.env.STRIPE_SECRET_KEY || null;
}

function secretoWebhookDe(marca?: MarcaCobro | null): string | null {
  const propio = marca ? process.env[`STRIPE_WEBHOOK_SECRET_${marca.toUpperCase()}`] : undefined;
  return propio || process.env.STRIPE_WEBHOOK_SECRET || null;
}

const clientes = new Map<string, Stripe>();

function clientePara(clave: string): Stripe {
  let c = clientes.get(clave);
  if (!c) {
    c = new Stripe(clave, { apiVersion: VERSION_API });
    clientes.set(clave, c);
  }
  return c;
}

/** Cliente de la cuenta que cobra para esta marca (o la de por defecto). */
export function stripeDe(marca?: MarcaCobro | null): Stripe | null {
  const clave = claveDe(marca);
  return clave ? clientePara(clave) : null;
}

/** Cliente de la cuenta por defecto. */
export const stripe = stripeDe();

/** ¿Hay con qué cobrar? Sin marca: ¿hay al menos una cuenta? */
export function isStripeConfigured(marca?: MarcaCobro | null) {
  if (marca) return Boolean(claveDe(marca));
  return Boolean(claveDe()) || MARCAS_COBRO.some((m) => Boolean(claveDe(m)));
}

/** Cuentas distintas configuradas, cada una con su secreto de webhook. */
export function cuentasStripe(): { cliente: Stripe; secretoWebhook: string | null }[] {
  const vistas = new Map<string, { cliente: Stripe; secretos: Set<string> }>();
  for (const m of [null, ...MARCAS_COBRO]) {
    const clave = claveDe(m);
    if (!clave) continue;
    const entrada = vistas.get(clave) ?? { cliente: clientePara(clave), secretos: new Set<string>() };
    const secreto = secretoWebhookDe(m);
    if (secreto) entrada.secretos.add(secreto);
    vistas.set(clave, entrada);
  }
  return [...vistas.values()].flatMap(({ cliente, secretos }): { cliente: Stripe; secretoWebhook: string | null }[] =>
    secretos.size === 0
      ? [{ cliente, secretoWebhook: null }]
      : [...secretos].map((s) => ({ cliente, secretoWebhook: s })),
  );
}

/**
 * Verifica un evento contra el secreto de cada cuenta. Devuelve el evento y
 * el cliente de la cuenta que lo firmó, o null si ninguna firma cuadra.
 */
export async function verificarEvento(
  crudo: string,
  firma: string,
): Promise<{ evento: Stripe.Event; cliente: Stripe } | null> {
  for (const { cliente, secretoWebhook } of cuentasStripe()) {
    if (!secretoWebhook) continue;
    try {
      const evento = await cliente.webhooks.constructEventAsync(crudo, firma, secretoWebhook);
      return { evento, cliente };
    } catch {
      // No es de esta cuenta; se prueba la siguiente.
    }
  }
  return null;
}

/** ¿Hay al menos un secreto de webhook configurado? */
export function hayWebhookConfigurado(): boolean {
  return cuentasStripe().some((c) => c.secretoWebhook);
}

/**
 * Busca una sesión de pago. Si se sabe la marca se pregunta a su cuenta; si
 * no, a cada cuenta configurada hasta encontrarla.
 */
export async function buscarSesionDePago(
  sesionId: string,
  marca?: MarcaCobro | null,
): Promise<Stripe.Checkout.Session | null> {
  const preferido = marca ? stripeDe(marca) : null;
  const candidatos = [
    ...(preferido ? [preferido] : []),
    ...new Set(cuentasStripe().map((c) => c.cliente)),
  ];
  for (const cliente of new Set(candidatos)) {
    try {
      return await cliente.checkout.sessions.retrieve(sesionId);
    } catch {
      // No existe en esta cuenta.
    }
  }
  return null;
}

export function siteUrl() {
  return urlDelSitio();
}

/**
 * Importe para mostrar.
 *
 * Los precios se guardan en centavos (`courses.price_mxn`). Esta función los
 * daba por pesos, así que las páginas de cursos enseñaban cien veces el
 * precio real: 700 pesos se leían como $70,000.00.
 */
export function formatMxn(centavos: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: centavos % 100 === 0 ? 0 : 2,
  }).format(centavos / 100);
}
