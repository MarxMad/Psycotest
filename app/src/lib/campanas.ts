import { createHmac, timingSafeEqual } from "node:crypto";
import { and, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  accessCodes,
  courseCategories,
  courseEnrollments,
  courses,
  coupons,
  emailBajas,
  emailCampaigns,
  orderItems,
  orders,
  studentExpedientes,
  users,
} from "@/db/schema";
import { logAudit } from "@/lib/auth";
import { secretoDeSesion } from "@/lib/auth-secreto";
import { CHANNELS, channelPublicUrl } from "@/lib/channels";
import { enviarCorreo, enviarLote, plantilla, textoPlano, type MensajeLote } from "@/lib/correo";
import { esMarcaCobro, type MarcaCobro } from "@/lib/stripe";
import { urlDePlataforma } from "@/lib/sitio";

/**
 * Promociones por correo desde Panel → Marketing.
 *
 * Cada campaña es de una marca: sale con su remitente, sus colores y su
 * dominio, y solo llega a quien no se dio de baja de esa marca. Todas llevan
 * enlace de baja y el encabezado List-Unsubscribe (baja en un clic desde
 * Gmail o Outlook), que además pide la ley y cuidan los filtros de spam.
 */

export const AUDIENCIAS = {
  alumnos: "Alumnos y clientes de la marca",
  compradores: "Quienes han pagado algo a la marca",
  todos: "Todas las personas registradas",
} as const;
export type Audiencia = keyof typeof AUDIENCIAS;

export function esAudiencia(v: unknown): v is Audiencia {
  return typeof v === "string" && v in AUDIENCIAS;
}

type Destinatario = { email: string; nombre: string };

/* ------------------------------------------------------------- audiencia */

async function idsDeAudiencia(marca: MarcaCobro, audiencia: Audiencia): Promise<string[] | "todos"> {
  if (audiencia === "todos") return "todos";
  const db = getDb();

  if (audiencia === "compradores") {
    const filas =
      marca === "psicologia"
        ? await db
            .select({ id: orders.userId })
            .from(orders)
            .where(and(eq(orders.status, "completed"), like(orders.id, "ord-psi-%")))
        : await db
            .select({ id: orders.userId })
            .from(orders)
            .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
            .innerJoin(courses, eq(orderItems.courseId, courses.id))
            .innerJoin(courseCategories, eq(courses.categoryId, courseCategories.id))
            .where(and(eq(orders.status, "completed"), eq(courseCategories.channelId, marca)));
    return [...new Set(filas.map((f) => f.id))];
  }

  // Alumnos: inscritos en cursos de la marca, más lo propio de cada una.
  const inscritos = await db
    .select({ id: courseEnrollments.userId })
    .from(courseEnrollments)
    .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
    .innerJoin(courseCategories, eq(courses.categoryId, courseCategories.id))
    .where(
      and(
        eq(courseCategories.channelId, marca),
        inArray(courseEnrollments.status, ["active", "completed"]),
      ),
    );
  const ids = new Set(inscritos.map((f) => f.id));

  if (marca === "ceduct") {
    const exp = await db.select({ id: studentExpedientes.userId }).from(studentExpedientes);
    exp.forEach((f) => f.id && ids.add(f.id));
  }
  if (marca === "psicologia") {
    const cli = await db
      .select({ id: accessCodes.clienteUserId })
      .from(accessCodes)
      .where(sql`${accessCodes.clienteUserId} is not null`);
    cli.forEach((f) => f.id && ids.add(f.id));
  }
  return [...ids];
}

