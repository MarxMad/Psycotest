import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getReadyDb } from "@/db/index";
import { liveClasses } from "@/db/schema";
import { getSessionUser, requireUser } from "@/lib/auth";
import { authErrorResponse, userCanAccessLiveClass } from "@/lib/live-classes";
import {
  assignUser,
  closeAllBreakouts,
  createBreakouts,
  getAssignmentForUser,
  listBreakouts,
} from "@/lib/live-breakouts";

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

    const breakouts = await listBreakouts(liveClass.id);
    const mine = user.rol === "admin" ? null : await getAssignmentForUser(liveClass.id, user.id);
    return NextResponse.json({ breakouts, mine });
  } catch (error) {
    console.error("breakouts GET:", error);
    return NextResponse.json({ error: "Error al listar breakouts" }, { status: 500 });
  }
}

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    await requireUser(["admin"]);
    const db = await getReadyDb();
    const params = await props.params;
    const [liveClass] = await db.select().from(liveClasses).where(eq(liveClasses.id, params.id));
    if (!liveClass) return NextResponse.json({ error: "Clase no encontrada" }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const action = body.action || "create";

    if (action === "close") {
      const breakouts = await closeAllBreakouts(liveClass.id);
      return NextResponse.json({ breakouts });
    }

    if (action === "assign") {
      if (!body.breakoutRoomId || !body.userId) {
        return NextResponse.json({ error: "Faltan breakoutRoomId o userId" }, { status: 400 });
      }
      const breakouts = await assignUser(body.breakoutRoomId, body.userId);
      return NextResponse.json({ breakouts });
    }

    const breakouts = await createBreakouts(liveClass.id, {
      count: body.count,
      names: body.names,
      autoAssign: body.autoAssign !== false,
    });
    return NextResponse.json({ breakouts }, { status: 201 });
  } catch (error) {
    const auth = authErrorResponse(error);
    if (auth.status === 401 || auth.status === 403) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    console.error("breakouts POST:", error);
    return NextResponse.json({ error: "Error en breakouts" }, { status: 500 });
  }
}
