import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  certificationPrograms,
  courseEnrollments,
  courses,
  expedienteEvaluations,
  liveClassAttendances,
  liveClasses,
  portfolioEvidences,
  studentExpedientes,
  users,
} from "@/db/schema";

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export async function ensureProgramForCourse(courseId: string) {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(certificationPrograms)
    .where(and(eq(certificationPrograms.courseId, courseId), eq(certificationPrograms.active, true)))
    .limit(1);
  if (existing) return existing;

  const [course] = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);
  if (!course) return null;

  const now = new Date().toISOString();
  const programId = id("prog");
  const code = `EC-${course.slug.slice(0, 12).toUpperCase().replace(/[^A-Z0-9]/g, "") || "CURSO"}`;
  await db.insert(certificationPrograms).values({
    id: programId,
    courseId,
    code,
    title: `Programa CONOCER — ${course.title}`,
    version: "1.0",
    description: course.description,
    minPresencePercent: 80,
    minAprovechamientoPercent: 70,
    active: true,
    createdAt: now,
    updatedAt: now,
  });
  const [row] = await db
    .select()
    .from(certificationPrograms)
    .where(eq(certificationPrograms.id, programId));
  return row;
}

export async function openOrGetExpediente(userId: string, courseId: string, enrollmentId?: string) {
  const program = await ensureProgramForCourse(courseId);
  if (!program) return null;

  const db = getDb();
  const [existing] = await db
    .select()
    .from(studentExpedientes)
    .where(
      and(eq(studentExpedientes.userId, userId), eq(studentExpedientes.programId, program.id)),
    )
    .limit(1);
  if (existing) return { expediente: existing, program };

  let enrollment = enrollmentId;
  if (!enrollment) {
    const [row] = await db
      .select({ id: courseEnrollments.id, progressPercent: courseEnrollments.progressPercent })
      .from(courseEnrollments)
      .where(
        and(eq(courseEnrollments.userId, userId), eq(courseEnrollments.courseId, courseId)),
      )
      .limit(1);
    enrollment = row?.id;
  }

  const now = new Date().toISOString();
  const expedienteId = id("exp");
  await db.insert(studentExpedientes).values({
    id: expedienteId,
    userId,
    programId: program.id,
    enrollmentId: enrollment || null,
    status: "abierto",
    aprovechamientoPercent: 0,
    presencePercentAvg: 0,
    createdAt: now,
    updatedAt: now,
  });

  const [expediente] = await db
    .select()
    .from(studentExpedientes)
    .where(eq(studentExpedientes.id, expedienteId));
  return { expediente, program };
}

