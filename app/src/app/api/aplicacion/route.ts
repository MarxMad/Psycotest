import { after, NextResponse } from "next/server";
import { avisarPruebasTerminadas } from "@/lib/avisos-evaluacion";
import type { Instrumento } from "@/lib/storage";
import { procesarSesion } from "@/lib/procesar-sesion";
import { getSession, saveSession } from "@/lib/session-store";
import {
  canTakeInstrument,
  getApplicantSession,
  refreshApplicantCookie,
} from "@/lib/applicant-auth";
import { getRedemption, markRedemptionInstrumentComplete } from "@/lib/access-code-store";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp, parseCompletedInstruments } from "@/lib/access-codes";

import { respuestasDelCandidato } from "@/lib/socioeconomico";

const INSTRUMENTOS: Instrumento[] = ["papi", "hartman", "mabe", "cleaver", "lifo", "socioeconomico"];

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

  const { id, instrumento, iniciada } = body;
  // El estudio socioeconómico se limpia campo por campo: lleva datos sensibles
  // y la parte del investigador nunca puede venir del candidato.
  const respuestas =
    instrumento === "socioeconomico" ? respuestasDelCandidato(body.respuestas) : body.respuestas;

  if (!id || !instrumento || !INSTRUMENTOS.includes(instrumento)) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }
  if (respuestas == null || !iniciada) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }
  if (instrumento === "socioeconomico" && !(respuestas as { aviso: unknown }).aviso) {
    return NextResponse.json({ error: "Falta aceptar el aviso de privacidad" }, { status: 400 });
  }

  // El id lo genera el navegador: si ya existe, tiene que ser de este mismo
  // candidato (un envío no puede pisar la sesión de otra persona). Si es suya,
  // es un reintento de algo que ya llegó: se confirma sin duplicar nada.
  const previa = await getSession(id);
  if (previa) {
    if (previa.accessRedemptionId !== applicant.redemptionId) {
      return NextResponse.json({ error: "Sesión no válida" }, { status: 409 });
    }
    return NextResponse.json({ ok: true, id: previa.id }, { status: 200 });
  }

  if (!canTakeInstrument(applicant, instrumento)) {
    return NextResponse.json(
      { error: "No tienes permiso para esta prueba o ya la completaste" },
      { status: 403 },
    );
  }

  // La cookie puede venir de antes de terminar la prueba: lo que manda es la base.
  const canje = await getRedemption(applicant.redemptionId);
  if (!canje || parseCompletedInstruments(canje.completedInstruments).includes(instrumento)) {
    return NextResponse.json({ error: "Ya completaste esta prueba" }, { status: 403 });
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
    // El estudio queda en borrador hasta que el investigador haga su parte.
    estado: instrumento === "socioeconomico" ? "borrador" : "calificada",
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

  // Si fue la última prueba, avisa a quien compró y a los psicólogos.
  const origen = new URL(request.url).origin;
  after(() => avisarPruebasTerminadas(applicant.redemptionId, origen));

  return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
}
