import { NextResponse } from "next/server";
import { logAudit } from "@/lib/auth";
import {
  createApplicantToken,
  getApplicantSession,
  setApplicantCookie,
  clearApplicantCookie,
} from "@/lib/applicant-auth";
import { clientIp } from "@/lib/access-codes";
import { redeemAccessCode } from "@/lib/access-code-store";
import { rateLimit, resetRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    const rl = rateLimit(`acceso:${ip}`, 8, 15 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: `Demasiados intentos. Espera ${rl.retryAfterSec}s.` },
        { status: 429 },
      );
    }

    let body: { codigo?: string; nombre?: string; empresa?: string; puesto?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }

    const codigo = body.codigo?.trim();
    const nombre = body.nombre?.trim();

    if (!codigo || codigo.length < 8) {
      return NextResponse.json({ error: "Ingresa un código válido" }, { status: 400 });
    }
    if (!nombre || nombre.length < 2) {
      return NextResponse.json({ error: "Ingresa tu nombre completo" }, { status: 400 });
    }

    const result = await redeemAccessCode({
      code: codigo,
      nombre,
      empresa: body.empresa,
      puesto: body.puesto,
      ip,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }

    resetRateLimit(`acceso:${ip}`);

    const { redemption } = result;
    const token = await createApplicantToken({
      redemptionId: redemption.id,
      codeId: redemption.codeId,
      nombre: redemption.nombre,
      empresa: redemption.empresa,
      puesto: redemption.puesto,
      allowed: redemption.allowed,
      completed: redemption.completed,
    });
    await setApplicantCookie(token);

    await logAudit(null, "redeem", "access_code", redemption.codeId, {
      redemptionId: redemption.id,
      resumed: redemption.resumed,
    });

    return NextResponse.json({
      ok: true,
      session: {
        nombre: redemption.nombre,
        empresa: redemption.empresa,
        puesto: redemption.puesto,
        allowed: redemption.allowed,
        completed: redemption.completed,
        label: redemption.label,
      },
    });
  } catch (err) {
    console.error("[api/acceso POST]", err);
    return NextResponse.json(
      { error: "Error interno al validar el código. Intenta de nuevo." },
      { status: 500 },
    );
  }
}

export async function GET() {
  const session = await getApplicantSession();
  if (!session) {
    return NextResponse.json({ session: null }, { status: 401 });
  }
  return NextResponse.json({ session });
}

export async function DELETE() {
  await clearApplicantCookie();
  return NextResponse.json({ ok: true });
}
