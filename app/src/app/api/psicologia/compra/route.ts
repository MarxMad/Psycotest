import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { origenDe } from "@/lib/pagos";
import { crearCompraPsicologia, estadoDeCompra } from "@/lib/pagos-psicologia";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/access-codes";

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Abre el pago de evaluaciones. El importe se recalcula aquí con el catálogo;
 * del navegador solo se toman las pruebas elegidas y el número de candidatos.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    pruebas?: unknown;
    candidatos?: unknown;
    modo?: unknown;
    nombre?: unknown;
    email?: unknown;
    empresa?: unknown;
  };

  const nombre = typeof body.nombre === "string" ? body.nombre.trim().slice(0, 120) : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 200) : "";
  const empresa = typeof body.empresa === "string" ? body.empresa.trim().slice(0, 160) : "";
  const pruebas = Array.isArray(body.pruebas) ? body.pruebas.filter((p): p is string => typeof p === "string") : [];
  const modo = body.modo === "persona" ? "persona" : "empresa";

  if (nombre.length < 3) return NextResponse.json({ error: "Escribe tu nombre completo." }, { status: 400 });
  if (!CORREO.test(email)) return NextResponse.json({ error: "Revisa tu correo: ahí llegan los códigos." }, { status: 400 });

  // Cada intento crea un pedido y una sesión de Stripe: se frena el abuso.
  const limite = rateLimit(`psico-compra:${clientIp(request)}`, 10, 10 * 60_000);
  if (!limite.ok) return NextResponse.json({ error: "Demasiados intentos. Espera unos minutos." }, { status: 429 });

  const usuario = await getSessionUser();
  const r = await crearCompraPsicologia({
    pruebas,
    candidatos: Number(body.candidatos) || 1,
    modo,
    nombre,
    email,
    empresa: modo === "empresa" ? empresa || null : null,
    origen: origenDe(request),
    sesionUsuarioId: usuario?.id ?? null,
  });
  return r.ok ? NextResponse.json({ url: r.url }) : NextResponse.json({ error: r.error }, { status: r.status });
}

/**
 * Estado de la compra para la página de vuelta. Se consulta por el id de la
 * sesión de Stripe, que no se puede adivinar; con él se ven los códigos, igual
 * que en el correo.
 */
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("session_id");
  if (!id || !id.startsWith("cs_")) return NextResponse.json({ error: "Falta la sesión." }, { status: 400 });
  try {
    const estado = await estadoDeCompra(id);
    if (!estado) return NextResponse.json({ error: "No encontramos esa compra." }, { status: 404 });
    return NextResponse.json(estado, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[api/psicologia/compra] estado:", error);
    return NextResponse.json({ error: "No encontramos esa compra." }, { status: 404 });
  }
}
