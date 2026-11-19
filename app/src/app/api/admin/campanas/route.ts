import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import {
  AUDIENCIAS,
  destinatarios,
  enviarCampana,
  enviarPrueba,
  esAudiencia,
  historial,
  validarCampana,
  vistaPrevia,
} from "@/lib/campanas";
import { correoConfigurado } from "@/lib/correo";
import { esMarcaCobro } from "@/lib/stripe";

/** Una campaña grande tarda: se manda en lotes de 100 con pausas. */
export const maxDuration = 300;

async function admin() {
  try {
    return await requireUser(["admin"]);
  } catch {
    return null;
  }
}

/**
 * GET                       historial de campañas
 * GET ?marca=x&audiencia=y  cuántas personas recibirían la campaña
 */
export async function GET(request: Request) {
  if (!(await admin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const q = new URL(request.url).searchParams;
  const marca = q.get("marca");
  const audiencia = q.get("audiencia");
  try {
    if (marca || audiencia) {
      if (!esMarcaCobro(marca) || !esAudiencia(audiencia)) {
        return NextResponse.json({ error: "Marca o audiencia no válida" }, { status: 400 });
      }
      const lista = await destinatarios(marca, audiencia);
      return NextResponse.json({ total: lista.length });
    }
    return NextResponse.json({
      campanas: await historial(),
      audiencias: AUDIENCIAS,
      correoConfigurado: correoConfigurado(),
    });
  } catch (error) {
    console.error("[api/admin/campanas] GET", error);
    return NextResponse.json({ error: "No se pudieron cargar las campañas" }, { status: 500 });
  }
}

/**
 * POST { accion: "vista" | "prueba" | "enviar", ...campaña }
 *   vista   devuelve el HTML del correo
 *   prueba  lo manda solo al admin que lo está armando
 *   enviar  lo manda a toda la audiencia
 */
export async function POST(request: Request) {
  const usuario = await admin();
  if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const v = await validarCampana(body);
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });

  try {
    if (body.accion === "vista") {
      return NextResponse.json({ html: vistaPrevia(v.datos) });
    }
    if (!correoConfigurado()) {
      return NextResponse.json({ error: "Falta RESEND_API_KEY: el correo no está configurado." }, { status: 503 });
    }
    if (body.accion === "prueba") {
      const r = await enviarPrueba(v.datos, { email: usuario.email, nombre: usuario.nombre });
      return r.ok
        ? NextResponse.json({ enviadoA: usuario.email })
        : NextResponse.json({ error: r.error }, { status: 502 });
    }
    if (body.accion === "enviar") {
      if (body.confirmar !== true) {
        return NextResponse.json({ error: "Falta confirmar el envío." }, { status: 400 });
      }
      const r = await enviarCampana(v.datos, usuario);
      return NextResponse.json(r);
    }
    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error) {
    console.error("[api/admin/campanas] POST", error);
    return NextResponse.json({ error: "No se pudo completar el envío" }, { status: 500 });
  }
}