/** Destinatarios de una campaña, ya sin quienes se dieron de baja. */
export async function destinatarios(marca: MarcaCobro, audiencia: Audiencia): Promise<Destinatario[]> {
  const db = getDb();
  const ids = await idsDeAudiencia(marca, audiencia);
  if (ids !== "todos" && ids.length === 0) return [];

  const personas: Destinatario[] = [];
  // En tandas: un IN con miles de valores es mala idea.
  const tandas = ids === "todos" ? [null] : Array.from({ length: Math.ceil(ids.length / 500) }, (_, i) => ids.slice(i * 500, i * 500 + 500));
  for (const tanda of tandas) {
    const filas = await db
      .select({ email: users.email, nombre: users.nombre })
      .from(users)
      .where(tanda ? inArray(users.id, tanda) : eq(users.rol, "cliente"));
    personas.push(...filas);
  }

  const bajas = await db
    .select({ email: emailBajas.email })
    .from(emailBajas)
    .where(or(eq(emailBajas.marca, marca), eq(emailBajas.marca, "todas")));
  const fuera = new Set(bajas.map((b) => b.email.toLowerCase()));

  const vistos = new Set<string>();
  return personas.filter((p) => {
    const e = p.email.toLowerCase();
    if (!e.includes("@") || fuera.has(e) || vistos.has(e)) return false;
    vistos.add(e);
    return true;
  });
}

/* ------------------------------------------------------------------ baja */

function firma(email: string, marca: string): string {
  return createHmac("sha256", Buffer.from(secretoDeSesion()))
    .update(`baja:${marca}:${email.toLowerCase()}`)
    .digest("base64url")
    .slice(0, 32);
}

export function firmaValida(email: string, marca: string, t: string): boolean {
  const esperada = Buffer.from(firma(email, marca));
  const recibida = Buffer.from(t);
  return esperada.length === recibida.length && timingSafeEqual(esperada, recibida);
}

function parametrosDeBaja(email: string, marca: MarcaCobro): string {
  const q = new URLSearchParams({ e: email.toLowerCase(), m: marca, t: firma(email, marca) });
  return q.toString();
}

/** Registra la baja. `marca` puede ser una marca o "todas". */
export async function darDeBaja(email: string, marca: MarcaCobro | "todas"): Promise<void> {
  const e = email.toLowerCase();
  await getDb()
    .insert(emailBajas)
    .values({ id: `${marca}:${e}`, email: e, marca, createdAt: new Date().toISOString() })
    .onConflictDoNothing();
}

/* --------------------------------------------------------------- mensaje */

export type DatosCampana = {
  marca: MarcaCobro;
  audiencia: Audiencia;
  asunto: string;
  titulo: string;
  cuerpo: string;
  botonTexto?: string | null;
  botonUrl?: string | null;
  cuponCodigo?: string | null;
};

/** Valida lo que llega del panel. Devuelve el error a mostrar o los datos limpios. */
export async function validarCampana(b: Record<string, unknown>): Promise<{ ok: true; datos: DatosCampana } | { ok: false; error: string }> {
  const txt = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  if (!esMarcaCobro(b.marca)) return { ok: false, error: "Elige la marca." };
  if (!esAudiencia(b.audiencia)) return { ok: false, error: "Elige a quién va." };
  const asunto = txt(b.asunto, 150);
  const titulo = txt(b.titulo, 150);
  const cuerpo = txt(b.cuerpo, 5000);
  if (!asunto || !titulo || !cuerpo) return { ok: false, error: "Faltan el asunto, el título o el mensaje." };

  const botonTexto = txt(b.botonTexto, 60) || null;
  let botonUrl = txt(b.botonUrl, 500) || null;
  if (botonTexto && !botonUrl) botonUrl = channelPublicUrl(b.marca);
  if (botonUrl && botonUrl.startsWith("/")) botonUrl = urlDePlataforma(b.marca, botonUrl);
  if (botonUrl && !/^https:\/\//i.test(botonUrl) && !/^http:\/\/localhost/i.test(botonUrl)) {
    return { ok: false, error: "El enlace del botón debe empezar con https://" };
  }

  const cuponCodigo = txt(b.cuponCodigo, 60).toUpperCase() || null;
  if (cuponCodigo) {
    const [c] = await getDb()
      .select({ activo: coupons.active, vence: coupons.expiresAt })
      .from(coupons)
      .where(eq(coupons.code, cuponCodigo))
      .limit(1);
    if (!c || !c.activo || (c.vence && new Date(c.vence) < new Date())) {
      return { ok: false, error: "Ese cupón no existe o ya no está vigente." };
    }
  }

  return {
    ok: true,
    datos: {
      marca: b.marca,
      audiencia: b.audiencia,
      asunto,
      titulo,
      cuerpo,
      botonTexto: botonUrl ? botonTexto || "Ver más" : null,
      botonUrl,
      cuponCodigo,
    },
  };
}

