import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getReadyDb } from "@/db/index";
import { liveClasses } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { userCanAccessLiveClass } from "@/lib/live-classes";
import { recordHeartbeat } from "@/lib/live-presence";

export async function POST(_request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const db = await getReadyDb();
    const params = await props.params;
    const [liveClass] = await db.select().from(liveClasses).where(eq(liveClasses.id, params.id));
    if (!liveClass) return NextResponse.json({ error: "Clase no encontrada" }, { status: 404 });

    const allowed = await userCanAccessLiveClass(user, liveClass);
    if (!allowed) return NextResponse.json({ error: "Sin acceso" }, { status: 403 });

    const attendance = await recordHeartbeat(liveClass.id, user.id);
    return NextResponse.json({ attendance });
  } catch (error) {
    console.error("heartbeat error:", error);
    return NextResponse.json({ error: "Error en heartbeat" }, { status: 500 });
  }
}
