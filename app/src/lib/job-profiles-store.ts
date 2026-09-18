import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import {
  calificarCleaverJob,
  type CleaverPuestoPayload,
  type RespuestasCleaverJob,
  type ResultadoCleaverJob,
} from "@/lib/cleaver-job";

export type { CleaverPuestoPayload, ResultadoCleaverJob };
export { asCleaverPuesto } from "@/lib/cleaver-job";

export type JobProfileRow = {
  id: string;
  titulo: string;
  empresa: string | null;
  mabePuesto: Record<string, number> | null;
  cleaverPuesto: CleaverPuestoPayload | Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export async function listJobProfiles(): Promise<JobProfileRow[]> {
  const db = getDb();
  const rows = await db.select().from(schema.jobProfiles).orderBy(desc(schema.jobProfiles.updatedAt));
  return rows as JobProfileRow[];
}

export async function getJobProfile(id: string): Promise<JobProfileRow | null> {
  const db = getDb();
  const [row] = await db.select().from(schema.jobProfiles).where(eq(schema.jobProfiles.id, id)).limit(1);
  return (row as JobProfileRow | undefined) ?? null;
}

export async function createJobProfile(input: {
  titulo: string;
  empresa?: string;
  respuestasCleaver?: RespuestasCleaverJob;
}): Promise<JobProfileRow> {
  const db = getDb();
  const now = new Date().toISOString();
  const id = `job-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

  let cleaverPuesto: CleaverPuestoPayload | null = null;
  if (input.respuestasCleaver) {
    const resultado = calificarCleaverJob(input.respuestasCleaver);
    cleaverPuesto = { respuestas: input.respuestasCleaver, resultado };
  }

  await db.insert(schema.jobProfiles).values({
    id,
    titulo: input.titulo.trim(),
    empresa: input.empresa?.trim() || null,
    mabePuesto: null,
    cleaverPuesto,
    createdAt: now,
    updatedAt: now,
  });

  const created = await getJobProfile(id);
  if (!created) throw new Error("No se pudo crear el perfil de puesto");
  return created;
}

export async function updateJobProfile(
  id: string,
  input: {
    titulo?: string;
    empresa?: string | null;
    respuestasCleaver?: RespuestasCleaverJob;
  },
): Promise<JobProfileRow | null> {
  const existing = await getJobProfile(id);
  if (!existing) return null;

  const db = getDb();
  const now = new Date().toISOString();
  let cleaverPuesto = existing.cleaverPuesto;
  if (input.respuestasCleaver) {
    const resultado = calificarCleaverJob(input.respuestasCleaver);
    cleaverPuesto = { respuestas: input.respuestasCleaver, resultado };
  }

  await db
    .update(schema.jobProfiles)
    .set({
      titulo: input.titulo?.trim() ?? existing.titulo,
      empresa: input.empresa === undefined ? existing.empresa : input.empresa?.trim() || null,
      cleaverPuesto,
      updatedAt: now,
    })
    .where(eq(schema.jobProfiles.id, id));

  return getJobProfile(id);
}

export async function deleteJobProfile(id: string): Promise<boolean> {
  const db = getDb();
  await db.delete(schema.jobProfiles).where(eq(schema.jobProfiles.id, id));
  return true;
}
