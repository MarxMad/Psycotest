import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getReadyDb } from "@/db/index";
import { liveClasses } from "@/db/schema";
import { getSessionUser, requireUser } from "@/lib/auth";
import {
  authErrorResponse,
  canTransitionStatus,
  cursosDelProfesor,
  dirigeLaClase,
  listAttendances,
  userCanAccessLiveClass,
} from "@/lib/live-classes";
import { closeAllBreakouts, listBreakouts } from "@/lib/live-breakouts";
import { cerrarSala, salaDeClase } from "@/lib/livekit";

/** Saca a todos de la sala principal y de las de división. */
async function cerrarSalasDe(liveClassId: string) {
  const division = await listBreakouts(liveClassId);
  await Promise.all([
    cerrarSala(salaDeClase(liveClassId)),
    ...division.map((b) => cerrarSala(salaDeClase(liveClassId, b.id))),
  ]);
  if (division.some((b) => b.status === "open")) await closeAllBreakouts(liveClassId);
}

export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const db = await getReadyDb();
    const params = await props.params;
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const [liveClass] = await db.select().from(liveClasses).where(eq(liveClasses.id, params.id));

    if (!liveClass) {
      return NextResponse.json({ error: "Clase no encontrada" }, { status: 404 });
    }

    const allowed = await userCanAccessLiveClass(user, liveClass);
    if (!allowed) {
      return NextResponse.json({ error: "Sin acceso a esta clase" }, { status: 403 });
    }

    const attendances = (await dirigeLaClase(user, liveClass))
      ? await listAttendances(liveClass.id)
      : undefined;

    return NextResponse.json({
      liveClass,
      attendances,
    });
  } catch (error) {
    console.error("Error fetching live class:", error);
    return NextResponse.json({ error: "Error al cargar clase" }, { status: 500 });
  }
}

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    let host;
    try {
      host = await requireUser(["admin", "profesor"]);
    } catch (error) {
      const { error: msg, status: code } = authErrorResponse(error);
      return NextResponse.json({ error: msg }, { status: code });
    }

    const db = await getReadyDb();
    const params = await props.params;
    const body = await request.json();

    const [existing] = await db.select().from(liveClasses).where(eq(liveClasses.id, params.id));
    if (!existing) {
      return NextResponse.json({ error: "Clase no encontrada" }, { status: 404 });
    }
    if (!(await dirigeLaClase(host, existing))) {
      return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
    }
    // El profesor no puede mover la clase a un curso que no es suyo.
    if (host.rol === "profesor" && body.courseId !== undefined) {
      if (!body.courseId || !(await cursosDelProfesor(host.id)).includes(body.courseId)) {
        return NextResponse.json(
          { error: "Elige uno de los cursos que tienes asignados" },
          { status: 403 },
        );
      }
    }

    const updates: Partial<typeof liveClasses.$inferInsert> = {};

    if (typeof body.title === "string" && body.title.trim()) {
      updates.title = body.title.trim();
    }
    if (body.scheduledAt) {
      const scheduled = new Date(body.scheduledAt);
      if (Number.isNaN(scheduled.getTime())) {
        return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
      }
      updates.scheduledAt = scheduled.toISOString();
    }
    if (body.durationMinutes != null) {
      const duration = Number(body.durationMinutes);
      if (!Number.isFinite(duration) || duration < 15) {
        return NextResponse.json(
          { error: "Duración mínima de 15 minutos" },
          { status: 400 },
        );
      }
      updates.durationMinutes = duration;
    }
    if (body.courseId !== undefined) {
      updates.courseId = body.courseId || null;
    }
    if (body.recordingUrl !== undefined) {
      updates.recordingUrl = body.recordingUrl || null;
    }
    if (body.status) {
      if (
        body.status !== "scheduled" &&
        body.status !== "live" &&
        body.status !== "completed" &&
        body.status !== "cancelled"
      ) {
        return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
      }
      if (!canTransitionStatus(existing.status, body.status)) {
        return NextResponse.json(
          { error: `No se puede pasar de ${existing.status} a ${body.status}` },
          { status: 400 },
        );
      }
      updates.status = body.status;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ liveClass: existing });
    }

    await db.update(liveClasses).set(updates).where(eq(liveClasses.id, params.id));

    // Terminar o cancelar la clase la cierra para todos, también las salas de
    // división: nadie se queda conectado a una clase que ya acabó.
    if (updates.status === "completed" || updates.status === "cancelled") {
      await cerrarSalasDe(params.id).catch((e) => console.error("cerrar salas:", e));
    }

    const [liveClass] = await db.select().from(liveClasses).where(eq(liveClasses.id, params.id));

    return NextResponse.json({ liveClass });
  } catch (error) {
    console.error("Error updating live class:", error);
    return NextResponse.json({ error: "Error al actualizar clase" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    let host;
    try {
      host = await requireUser(["admin", "profesor"]);
    } catch (error) {
      const { error: msg, status: code } = authErrorResponse(error);
      return NextResponse.json({ error: msg }, { status: code });
    }

    const db = await getReadyDb();
    const params = await props.params;
    const [existing] = await db.select().from(liveClasses).where(eq(liveClasses.id, params.id));
    if (!existing) {
      return NextResponse.json({ error: "Clase no encontrada" }, { status: 404 });
    }
    if (!(await dirigeLaClase(host, existing))) {
      return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
    }
    await cerrarSalasDe(params.id).catch((e) => console.error("cerrar salas:", e));
    await db.delete(liveClasses).where(eq(liveClasses.id, params.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting live class:", error);
    return NextResponse.json({ error: "Error al eliminar clase" }, { status: 500 });
  }
}
