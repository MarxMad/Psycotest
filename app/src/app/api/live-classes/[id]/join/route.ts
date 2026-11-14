import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getReadyDb } from "@/db/index";
import { liveClasses } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { getAssignmentForUser, listBreakouts } from "@/lib/live-breakouts";
import {
  dirigeLaClase,
  isWithinJoinWindow,
  recordJoin,
  referenciaDeSala,
  userCanAccessLiveClass,
} from "@/lib/live-classes";
import { crearPase, grabacionConfigurada, livekitConfigurado, salaDeClase } from "@/lib/livekit";

/**
 * Pase de entrada a la sala de una clase.
 *
 * Body opcional: `{ breakoutRoomId }` para entrar a una sala de división. El
 * alumno solo entra a la suya; quien dirige la clase, a cualquiera.
 */
export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!livekitConfigurado()) {
      return NextResponse.json(
        {
          error:
            "Las clases en vivo no están configuradas todavía. Falta conectar el servidor de video (LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET).",
          code: "LIVEKIT_NO_CONFIGURADO",
        },
        { status: 503 },
      );
    }

    const db = await getReadyDb();
    const params = await props.params;
    const [liveClass] = await db.select().from(liveClasses).where(eq(liveClasses.id, params.id));
    if (!liveClass) {
      return NextResponse.json({ error: "Clase no encontrada" }, { status: 404 });
    }

    const allowed = await userCanAccessLiveClass(user, liveClass);
    if (!allowed) {
      return NextResponse.json({ error: "Debes estar inscrito en el curso" }, { status: 403 });
    }

    const anfitrion = await dirigeLaClase(user, liveClass);

    if (liveClass.status === "cancelled") {
      return NextResponse.json({ error: "Esta clase fue cancelada." }, { status: 403 });
    }
    // Quien lleva la clase puede abrir la sala antes, para prepararla.
    if (!isWithinJoinWindow(liveClass) && !anfitrion) {
      return NextResponse.json(
        {
          error:
            liveClass.status === "completed"
              ? "Esta clase ya terminó."
              : "La sala aún no está disponible. Vuelve cerca de la hora programada.",
        },
        { status: 403 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as { breakoutRoomId?: string };
    let breakout: { id: string; name: string } | null = null;

    if (body.breakoutRoomId) {
      const salas = await listBreakouts(liveClass.id);
      const sala = salas.find((b) => b.id === body.breakoutRoomId && b.status === "open");
      if (!sala) {
        return NextResponse.json({ error: "Esa sala de división ya se cerró." }, { status: 404 });
      }
      if (!anfitrion) {
        const mia = await getAssignmentForUser(liveClass.id, user.id);
        if (!mia || mia.id !== sala.id) {
          return NextResponse.json({ error: "No estás asignado a esa sala." }, { status: 403 });
        }
      }
      breakout = { id: sala.id, name: sala.name };
    }

    const sala = salaDeClase(liveClass.id, breakout?.id);
    const pase = await crearPase({
      user,
      sala,
      rol: anfitrion ? "anfitrion" : "alumno",
      enDivision: Boolean(breakout),
    });

    // Deja constancia de la sala en la clase (las anteriores eran de Jitsi).
    const referencia = referenciaDeSala(liveClass.id);
    if (liveClass.provider !== "livekit" || liveClass.roomUrl !== referencia) {
      await db
        .update(liveClasses)
        .set({ provider: "livekit", roomUrl: referencia, dailyRoomUrl: null })
        .where(eq(liveClasses.id, liveClass.id));
    }

    const attendance = await recordJoin(liveClass.id, user.id);

    return NextResponse.json({
      ...pase,
      sala,
      breakout,
      anfitrion,
      puedeGrabar: anfitrion && grabacionConfigurada(),
      clase: {
        id: liveClass.id,
        title: liveClass.title,
        status: liveClass.status,
        scheduledAt: liveClass.scheduledAt,
        durationMinutes: liveClass.durationMinutes,
      },
      user: { id: user.id, nombre: user.nombre },
      attendance,
    });
  } catch (error) {
    console.error("Error joining live class:", error);
    return NextResponse.json({ error: "Error al unirse a la sala" }, { status: 500 });
  }
}
