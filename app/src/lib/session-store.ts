import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { Instrumento } from "@/lib/storage";
import { calificarHartman } from "@/lib/hartman";

export function computeValidityFlags(
  instrumento: Instrumento,
  calificacion: unknown,
): string[] {
  const flags: string[] = [];
  if (instrumento === "hartman" && calificacion) {
    const r = calificacion as ReturnType<typeof calificarHartman>;
    if (!r.interpretable) flags.push(r.motivo ?? "Protocolo no interpretable");
    if (r.VQ.DIS >= 6) flags.push(`VQ: ${r.VQ.DIS} disimilitudes (≥6)`);
    if (r.SQ.DIS >= 6) flags.push(`SQ: ${r.SQ.DIS} disimilitudes (≥6)`);
    if (r.VQ.DIS % 2 !== 0) flags.push(`VQ: número impar de disimilitudes (${r.VQ.DIS})`);
    if (r.SQ.DIS % 2 !== 0) flags.push(`SQ: número impar de disimilitudes (${r.SQ.DIS})`);
    if (r.VQ.DIF !== 171) flags.push(`VQ: suma rankings ${r.VQ.DIF} ≠ 171`);
    if (r.SQ.DIF !== 171) flags.push(`SQ: suma rankings ${r.SQ.DIF} ≠ 171`);
  }
  return flags;
}

export async function listSessions(instrumento?: Instrumento) {
  const db = getDb();
  const q = db.select().from(schema.assessmentSessions).orderBy(desc(schema.assessmentSessions.iniciada));
  const rows = instrumento
    ? await q.where(eq(schema.assessmentSessions.instrumento, instrumento))
    : await q;
  return rows;
}

export async function getSession(id: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(schema.assessmentSessions)
    .where(eq(schema.assessmentSessions.id, id))
    .limit(1);
  return row ?? null;
}

export async function saveSession(input: {
  id: string;
  instrumento: Instrumento;
  participantNombre: string;
  participantId?: string;
  puesto?: string;
  empresa?: string;
  respuestas: unknown;
  calificacion?: unknown;
  interpretacion?: string;
  notasPsicologo?: string;
  aprobada?: boolean;
  estado?: "borrador" | "calificada" | "aprobada";
  createdById?: string;
  accessCodeId?: string;
  accessRedemptionId?: string;
  iniciada: string;
  terminada?: boolean;
}) {
  const db = getDb();
  const now = new Date().toISOString();
  const validityFlags = computeValidityFlags(input.instrumento, input.calificacion);
  const estado =
    input.estado ?? (input.aprobada ? "aprobada" : input.calificacion ? "calificada" : "borrador");

  const existing = await getSession(input.id);
  const payload = {
    instrumento: input.instrumento,
    estado,
    participantId: input.participantId ?? null,
    participantNombre: input.participantNombre,
    jobProfileId: null,
    puesto: input.puesto ?? null,
    empresa: input.empresa ?? null,
    respuestas: input.respuestas,
    calificacion: input.calificacion ?? null,
    interpretacion: input.interpretacion ?? null,
    notasPsicologo: input.notasPsicologo ?? null,
    aprobada: input.aprobada ?? false,
    validityFlags,
    createdById: input.createdById ?? null,
    approvedById: null,
    accessCodeId: input.accessCodeId ?? null,
    accessRedemptionId: input.accessRedemptionId ?? null,
    iniciada: input.iniciada,
    actualizada: now,
    terminada: input.terminada ?? true,
  };

  if (existing) {
    await db
      .update(schema.assessmentSessions)
      .set(payload)
      .where(eq(schema.assessmentSessions.id, input.id));
  } else {
    await db.insert(schema.assessmentSessions).values({ id: input.id, ...payload });
  }

  return { id: input.id, ...payload };
}
