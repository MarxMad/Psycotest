import { NextResponse } from "next/server";
import { logAudit, requireUser } from "@/lib/auth";
import { ALL_INSTRUMENTOS } from "@/lib/access-codes";
import { createAccessCode, listAccessCodes } from "@/lib/access-code-store";
import type { Instrumento } from "@/lib/storage";

export async function GET() {
  try {
    await requireUser(["admin", "psicologo"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const rows = await listAccessCodes();
  return NextResponse.json({
    codes: rows.map((r) => ({
      id: r.id,
      label: r.label,
      empresa: r.empresa,
      codeSuffix: r.codeSuffix,
      allowedInstruments: r.allowedInstruments,
      maxUses: r.maxUses,
      usedCount: r.usedCount,
      active: r.active,
      expiresAt: r.expiresAt,
      createdAt: r.createdAt,
    })),
  });
}

export async function POST(request: Request) {
  let user;
  try {
    user = await requireUser(["admin", "psicologo"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: {
    label?: string;
    empresa?: string;
    maxUses?: number;
    allowedInstruments?: Instrumento[];
    expiresAt?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!body.label?.trim()) {
    return NextResponse.json({ error: "Nombre del lote requerido" }, { status: 400 });
  }

  const maxUses = Number(body.maxUses);
  if (!Number.isFinite(maxUses) || maxUses < 1 || maxUses > 500) {
    return NextResponse.json({ error: "Cupos debe ser entre 1 y 500" }, { status: 400 });
  }

  const allowed = (body.allowedInstruments ?? ALL_INSTRUMENTOS).filter((i) =>
    ALL_INSTRUMENTOS.includes(i),
  );
  if (allowed.length === 0) {
    return NextResponse.json({ error: "Selecciona al menos una prueba" }, { status: 400 });
  }

  const created = await createAccessCode({
    label: body.label,
    empresa: body.empresa,
    maxUses,
    allowedInstruments: allowed,
    expiresAt: body.expiresAt,
    createdById: user.id,
  });

  await logAudit(user.id, "create", "access_code", created.id, {
    maxUses,
    allowedInstruments: allowed,
  });

  return NextResponse.json(
    {
      code: {
        id: created.id,
        plainCode: created.plainCode,
        label: body.label,
        maxUses,
        allowedInstruments: allowed,
      },
    },
    { status: 201 },
  );
}
