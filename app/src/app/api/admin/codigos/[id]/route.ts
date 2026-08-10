import { NextResponse } from "next/server";
import { logAudit, requireUser } from "@/lib/auth";
import { getAccessCodeById, getCodeUsageReport, setAccessCodeActive } from "@/lib/access-code-store";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireUser(["admin", "psicologo"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const report = await getCodeUsageReport(id);
  if (!report) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  return NextResponse.json({
    code: {
      id: report.code.id,
      label: report.code.label,
      empresa: report.code.empresa,
      codeSuffix: report.code.codeSuffix,
      allowedInstruments: report.allowed,
      maxUses: report.code.maxUses,
      usedCount: report.code.usedCount,
      active: report.code.active,
      expiresAt: report.code.expiresAt,
      createdAt: report.code.createdAt,
    },
    rows: report.rows,
  });
}

export async function PATCH(request: Request, { params }: Params) {
  let user;
  try {
    user = await requireUser(["admin", "psicologo"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const code = await getAccessCodeById(id);
  if (!code) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const body = (await request.json()) as { active?: boolean };
  if (typeof body.active !== "boolean") {
    return NextResponse.json({ error: "Campo active requerido" }, { status: 400 });
  }

  await setAccessCodeActive(id, body.active);
  await logAudit(user.id, body.active ? "activate" : "deactivate", "access_code", id);

  return NextResponse.json({ ok: true });
}
