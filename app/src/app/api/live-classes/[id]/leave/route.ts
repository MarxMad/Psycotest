import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/index";
import { liveClasses } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { recordLeave, userCanAccessLiveClass } from "@/lib/live-classes";

const db = getDb();

export async function POST(_request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const params = await props.params;
    const [liveClass] = await db.select().from(liveClasses).where(eq(liveClasses.id, params.id));
    if (!liveClass) {
      return NextResponse.json({ error: "Clase no encontrada" }, { status: 404 });
    }

    const allowed = await userCanAccessLiveClass(user, liveClass);
    if (!allowed) {
      return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
    }

    const attendance = await recordLeave(liveClass.id, user.id);
    return NextResponse.json({ attendance });
  } catch (error) {
    console.error("Error leaving live class:", error);
    return NextResponse.json({ error: "Error al registrar salida" }, { status: 500 });
  }
}
