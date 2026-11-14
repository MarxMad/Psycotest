import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getReadyDb } from "@/db/index";
import { liveClasses, users } from "@/db/schema";
import { recordJoin, recordLeave } from "@/lib/live-classes";
import { leerAviso, leerSala, livekitConfigurado, urlDeGrabacion } from "@/lib/livekit";

/**
 * Avisos del servidor de LiveKit.
 *
 * Es la fuente de verdad de la asistencia: el servidor de video sabe quién
 * entró y salió aunque el navegador se cierre de golpe o se quede sin red, y
 * el aviso viene firmado, así que no se puede fabricar desde fuera.
 *
 * En LiveKit Cloud: Settings → Webhooks → https://TU-DOMINIO/api/livekit/webhook
 */
export async function POST(request: Request) {
  if (!livekitConfigurado()) {
    return NextResponse.json({ error: "LiveKit no configurado" }, { status: 503 });
  }

  const cuerpo = await request.text();
  let aviso;
  try {
    aviso = await leerAviso(cuerpo, request.headers.get("authorization"));
  } catch {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  const sala = aviso.room?.name ?? aviso.egressInfo?.roomName ?? "";
  const destino = leerSala(sala);
  // Salas que no son de una clase (pruebas, otras apps del mismo servidor).
  if (!destino) return NextResponse.json({ ok: true, ignorado: true });

  const { liveClassId } = destino;
  let identidad = aviso.participant?.identity;

  // Solo se registra asistencia de usuarios de la plataforma; un grabador o
  // una conexión de prueba no son alumnos.
  if (identidad) {
    const db = await getReadyDb();
    const [existe] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, identidad))
      .limit(1);
    if (!existe) identidad = undefined;
  }

  try {
    switch (aviso.event) {
      case "participant_joined": {
        if (!identidad) break;
        await recordJoin(liveClassId, identidad);

        // La clase empieza cuando entra quien la dirige, no al llegar el
        // primer alumno temprano.
        if (aviso.participant?.attributes?.rol === "anfitrion" && !destino.breakoutRoomId) {
          const db = await getReadyDb();
          const [clase] = await db
            .select({ status: liveClasses.status })
            .from(liveClasses)
            .where(eq(liveClasses.id, liveClassId));
          if (clase?.status === "scheduled") {
            await db
              .update(liveClasses)
              .set({ status: "live" })
              .where(eq(liveClasses.id, liveClassId));
          }
        }
        break;
      }

      case "participant_left": {
        // Pasar de la sala principal a la de división también llega como
        // salida; la entrada a la otra sala reabre la misma fila enseguida.
        if (identidad) await recordLeave(liveClassId, identidad);
        break;
      }

      case "egress_ended": {
        const archivo = aviso.egressInfo?.fileResults?.[0];
        const url = archivo ? urlDeGrabacion(archivo) : null;
        if (url) {
          const db = await getReadyDb();
          await db
            .update(liveClasses)
            .set({ recordingUrl: url })
            .where(eq(liveClasses.id, liveClassId));
        }
        break;
      }
    }
  } catch (error) {
    // Una identidad que no es usuario nuestro (p. ej. un grabador) no debe
    // tumbar el aviso: se registra y se responde bien para que no reintente.
    console.error("[livekit webhook]", aviso.event, error);
  }

  return NextResponse.json({ ok: true });
}
