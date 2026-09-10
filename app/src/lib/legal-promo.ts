import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { coupons, courseEnrollments, legalAcknowledgements, legalDocuments } from "@/db/schema";

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

const DEFAULT_LEGAL: Array<{
  type: "finiquito" | "liquidacion" | "aviso_privacidad" | "terminos";
  title: string;
  body: string;
}> = [
  {
    type: "finiquito",
    title: "Finiquito de participación",
    body: `## Finiquito

El participante declara haber recibido la formación correspondiente al programa CONOCER y no tener pendiente de entregar evidencias adicionales salvo las indicadas en su expediente.

Al firmar este documento, ambas partes dan por concluidas las obligaciones derivadas de la inscripción, sin perjuicio de la vigencia de la constancia emitida.`,
  },
  {
    type: "liquidacion",
    title: "Liquidación de honorarios / cuotas",
    body: `## Liquidación

Documento de liquidación de cuotas del programa de certificación. El importe pagado cubre acceso a contenidos VOD, sesiones en vivo programadas y proceso de evaluación según el expediente.

Cualquier reembolso se rige por la política vigente al momento de la inscripción.`,
  },
  {
    type: "aviso_privacidad",
    title: "Aviso de privacidad",
    body: `## Aviso de privacidad

Los datos personales, evidencias y resultados de evaluación se tratan conforme a la LFPDPPP para fines de formación, evaluación y emisión de constancias. El titular puede ejercer ARCO contactando a la organización.`,
  },
  {
    type: "terminos",
    title: "Términos de certificación",
    body: `## Términos

La constancia acredita participación y cumplimiento de criterios internos del programa. No sustituye por sí sola un certificado oficial CONOCER emitido por una entidad evaluadora acreditada, salvo convenio específico.`,
  },
];

export async function ensureDefaultLegalDocs() {
  const db = getDb();
  const existing = await db.select().from(legalDocuments).limit(1);
  if (existing.length) return;

  const now = new Date().toISOString();
  for (const doc of DEFAULT_LEGAL) {
    await db.insert(legalDocuments).values({
      id: id("legal"),
      type: doc.type,
      title: doc.title,
      bodyMarkdown: doc.body,
      version: "1.0",
      active: true,
      createdAt: now,
      updatedAt: now,
    });
  }
}

export async function listLegalDocuments(activeOnly = true) {
  await ensureDefaultLegalDocs();
  const db = getDb();
  const rows = await db.select().from(legalDocuments);
  return activeOnly ? rows.filter((r) => r.active) : rows;
}

export async function acknowledgeLegal(userId: string, documentId: string, ipHash?: string) {
  const db = getDb();
  const ackId = id("ack");
  await db.insert(legalAcknowledgements).values({
    id: ackId,
    userId,
    documentId,
    acknowledgedAt: new Date().toISOString(),
    ipHash: ipHash || null,
  });
  const [row] = await db
    .select()
    .from(legalAcknowledgements)
    .where(eq(legalAcknowledgements.id, ackId));
  return row;
}

/** Genera cupón 100% al completar un curso (una vez por enrollment). */
export async function grantCompletionCoupon(enrollmentId: string) {
  const db = getDb();
  const [enrollment] = await db
    .select()
    .from(courseEnrollments)
    .where(eq(courseEnrollments.id, enrollmentId));
  if (!enrollment || enrollment.progressPercent < 100) return null;

  const [existing] = await db
    .select()
    .from(coupons)
    .where(
      and(eq(coupons.sourceEnrollmentId, enrollmentId), eq(coupons.grantOnCourseComplete, true)),
    )
    .limit(1);
  if (existing) return existing;

  const code = `COMPLETO100-${enrollmentId.slice(-6).toUpperCase()}`;
  const couponId = id("coupon");
  const expires = new Date();
  expires.setMonth(expires.getMonth() + 6);

  await db.insert(coupons).values({
    id: couponId,
    code,
    type: "percentage",
    value: 100,
    maxUses: 1,
    currentUses: 0,
    expiresAt: expires.toISOString(),
    active: true,
    grantOnCourseComplete: true,
    sourceEnrollmentId: enrollmentId,
    createdAt: new Date().toISOString(),
  });

  const [coupon] = await db.select().from(coupons).where(eq(coupons.id, couponId));
  return coupon;
}
