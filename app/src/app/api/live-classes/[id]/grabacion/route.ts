import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getReadyDb } from "@/db/index";
import { liveClasses } from "@/db/schema";
import { getSessionUser, logAudit } from "@/lib/auth";
import { dirigeLaClase } from "@/lib/live-classes";
import {
  detenerGrabacion,
  grabacionActiva,
  grabacionConfigurada,
  iniciarGrabacion,
  salaDeClase,
} from "@/lib/livekit";

async function anfitrionDe(props: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return { error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  const db = await getReadyDb();
  const { id } = await props.params;
  const [liveClass] = await db.select().from(liveClasses).where(eq(liveClasses.id, id));
  if (!liveClass) {
    return { error: NextResponse.json({ error: "Clase no encontrada" }, { status: 404 }) };
  }
  if (!(await dirigeLaClase(user, liveClass))) {
    return { error: NextResponse.json({ error: "Sin permiso" }, { status: 403 }) };
  }
  return { user, liveClass };
}

/** ¿Se está grabando la sala principal? */
export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
  const r = await anfitrionDe(props);
  if ("error" in r) return r.error;
  const activa = await grabacionActiva(salaDeClase(r.liveClass.id));
  return NextResponse.json({ disponible: grabacionConfigurada(), grabando: Boolean(activa) });
}

/** Body: `{ accion: "iniciar" | "detener" }`. */
export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const r = await anfitrionDe(props);
  if ("error" in r) return r.error;

  if (!grabacionConfigurada()) {
    return NextResponse.json(
      { error: "La grabación no está configurada: falta el almacenamiento de archivos." },
      { status: 503 },
    );
  }

  const { accion } = (await request.json().catch(() => ({}))) as { accion?: string };
  const sala = salaDeClase(r.liveClass.id);

  try {
    const activa = await grabacionActiva(sala);
    if (accion === "iniciar") {
      if (activa) return NextResponse.json({ grabando: true });
      await iniciarGrabacion(sala, r.liveClass.id);
      await logAudit(r.user.id, "start_recording", "live_class", r.liveClass.id);
      return NextResponse.json({ grabando: true });
    }
    if (accion === "detener") {
      // El enlace al archivo llega por el aviso `egress_ended` del servidor.
      if (activa) await detenerGrabacion(activa);
      return NextResponse.json({ grabando: false });
    }
    return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  } catch (error) {
    console.error("grabacion:", error);
    return NextResponse.json(
      { error: "El servidor de video no pudo cambiar la grabación." },
      { status: 502 },
    );
  }
}
