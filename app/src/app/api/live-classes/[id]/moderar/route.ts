import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getReadyDb } from "@/db/index";
import { liveClasses } from "@/db/schema";
import { getSessionUser, logAudit } from "@/lib/auth";
import { listBreakouts } from "@/lib/live-breakouts";
import { dirigeLaClase } from "@/lib/live-classes";
import { bajarMano, sacarDeSala, salaDeClase, silenciar } from "@/lib/livekit";

type Accion = "silenciar" | "silenciar-todos" | "sacar" | "bajar-mano";

/**
 * Moderación de la sala, solo para quien dirige la clase.
 *
 * Body: `{ accion, identidad?, breakoutRoomId? }`. La identidad es el id de
 * usuario de la persona; sin `breakoutRoomId` se actúa en la sala principal.
 */
export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const db = await getReadyDb();
  const { id } = await props.params;
  const [liveClass] = await db.select().from(liveClasses).where(eq(liveClasses.id, id));
  if (!liveClass) return NextResponse.json({ error: "Clase no encontrada" }, { status: 404 });
  if (!(await dirigeLaClase(user, liveClass))) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    accion?: Accion;
    identidad?: string;
    breakoutRoomId?: string;
  };

  if (body.breakoutRoomId) {
    const existe = (await listBreakouts(id)).some((b) => b.id === body.breakoutRoomId);
    if (!existe) return NextResponse.json({ error: "Sala no encontrada" }, { status: 404 });
  }
  const sala = salaDeClase(id, body.breakoutRoomId);
  const quien = body.identidad?.trim();

  try {
    switch (body.accion) {
      case "silenciar-todos":
        await silenciar(sala);
        break;
      case "silenciar":
        if (!quien) return NextResponse.json({ error: "Falta identidad" }, { status: 400 });
        await silenciar(sala, quien);
        break;
      case "sacar":
        if (!quien) return NextResponse.json({ error: "Falta identidad" }, { status: 400 });
        if (quien === user.id) {
          return NextResponse.json({ error: "No puedes sacarte a ti mismo" }, { status: 400 });
        }
        await sacarDeSala(sala, quien);
        await logAudit(user.id, "remove_participant", "live_class", id, { identidad: quien });
        break;
      case "bajar-mano":
        if (!quien) return NextResponse.json({ error: "Falta identidad" }, { status: 400 });
        await bajarMano(sala, quien);
        break;
      default:
        return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("moderar:", error);
    return NextResponse.json({ error: "No se pudo aplicar la acción" }, { status: 502 });
  }
}
