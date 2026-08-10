import { NextResponse } from "next/server";
import type { Instrumento } from "@/lib/storage";
import { getSessionUser, logAudit, requireUser } from "@/lib/auth";
import { listSessions, saveSession } from "@/lib/session-store";

export async function GET(request: Request) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const instrumento = url.searchParams.get("instrumento") as Instrumento | null;
  const rows = await listSessions(instrumento ?? undefined);
  return NextResponse.json({ sessions: rows });
}

export async function POST(request: Request) {
  let user;
  try {
    user = await requireUser(["admin", "psicologo", "aplicador"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const row = await saveSession({
    ...body,
    createdById: user.id,
  });

  await logAudit(user.id, "save", "assessment_session", body.id, {
    instrumento: body.instrumento,
    estado: row.estado,
  });

  return NextResponse.json({ session: row }, { status: 201 });
}
