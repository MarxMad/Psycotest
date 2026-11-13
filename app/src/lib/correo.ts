import { CONTACTO } from "@/lib/contacto";

/**
 * Correo transaccional de los canales (confirmaciones de pago, códigos).
 *
 * Va por la API HTTP de Resend, sin dependencia extra. Sin `RESEND_API_KEY`
 * no se manda nada y solo queda la línea en el registro: un correo que no
 * sale nunca debe tumbar un cobro que ya entró.
 *
 * Variables:
 *   RESEND_API_KEY        clave de Resend (re_…)
 *   CORREO_REMITENTE      remitente por defecto, p. ej. "Ventas <ventas@tudominio.mx>"
 *   CORREO_REMITENTE_CEDUCT / _IGE / _PSICOLOGIA / _MARTIN   remitente por marca (opcional)
 *   CORREO_VENTAS         a quién avisar de cada venta (opcional; si no, a CONTACTO.email)
 *
 * El dominio del remitente tiene que estar verificado en Resend, o el envío
 * se rechaza.
 */

export type Marca = "ceduct" | "ige" | "psicologia" | "martin";

type DatosMarca = { nombre: string; color: string; acento: string; pie: string };

export const MARCAS: Record<Marca, DatosMarca> = {
  ceduct: {
    nombre: "CEDUCT · Diplomados y Certificaciones",
    color: "#14145c",
    acento: "#c9a227",
    pie: "Diplomados y certificaciones de competencias laborales.",
  },
  ige: {
    nombre: "IGE · Ingeniería de Grupos Efectivos",
    color: "#0e3a4a",
    acento: "#f97316",
    pie: "Capacitación para equipos de trabajo.",
  },
  psicologia: {
    nombre: "Psicología Aplicada",
    color: "#1d5244",
    acento: "#f2d64b",
    pie: "Evaluación psicológica y selección de personal. Respaldo: Sociedad de Psicología Aplicada A.C.",
  },
  martin: {
    nombre: "Martín Hernández",
    color: "#1f2a37",
    acento: "#d4a24c",
    pie: "Consultoría y formación.",
  },
};

export function esMarca(v: unknown): v is Marca {
  return typeof v === "string" && v in MARCAS;
}

function remitente(marca: Marca): string {
  return (
    process.env[`CORREO_REMITENTE_${marca.toUpperCase()}`] ||
    process.env.CORREO_REMITENTE ||
    // El remitente de pruebas de Resend: solo entrega a la cuenta dueña.
    `${MARCAS[marca].nombre} <onboarding@resend.dev>`
  );
}

export function correoVentas(): string {
  return process.env.CORREO_VENTAS || CONTACTO.email;
}

export type Envio = { ok: true; id: string | null } | { ok: false; omitido?: boolean; error: string };

/**
 * Manda un correo. `clave` evita duplicados: Stripe reintenta los webhooks y
 * Resend descarta el segundo envío con la misma clave durante 24 h.
 */
