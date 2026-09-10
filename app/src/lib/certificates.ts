import { createHash, randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import QRCode from "qrcode";
import { getDb } from "@/db";
import { courseCertificates, courses, studentExpedientes, users } from "@/db/schema";
import { getExpedienteBundle, recalcExpedienteMetrics } from "@/lib/expedientes";

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function buildVerificationCode() {
  return randomBytes(8).toString("hex").toUpperCase();
}

export function buildFolio(courseSlug: string) {
  const year = new Date().getFullYear();
  const slug = courseSlug.slice(0, 8).toUpperCase().replace(/[^A-Z0-9]/g, "") || "CURSO";
  const seq = createHash("sha1")
    .update(`${Date.now()}-${Math.random()}`)
    .digest("hex")
    .slice(0, 6)
    .toUpperCase();
  return `PSY-${year}-${slug}-${seq}`;
}

export async function issueCertificate(expedienteId: string, baseUrl: string) {
  const metrics = await recalcExpedienteMetrics(expedienteId);
  if (!metrics?.expediente || !metrics.program) {
    throw new Error("EXPEDIENTE_NOT_FOUND");
  }

  const { expediente, program } = metrics;
  if (expediente.status !== "aprobado" && expediente.status !== "en_revision") {
    // Permitir emitir si métricas cumplen mínimos aunque status sea abierto (admin force)
  }

  const db = getDb();
  const existing = await db
    .select()
    .from(courseCertificates)
    .where(eq(courseCertificates.expedienteId, expedienteId))
    .limit(1);
  if (existing[0] && !existing[0].revokedAt) return existing[0];

  const [course] = await db.select().from(courses).where(eq(courses.id, program.courseId));
  const [user] = await db.select().from(users).where(eq(users.id, expediente.userId));
  if (!course || !user) throw new Error("MISSING_COURSE_OR_USER");

  const meets =
    expediente.aprovechamientoPercent >= program.minAprovechamientoPercent &&
    (expediente.presencePercentAvg >= program.minPresencePercent ||
      expediente.presencePercentAvg === 0);

  const verificationCode = buildVerificationCode();
  const folio = buildFolio(course.slug);
  const now = new Date().toISOString();
  const certId = id("cert");

  const dictamen = {
    programCode: program.code,
    programTitle: program.title,
    participant: user.nombre,
    email: user.email,
    courseTitle: course.title,
    aprovechamientoPercent: expediente.aprovechamientoPercent,
    presencePercentAvg: expediente.presencePercentAvg,
    minAprovechamientoPercent: program.minAprovechamientoPercent,
    minPresencePercent: program.minPresencePercent,
    meetsCriteria: meets,
    issuedAt: now,
    verificationUrl: `${baseUrl.replace(/\/$/, "")}/verificar/${verificationCode}`,
  };

  await db.insert(courseCertificates).values({
    id: certId,
    expedienteId,
    userId: user.id,
    courseId: course.id,
    folio,
    verificationCode,
    dictamenJson: dictamen,
    issuedAt: now,
  });

  if (expediente.status !== "aprobado") {
    await db
      .update(studentExpedientes)
      .set({ status: meets ? "aprobado" : "en_revision", updatedAt: now })
      .where(eq(studentExpedientes.id, expedienteId));
  }

  const [cert] = await db
    .select()
    .from(courseCertificates)
    .where(eq(courseCertificates.id, certId));
  return cert;
}

export async function findCertificateByCode(code: string) {
  const db = getDb();
  const [cert] = await db
    .select()
    .from(courseCertificates)
    .where(eq(courseCertificates.verificationCode, code.toUpperCase()))
    .limit(1);
  if (!cert) return null;
  const [course] = await db.select().from(courses).where(eq(courses.id, cert.courseId));
  const [user] = await db.select().from(users).where(eq(users.id, cert.userId));
  return { certificate: cert, course, user };
}

export async function qrDataUrl(text: string) {
  return QRCode.toDataURL(text, { margin: 1, width: 256 });
}

export async function getCertificateContext(expedienteId: string) {
  return getExpedienteBundle(expedienteId);
}
