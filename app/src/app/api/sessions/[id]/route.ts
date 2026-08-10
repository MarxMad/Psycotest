import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { logAudit, requireUser } from "@/lib/auth";
import { getSession, saveSession } from "@/lib/session-store";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireUser();
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
  };

  const aprobada = body.aprobada ?? existing.aprobada;
  const row = await saveSession({
    id: existing.id,
    instrumento: existing.instrumento,
    participantNombre: existing.participantNombre,
    participantId: existing.participantId ?? undefined,
    puesto: existing.puesto ?? undefined,
    empresa: existing.empresa ?? undefined,
    respuestas: existing.respuestas,
    calificacion: existing.calificacion,
    interpretacion: body.interpretacion ?? existing.interpretacion ?? undefined,
    notasPsicologo: body.notasPsicologo ?? existing.notasPsicologo ?? undefined,
    aprobada,
    estado: aprobada ? "aprobada" : existing.estado === "borrador" ? "borrador" : "calificada",
    createdById: existing.createdById ?? undefined,
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
    await logAudit(user.id, "update", "assessment_session", id, body);
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
