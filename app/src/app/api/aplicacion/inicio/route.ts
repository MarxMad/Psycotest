import { after, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { avisarInicioPrueba } from "@/lib/avisos-evaluacion";
import { canTakeInstrument, getApplicantSession } from "@/lib/applicant-auth";
import { getRedemption } from "@/lib/access-code-store";
import { parseCompletedInstruments } from "@/lib/access-codes";
import { rateLimit } from "@/lib/rate-limit";
import type { Instrumento } from "@/lib/storage";
import { HORAS_PARA_CONTESTAR, tiempoAgotado } from "@/lib/pruebas-catalogo";

const INSTRUMENTOS: Instrumento[] = ["papi", "hartman", "mabe", "cleaver", "lifo", "socioeconomico"];

/**
 * La persona pulsó «Comenzar» en una prueba.
 *
 * Guarda la hora de inicio con el reloj del servidor (la del navegador se
 * puede mover) y avisa al cliente y al equipo. Sólo la primera vez: si
 * recarga o retoma la prueba, la hora y los avisos no se repiten.
 */
export async function POST(request: Request) {
  const aplicante = await getApplicantSession();
  if (!aplicante) return NextResponse.json({ error: "Usa tu código." }, { status: 401 });

  const rl = rateLimit(`inicio:${aplicante.redemptionId}`, 30, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Demasiados intentos" }, { status: 429 });

  const body = (await request.json().catch(() => ({}))) as { instrumento?: Instrumento };
  const instrumento = body.instrumento;
  if (!instrumento || !INSTRUMENTOS.includes(instrumento) || !canTakeInstrument(aplicante, instrumento)) {
    return NextResponse.json({ error: "Prueba no válida" }, { status: 400 });
  }

  const canje = await getRedemption(aplicante.redemptionId);
  if (!canje || parseCompletedInstruments(canje.completedInstruments).includes(instrumento)) {
    return NextResponse.json({ error: "Ya completaste esta prueba" }, { status: 403 });
  }

  const previas = canje.iniciadas ?? {};
  if (previas[instrumento]) {
    return NextResponse.json({ ok: true, inicio: previas[instrumento], nueva: false });
  }

  // Una prueba nueva no se puede empezar pasadas las 24 h desde la activación.
  if (tiempoAgotado(canje.createdAt)) {
    return NextResponse.json(
      { error: `Se terminó tu tiempo: tenías ${HORAS_PARA_CONTESTAR} horas desde que activaste el código.` },
      { status: 403 },
    );
  }

  const inicio = new Date().toISOString();
  await getDb()
    .update(schema.accessRedemptions)
    .set({ iniciadas: { ...previas, [instrumento]: inicio } })
    .where(eq(schema.accessRedemptions.id, aplicante.redemptionId));

  const origen = new URL(request.url).origin;
  after(() => avisarInicioPrueba(aplicante.redemptionId, instrumento, inicio, origen));

  return NextResponse.json({ ok: true, inicio, nueva: true });
}
