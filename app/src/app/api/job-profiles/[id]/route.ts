import { NextResponse } from "next/server";
import { logAudit, requireUser } from "@/lib/auth";
import {
  deleteJobProfile,
  getJobProfile,
  updateJobProfile,
} from "@/lib/job-profiles-store";
import type { RespuestasCleaverJob } from "@/lib/cleaver-job";
import { ITEMS_CLEAVER_JOB } from "@/lib/cleaver-job";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const profile = await getJobProfile(id);
  if (!profile) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json({ profile });
}

export async function PATCH(request: Request, { params }: Params) {
  let user;
  try {
    user = await requireUser(["admin", "psicologo"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as {
    titulo?: string;
    empresa?: string | null;
    respuestasCleaver?: RespuestasCleaverJob;
    jobProfileId?: string; // ignored here
  };

  if (body.respuestasCleaver) {
    const missing = ITEMS_CLEAVER_JOB.filter((it) => {
      const v = body.respuestasCleaver![it.id];
      return v === undefined || v === null || !Number.isFinite(v) || v < 1 || v > 5;
    });
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Faltan ratings válidos (1–5) en ${missing.length} ítem(s)` },
        { status: 400 },
      );
    }
  }

  const profile = await updateJobProfile(id, {
    titulo: body.titulo,
    empresa: body.empresa,
    respuestasCleaver: body.respuestasCleaver,
  });
  if (!profile) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await logAudit(user.id, "update", "job_profile", id, body);
  return NextResponse.json({ profile });
}

export async function DELETE(_request: Request, { params }: Params) {
  let user;
  try {
    user = await requireUser(["admin", "psicologo"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getJobProfile(id);
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await deleteJobProfile(id);
  await logAudit(user.id, "delete", "job_profile", id);
  return NextResponse.json({ ok: true });
}