function armar(d: DatosCampana, para: Destinatario | null): MensajeLote {
  const parrafos = d.cuerpo.split(/\n\s*\n/).map((p) => p.replace(/\s*\n\s*/g, " ").trim()).filter(Boolean);
  const nombre = para?.nombre && !para.nombre.includes("@") && para.nombre !== para.email.split("@")[0]
    ? para.nombre.split(" ")[0]
    : "";
  const consulta = para ? parametrosDeBaja(para.email, d.marca) : "";
  const baja = para ? urlDePlataforma(d.marca, `/baja?${consulta}`) : urlDePlataforma(d.marca, "/baja");
  const contenido = {
    titulo: d.titulo,
    intro: `${nombre ? `Hola, ${nombre}. ` : ""}${parrafos[0] ?? ""}`,
    parrafos: parrafos.slice(1),
    destacado: d.cuponCodigo ? { etiqueta: "Tu código de descuento", valor: d.cuponCodigo } : undefined,
    boton: d.botonUrl ? { texto: d.botonTexto || "Ver más", url: d.botonUrl } : undefined,
    baja,
  };
  return {
    para: para?.email ?? "",
    asunto: d.asunto,
    html: plantilla(d.marca, contenido),
    texto: textoPlano(d.marca, contenido),
    encabezados: para
      ? {
          "List-Unsubscribe": `<${urlDePlataforma(d.marca, `/api/correo/baja?${consulta}`)}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        }
      : undefined,
  };
}

/** Vista previa en HTML (sin destinatario). */
export function vistaPrevia(d: DatosCampana): string {
  return armar(d, null).html;
}

/** Manda la campaña solo a quien la está armando. */
export async function enviarPrueba(d: DatosCampana, para: { email: string; nombre: string }) {
  const m = armar(d, para);
  return enviarCorreo({
    marca: d.marca,
    para: para.email,
    asunto: `[Prueba] ${m.asunto}`,
    html: m.html,
    texto: m.texto,
    encabezados: m.encabezados,
  });
}

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Envía la campaña a toda su audiencia y deja el registro en el historial. */
export async function enviarCampana(d: DatosCampana, autor: { id: string }) {
  const db = getDb();
  const lista = await destinatarios(d.marca, d.audiencia);
  const id = `cmp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const ahora = new Date().toISOString();

  await db.insert(emailCampaigns).values({
    id,
    marca: d.marca,
    audiencia: d.audiencia,
    asunto: d.asunto,
    titulo: d.titulo,
    cuerpo: d.cuerpo,
    botonTexto: d.botonTexto ?? null,
    botonUrl: d.botonUrl ?? null,
    cuponCodigo: d.cuponCodigo ?? null,
    estado: "enviando",
    destinatarios: lista.length,
    creadoPor: autor.id,
    createdAt: ahora,
  });

  let enviados = 0;
  let fallidos = 0;
  for (let i = 0; i < lista.length; i += 100) {
    const lote = lista.slice(i, i + 100).map((p) => armar(d, p));
    const r = await enviarLote(d.marca, lote, `${id}-${i / 100}`);
    if (r.ok) enviados += r.enviados;
    else fallidos += lote.length;
    // Resend admite pocas llamadas por segundo; entre lotes se respira.
    if (i + 100 < lista.length) await espera(600);
  }

  await db
    .update(emailCampaigns)
    .set({
      estado: fallidos > 0 ? "con_errores" : "enviada",
      enviados,
      fallidos,
      enviadaAt: new Date().toISOString(),
    })
    .where(eq(emailCampaigns.id, id));

  await logAudit(autor.id, "create", "email_campaign", id, {
    marca: d.marca,
    audiencia: d.audiencia,
    destinatarios: lista.length,
    enviados,
    fallidos,
  });

  return { id, destinatarios: lista.length, enviados, fallidos };
}

export async function historial(limite = 50) {
  return getDb().select().from(emailCampaigns).orderBy(desc(emailCampaigns.createdAt)).limit(limite);
}

export function nombreDeMarca(marca: MarcaCobro): string {
  return CHANNELS[marca].name;
}
