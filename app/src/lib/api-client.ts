import type { AssessmentSession } from "@/db/schema";
import type { Instrumento, MetaSesion, Sesion } from "./storage";

export interface ParticipantRow {
  id: string;
  nombre: string;
  edad: string | null;
  sexo: string | null;
  estadoCivil: string | null;
  estudios: string | null;
  ocupacion: string | null;
  empresa: string | null;
  notas: string | null;
  createdAt: string;
  updatedAt: string;
}

export function dbSessionToMeta(row: AssessmentSession): MetaSesion {
  return {
    id: row.id,
    instrumento: row.instrumento as Instrumento,
    participante: row.participantNombre,
    puesto: row.puesto ?? undefined,
    empresa: row.empresa ?? undefined,
    iniciada: row.iniciada,
    actualizada: row.actualizada,
    finalizadaEn: row.terminada ? row.actualizada : undefined,
    terminada: row.terminada,
    aprobada: row.aprobada,
  };
}

export function dbSessionToSesion(row: AssessmentSession): Sesion {
  return {
    ...dbSessionToMeta(row),
    respuestas: row.respuestas,
    calificacion: row.calificacion ?? undefined,
    interpretacion: row.interpretacion ?? undefined,
    notasPsicologo: row.notasPsicologo ?? undefined,
    aprobada: row.aprobada,
    validityFlags: row.validityFlags ?? undefined,
  };
}

export async function fetchSessions(instrumento?: Instrumento): Promise<AssessmentSession[]> {
  const q = instrumento ? `?instrumento=${instrumento}` : "";
  const res = await fetch(`/api/sessions${q}`);
  if (!res.ok) return [];
  const data = (await res.json()) as { sessions: AssessmentSession[] };
  return data.sessions;
}

export async function fetchSession(id: string): Promise<AssessmentSession | null> {
  const res = await fetch(`/api/sessions/${id}`);
  if (!res.ok) return null;
  const data = (await res.json()) as { session: AssessmentSession };
  return data.session;
}

export async function fetchParticipants(): Promise<ParticipantRow[]> {
  const res = await fetch("/api/participants");
  if (!res.ok) return [];
  const data = (await res.json()) as { participants: ParticipantRow[] };
  return data.participants;
}

export async function createParticipant(input: {
  nombre: string;
  edad?: string;
  sexo?: string;
  estadoCivil?: string;
  estudios?: string;
  ocupacion?: string;
  empresa?: string;
  notas?: string;
}): Promise<ParticipantRow | null> {
  const res = await fetch("/api/participants", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { participant: ParticipantRow };
  return data.participant;
}
