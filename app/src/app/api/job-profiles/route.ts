import { NextResponse } from "next/server";
import { logAudit, requireUser } from "@/lib/auth";
import { createJobProfile, listJobProfiles } from "@/lib/job-profiles-store";
import type { RespuestasCleaverJob } from "@/lib/cleaver-job";
import { ITEMS_CLEAVER_JOB } from "@/lib/cleaver-job";

export async function GET() {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const profiles = await listJobProfiles();
  return NextResponse.json({ profiles });
}

export async function POST(request: Request) {
  let user;
  try {
    user = await requireUser(["admin", "psicologo"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json()) as {
    titulo?: string;
    empresa?: string;
    respuestasCleaver?: RespuestasCleaverJob;
  };

  if (!body.titulo?.trim()) {
    return NextResponse.json({ error: "Título del puesto requerido" }, { status: 400 });
  }

  if (body.respuestasCleaver) {
    const missing = ITEMS_CLEAVER_JOB.filter((it) => {
      const v = body.respuestasCleaver![it.id];
      return v === undefined || v === null || !Number.isFinite(v) || v < 1 || v > 5;
    });
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Faltan ratings válidos (1–5) en ${missing.length} ítem(s) del Análisis del Trabajo` },
        { status: 400 },
      );
    }
  }

  const profile = await createJobProfile({
    titulo: body.titulo,
    empresa: body.empresa,
    respuestasCleaver: body.respuestasCleaver,
  });

  await logAudit(user.id, "create", "job_profile", profile.id, {
    titulo: profile.titulo,
    hasCleaver: !!body.respuestasCleaver,
  });

  return NextResponse.json({ profile }, { status: 201 });
}