export async function recalcExpedienteMetrics(expedienteId: string) {
  const db = getDb();
  const [expediente] = await db
    .select()
    .from(studentExpedientes)
    .where(eq(studentExpedientes.id, expedienteId));
  if (!expediente) return null;

  const [program] = await db
    .select()
    .from(certificationPrograms)
    .where(eq(certificationPrograms.id, expediente.programId));
  if (!program) return null;

  let aprovechamiento = 0;
  if (expediente.enrollmentId) {
    const [enr] = await db
      .select({ progressPercent: courseEnrollments.progressPercent })
      .from(courseEnrollments)
      .where(eq(courseEnrollments.id, expediente.enrollmentId));
    aprovechamiento = enr?.progressPercent ?? 0;
  }

  const classRows = await db
    .select({ id: liveClasses.id })
    .from(liveClasses)
    .where(eq(liveClasses.courseId, program.courseId));

  let presenceSum = 0;
  let presenceCount = 0;
  for (const lc of classRows) {
    const [att] = await db
      .select({ presencePercent: liveClassAttendances.presencePercent })
      .from(liveClassAttendances)
      .where(
        and(
          eq(liveClassAttendances.liveClassId, lc.id),
          eq(liveClassAttendances.userId, expediente.userId),
        ),
      )
      .limit(1);
    if (att) {
      presenceSum += att.presencePercent || 0;
      presenceCount += 1;
    }
  }
  const presenceAvg = presenceCount ? Math.round(presenceSum / presenceCount) : 0;

  await db
    .update(studentExpedientes)
    .set({
      aprovechamientoPercent: aprovechamiento,
      presencePercentAvg: presenceAvg,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(studentExpedientes.id, expedienteId));

  const [updated] = await db
    .select()
    .from(studentExpedientes)
    .where(eq(studentExpedientes.id, expedienteId));
  return { expediente: updated, program };
}

export async function submitEvaluation(input: {
  expedienteId: string;
  type: "diagnostico" | "inicial" | "final" | "satisfaccion" | "clinica";
  answers: Record<string, unknown>;
  score?: number;
  reviewedBy?: string;
}) {
  const db = getDb();
  const evalId = id("eval");
  await db.insert(expedienteEvaluations).values({
    id: evalId,
    expedienteId: input.expedienteId,
    type: input.type,
    answersJson: input.answers,
    score: input.score ?? null,
    submittedAt: new Date().toISOString(),
    reviewedBy: input.reviewedBy || null,
  });
  await db
    .update(studentExpedientes)
    .set({ updatedAt: new Date().toISOString() })
    .where(eq(studentExpedientes.id, input.expedienteId));
  const [row] = await db
    .select()
    .from(expedienteEvaluations)
    .where(eq(expedienteEvaluations.id, evalId));
  return row;
}

export async function addEvidence(input: {
  expedienteId: string;
  title: string;
  description?: string;
  evidenceType?: "documento" | "imagen" | "enlace" | "pizarra" | "otro";
  fileUrl?: string;
  metaJson?: Record<string, unknown>;
}) {
  const db = getDb();
  const evidenceId = id("evid");
  await db.insert(portfolioEvidences).values({
    id: evidenceId,
    expedienteId: input.expedienteId,
    title: input.title,
    description: input.description || null,
    evidenceType: input.evidenceType || "documento",
    fileUrl: input.fileUrl || null,
    metaJson: input.metaJson || null,
    createdAt: new Date().toISOString(),
  });
  const [row] = await db
    .select()
    .from(portfolioEvidences)
    .where(eq(portfolioEvidences.id, evidenceId));
  return row;
}

export async function getExpedienteBundle(expedienteId: string) {
  const db = getDb();
  const [expediente] = await db
    .select()
    .from(studentExpedientes)
    .where(eq(studentExpedientes.id, expedienteId));
  if (!expediente) return null;

  const [program] = await db
    .select()
    .from(certificationPrograms)
    .where(eq(certificationPrograms.id, expediente.programId));
  const [user] = await db.select().from(users).where(eq(users.id, expediente.userId));
  const evaluations = await db
    .select()
    .from(expedienteEvaluations)
    .where(eq(expedienteEvaluations.expedienteId, expedienteId))
    .orderBy(desc(expedienteEvaluations.submittedAt));
  const evidences = await db
    .select()
    .from(portfolioEvidences)
    .where(eq(portfolioEvidences.expedienteId, expedienteId))
    .orderBy(desc(portfolioEvidences.createdAt));

  return { expediente, program, user, evaluations, evidences };
}

export async function listExpedientes(filters?: { courseId?: string; status?: string }) {
  const db = getDb();
  const rows = await db.select().from(studentExpedientes);
  const programs = await db.select().from(certificationPrograms);
  const programById = Object.fromEntries(programs.map((p) => [p.id, p]));

  return rows
    .filter((e) => {
      const program = programById[e.programId];
      if (filters?.courseId && program?.courseId !== filters.courseId) return false;
      if (filters?.status && e.status !== filters.status) return false;
      return true;
    })
    .map((e) => ({ ...e, program: programById[e.programId] || null }));
}

export async function setExpedienteStatus(
  expedienteId: string,
  status: "abierto" | "en_revision" | "aprobado" | "rechazado" | "cerrado",
  notes?: string,
) {
  const db = getDb();
  await db
    .update(studentExpedientes)
    .set({
      status,
      notes: notes ?? undefined,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(studentExpedientes.id, expedienteId));
  return getExpedienteBundle(expedienteId);
}
