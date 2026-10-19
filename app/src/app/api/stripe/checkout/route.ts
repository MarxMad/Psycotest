import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { crearPedidoDeCurso, crearSesionDePago, origenDe } from "@/lib/pagos";
import { isStripeConfigured } from "@/lib/stripe";

/**
 * Abre el pago de un pedido.
 *
 * Acepta un pedido ya creado (el carrito de diplomados) o el slug de un curso
 * del catálogo, en cuyo caso crea el pedido primero. En los dos casos el
 * importe sale de la base de datos, nunca de lo que mande el navegador.
 */
export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "El cobro con tarjeta no está configurado." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    pedidoId?: string;
    courseSlug?: string;
  };

  const origen = origenDe(request);
  const usuario = await getSessionUser();

  if (body.courseSlug) {
    if (!usuario) {
      return NextResponse.json({ error: "Inicia sesión para comprar." }, { status: 401 });
    }
    const pedido = await crearPedidoDeCurso(usuario.id, body.courseSlug);
    if (!pedido.ok) {
      return NextResponse.json({ error: pedido.error }, { status: pedido.status });
    }
    const sesion = await crearSesionDePago({
      pedidoId: pedido.pedidoId,
      origen,
      email: usuario.email,
      cancelarEn: `/cursos/${body.courseSlug}`,
    });
    return sesion.ok
      ? NextResponse.json({ url: sesion.url })
      : NextResponse.json({ error: sesion.error }, { status: sesion.status });
  }

  if (!body.pedidoId) {
    return NextResponse.json({ error: "Falta el pedido." }, { status: 400 });
  }

  const sesion = await crearSesionDePago({
    pedidoId: body.pedidoId,
    origen,
    email: usuario?.email,
  });
  return sesion.ok
    ? NextResponse.json({ url: sesion.url })
    : NextResponse.json({ error: sesion.error }, { status: sesion.status });
}
