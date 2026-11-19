import { NextResponse } from "next/server";
import { darDeBaja, firmaValida } from "@/lib/campanas";
import { esMarcaCobro } from "@/lib/stripe";

/**
 * Baja de promociones.
 *
 * La llaman dos cosas: Gmail/Outlook con «Cancelar suscripción» (baja en un
 * clic, RFC 8058: POST con los datos en la URL) y el botón de la página
 * /baja. Solo POST: un GET lo dispararían los antivirus que abren enlaces.
 * El enlace va firmado, así que nadie puede dar de baja a otra persona.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  let e = url.searchParams.get("e") ?? "";
  let m = url.searchParams.get("m") ?? "";
  let t = url.searchParams.get("t") ?? "";
  let todas = false;

  const tipo = request.headers.get("content-type") ?? "";
  if (tipo.includes("application/json")) {
    const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    e = typeof b.e === "string" ? b.e : e;
    m = typeof b.m === "string" ? b.m : m;
    t = typeof b.t === "string" ? b.t : t;
    todas = b.todas === true;
  }

  if (!e || !esMarcaCobro(m) || !t || !firmaValida(e, m, t)) {
    return NextResponse.json({ error: "Enlace no válido" }, { status: 400 });
  }

  try {
    await darDeBaja(e, todas ? "todas" : m);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/correo/baja]", error);
    return NextResponse.json({ error: "No se pudo registrar la baja" }, { status: 500 });
  }
}
