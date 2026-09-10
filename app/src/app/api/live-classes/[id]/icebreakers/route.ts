import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getReadyDb } from "@/db/index";
import { liveClasses } from "@/db/schema";
import { getSessionUser, requireUser } from "@/lib/auth";
import { authErrorResponse, userCanAccessLiveClass } from "@/lib/live-classes";
import {
  closeIcebreaker,
  getActiveIcebreaker,
  listIcebreakers,
  startIcebreaker,
  submitIcebreakerResponse,
} from "@/lib/live-icebreakers";

export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const db = await getReadyDb();
    const params = await props.params;
    const [liveClass] = await db.select().from(liveClasses).where(eq(liveClasses.id, params.id));
    if (!liveClass) return NextResponse.json({ error: "Clase no encontrada" }, { status: 404 });

    const allowed = await userCanAccessLiveClass(user, liveClass);
    if (!allowed) return NextResponse.json({ error: "Sin acceso" }, { status: 403 });

    const active = await getActiveIcebreaker(liveClass.id);
    const sessions = user.rol === "admin" ? await listIcebreakers(liveClass.id) : undefined;
    return NextResponse.json({ active, sessions });
  } catch (error) {
    console.error("icebreakers GET:", error);
    return NextResponse.json({ error: "Error al cargar dinámicas" }, { status: 500 });
  }
}

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const db = await getReadyDb();
    const params = await props.params;
    const [liveClass] = await db.select().from(liveClasses).where(eq(liveClasses.id, params.id));
    if (!liveClass) return NextResponse.json({ error: "Clase no encontrada" }, { status: 404 });

    const allowed = await userCanAccessLiveClass(user, liveClass);
    if (!allowed) return NextResponse.json({ error: "Sin acceso" }, { status: 403 });

    const body = await request.json();
    const action = body.action || "start";

    if (action === "respond") {
      if (!body.sessionId || !body.text) {
        return NextResponse.json({ error: "Faltan sessionId o text" }, { status: 400 });
      }
      const session = await submitIcebreakerResponse(
        body.sessionId,
        user.id,
        user.nombre,
        String(body.text),
        body.extra,
      );
      if (!session) return NextResponse.json({ error: "Sesión no activa" }, { status: 400 });
      return NextResponse.json({ session });
    }

    if (action === "close") {
      await requireUser(["admin"]);
      if (!body.sessionId) {
        return NextResponse.json({ error: "Falta sessionId" }, { status: 400 });
      }
      const session = await closeIcebreaker(body.sessionId);
      return NextResponse.json({ session });
    }

    await requireUser(["admin"]);
    const type = body.type || "pregunta_rapida";
    if (!["pregunta_rapida", "dos_verdades", "asociacion"].includes(type)) {
      return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
    }
    const session = await startIcebreaker({
      liveClassId: liveClass.id,
      type,
      prompt: body.prompt,
      userId: user.id,
    });
    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    const auth = authErrorResponse(error);
    if (auth.status === 401 || auth.status === 403) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    console.error("icebreakers POST:", error);
    return NextResponse.json({ error: "Error en dinámicas" }, { status: 500 });
  }
}