export async function enviarCorreo(opciones: {
  marca: Marca;
  para: string | string[];
  asunto: string;
  html: string;
  texto: string;
  clave?: string;
  responderA?: string;
}): Promise<Envio> {
  const llave = process.env.RESEND_API_KEY;
  if (!llave) {
    console.warn(`[correo] sin RESEND_API_KEY; no se mandó «${opciones.asunto}»`);
    return { ok: false, omitido: true, error: "Correo no configurado" };
  }

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${llave}`,
        "Content-Type": "application/json",
        ...(opciones.clave ? { "Idempotency-Key": opciones.clave.slice(0, 256) } : {}),
      },
      body: JSON.stringify({
        from: remitente(opciones.marca),
        to: Array.isArray(opciones.para) ? opciones.para : [opciones.para],
        subject: opciones.asunto,
        html: opciones.html,
        text: opciones.texto,
        reply_to: opciones.responderA ?? CONTACTO.email,
      }),
    });
    const datos = (await r.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!r.ok) {
      console.error(`[correo] Resend ${r.status}:`, datos.message);
      return { ok: false, error: datos.message ?? `HTTP ${r.status}` };
    }
    return { ok: true, id: datos.id ?? null };
  } catch (error) {
    console.error("[correo] fallo de red:", error);
    return { ok: false, error: (error as Error).message };
  }
}

/* --------------------------------------------------------------- plantilla */

export function escapar(v: string): string {
  return v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export function pesos(centavos: number): string {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(centavos / 100);
}

export type Fila = { concepto: string; importe?: string };

/**
 * Plantilla común: tablas y estilos en línea, que es lo único que respetan
 * todos los clientes de correo. Todo el texto que entra se escapa aquí,
 * salvo `extraHtml`, que ya viene armado por quien llama.
 */
export function plantilla(marca: Marca, c: {
  titulo: string;
  intro: string;
  folio?: string;
  filas?: Fila[];
  total?: string;
  extraHtml?: string;
  boton?: { texto: string; url: string };
  nota?: string;
}): string {
  const m = MARCAS[marca];
  const filas = (c.filas ?? [])
    .map(
      (f) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #ececec;color:#333;font-size:15px">${escapar(f.concepto)}</td>
        <td style="padding:10px 0;border-bottom:1px solid #ececec;color:#333;font-size:15px;text-align:right;white-space:nowrap">${f.importe ? escapar(f.importe) : ""}</td>
      </tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapar(c.titulo)}</title></head>
<body style="margin:0;padding:0;background:#f4f3ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f3ef;padding:24px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden">
  <tr><td style="background:${m.color};padding:22px 28px;border-bottom:4px solid ${m.acento}">
    <span style="color:#ffffff;font-size:15px;font-weight:600;letter-spacing:.02em">${escapar(m.nombre)}</span>
  </td></tr>
  <tr><td style="padding:30px 28px 8px">
    <h1 style="margin:0 0 12px;font-size:24px;line-height:1.25;color:#111">${escapar(c.titulo)}</h1>
    <p style="margin:0 0 18px;font-size:16px;line-height:1.55;color:#333">${escapar(c.intro)}</p>
    ${c.folio ? `<p style="margin:0 0 18px;font-size:14px;color:#666">Folio: <strong style="color:#111;font-family:Menlo,Consolas,monospace">${escapar(c.folio)}</strong></p>` : ""}
    ${filas ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 6px">${filas}</table>` : ""}
    ${c.total ? `<p style="margin:10px 0 22px;font-size:17px;color:#111;text-align:right">Total pagado: <strong>${escapar(c.total)}</strong></p>` : ""}
    ${c.extraHtml ?? ""}
    ${
      c.boton
        ? `<p style="margin:24px 0"><a href="${escapar(c.boton.url)}" style="display:inline-block;background:${m.color};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:13px 22px;border-radius:999px">${escapar(c.boton.texto)}</a></p>`
        : ""
    }
    ${c.nota ? `<p style="margin:0 0 22px;font-size:14px;line-height:1.55;color:#555">${escapar(c.nota)}</p>` : ""}
  </td></tr>
  <tr><td style="padding:18px 28px 26px;border-top:1px solid #ececec;font-size:12px;line-height:1.6;color:#888">
    ${escapar(m.pie)}<br>
    Dudas: ${escapar(CONTACTO.email)} · WhatsApp ${escapar(CONTACTO.phoneDisplay)}
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

/** Versión en texto plano del mismo mensaje, para clientes sin HTML y filtros. */
export function textoPlano(marca: Marca, c: {
  titulo: string;
  intro: string;
  folio?: string;
  filas?: Fila[];
  total?: string;
  extra?: string;
  boton?: { texto: string; url: string };
  nota?: string;
}): string {
  return [
    MARCAS[marca].nombre,
    "",
    c.titulo,
    "",
    c.intro,
    c.folio ? `\nFolio: ${c.folio}` : "",
    ...(c.filas ?? []).map((f) => `- ${f.concepto}${f.importe ? `: ${f.importe}` : ""}`),
    c.total ? `\nTotal pagado: ${c.total}` : "",
    c.extra ? `\n${c.extra}` : "",
    c.boton ? `\n${c.boton.texto}: ${c.boton.url}` : "",
    c.nota ? `\n${c.nota}` : "",
    "",
    `Dudas: ${CONTACTO.email} · WhatsApp ${CONTACTO.phoneDisplay}`,
  ]
    .filter((l) => l !== "")
    .join("\n");
}
