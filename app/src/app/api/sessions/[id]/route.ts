import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { logAudit, requireStaff, requireUser } from "@/lib/auth";
import { getSession, saveSession } from "@/lib/session-store";
import { procesarSesion } from "@/lib/procesar-sesion";
import { comoRespuestas, limpiarParte, resumirSocioeconomico } from "@/lib/socioeconomico";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireStaff();
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const row = await getSession(id);
  if (!row) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  return NextResponse.json({ session: row });
}

export async function PATCH(request: Request, { params }: Params) {
  let user;
  try {
    user = await requireUser(["admin", "psicologo"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getSession(id);
  if (!existing) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  const body = (await request.json()) as {
    notasPsicologo?: string;
    interpretacion?: string;
    aprobada?: boolean;
    jobProfileId?: string | null;
    /** Estudio socioeconómico: la parte del investigador, completa. */
    investigacion?: unknown;
  };

  const aprobada = body.aprobada ?? existing.aprobada;

  // El investigador guarda su parte del estudio: se limpia, se combina con lo
  // del candidato y se recalculan resumen e interpretación.
  let respuestas = existing.respuestas;
  let calificacion = existing.calificacion;
  let interpretacion = body.interpretacion ?? existing.interpretacion ?? undefined;
  let estado: "borrador" | "calificada" | "aprobada" =
    aprobada ? "aprobada" : existing.estado === "borrador" ? "borrador" : "calificada";

  if (existing.instrumento === "socioeconomico") {
    if (body.investigacion !== undefined) {
      respuestas = {
        ...comoRespuestas(existing.respuestas),
        investigador: limpiarParte("investigador", body.investigacion),
      };
      const procesada = procesarSesion("socioeconomico", respuestas, existing.participantNombre);
      calificacion = procesada.calificacion;
      interpretacion = body.interpretacion ?? procesada.interpretacion;
    }
    // Queda «calificada» (lista para validar) cuando el investigador completó todo,
    // dictamen incluido. Antes no se valida: el informe diría «investigación en curso».
    const { pendientesValidar } = resumirSocioeconomico(comoRespuestas(respuestas));
    const listo = pendientesValidar.length === 0;
    if (aprobada && !listo) {
      return NextResponse.json(
        { error: `Completa la investigación antes de validar. Falta: ${pendientesValidar.join(", ")}.` },
        { status: 400 },
      );
    }
    estado = aprobada ? "aprobada" : listo ? "calificada" : "borrador";
  }
  const row = await saveSession({
    id: existing.id,
    instrumento: existing.instrumento,
    participantNombre: existing.participantNombre,
    participantId: existing.participantId ?? undefined,
    jobProfileId:
      body.jobProfileId !== undefined ? body.jobProfileId : existing.jobProfileId,
    puesto: existing.puesto ?? undefined,
    empresa: existing.empresa ?? undefined,
    respuestas,
    calificacion,
    interpretacion,
    notasPsicologo: body.notasPsicologo ?? existing.notasPsicologo ?? undefined,
    aprobada,
    estado,
    createdById: existing.createdById ?? undefined,
    accessCodeId: existing.accessCodeId ?? undefined,
    accessRedemptionId: existing.accessRedemptionId ?? undefined,
    iniciada: existing.iniciada,
    terminada: existing.terminada,
  });

  if (aprobada) {
    const db = getDb();
    await db
      .update(schema.assessmentSessions)
      .set({ approvedById: user.id })
      .where(eq(schema.assessmentSessions.id, id));
    await logAudit(user.id, "approve", "assessment_session", id);
  } else {
    // La auditoría no copia el expediente: son datos personales y sensibles.
    const { investigacion, ...resto } = body;
    await logAudit(user.id, "update", "assessment_session", id, {
      ...resto,
      ...(investigacion !== undefined ? { investigacion: "actualizada" } : {}),
    });
  }

  return NextResponse.json({ session: row });
}

export async function DELETE(_request: Request, { params }: Params) {
  let user;
  try {
    user = await requireUser(["admin"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();
  await db.delete(schema.assessmentSessions).where(eq(schema.assessmentSessions.id, id));
  await logAudit(user.id, "delete", "assessment_session", id);
  return NextResponse.json({ ok: true });
}
