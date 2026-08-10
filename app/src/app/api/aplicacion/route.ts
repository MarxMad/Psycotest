import { NextResponse } from "next/server";
import type { Instrumento } from "@/lib/storage";
import { procesarSesion } from "@/lib/procesar-sesion";
import { saveSession } from "@/lib/session-store";
import {
  canTakeInstrument,
  getApplicantSession,
  refreshApplicantCookie,
} from "@/lib/applicant-auth";
import { markRedemptionInstrumentComplete } from "@/lib/access-code-store";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/access-codes";

const INSTRUMENTOS: Instrumento[] = ["papi", "hartman", "mabe"];

/** Envío de aplicación terminada — requiere sesión de aplicante con código válido. */
export async function POST(request: Request) {
  const applicant = await getApplicantSession();
  if (!applicant) {
    return NextResponse.json({ error: "Acceso no autorizado. Usa tu código." }, { status: 401 });
  }

  const ip = clientIp(request);
  const rl = rateLimit(`aplicacion:${applicant.redemptionId}`, 6, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Límite de envíos alcanzado" }, { status: 429 });
  }

  let body: {
    id?: string;
    instrumento?: Instrumento;
    participantNombre?: string;
    puesto?: string;
    empresa?: string;
    respuestas?: unknown;
    iniciada?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { id, instrumento, respuestas, iniciada } = body;

  if (!id || !instrumento || !INSTRUMENTOS.includes(instrumento)) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }
  if (respuestas == null || !iniciada) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  if (!canTakeInstrument(applicant, instrumento)) {
    return NextResponse.json(
      { error: "No tienes permiso para esta prueba o ya la completaste" },
      { status: 403 },
    );
  }

  const participantNombre = applicant.nombre;
  const puesto = body.puesto ?? applicant.puesto;
  const empresa = body.empresa ?? applicant.empresa;

  const { calificacion, interpretacion } = procesarSesion(
    instrumento,
    respuestas,
    participantNombre,
    puesto,
  );

  const row = await saveSession({
    id,
    instrumento,
    participantNombre,
    puesto,
    empresa,
    respuestas,
    calificacion,
    interpretacion,
    aprobada: false,
    estado: "calificada",
    iniciada,
    terminada: true,
    accessCodeId: applicant.codeId,
    accessRedemptionId: applicant.redemptionId,
  });

  const updated = await markRedemptionInstrumentComplete(applicant.redemptionId, instrumento);
  if (updated?.allowed) {
    await refreshApplicantCookie({
      redemptionId: applicant.redemptionId,
      codeId: applicant.codeId,
      nombre: applicant.nombre,
      empresa: applicant.empresa,
      puesto: applicant.puesto,
      allowed: updated.allowed,
      completed: updated.redemption.completedInstruments as Instrumento[],
    });
  }

  return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
}
