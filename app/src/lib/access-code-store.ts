import { and, desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import {
  generateAccessCodePlain,
  hashAccessCodeLookup,
  hashIp,
  normalizeAccessCode,
  parseAllowedInstruments,
} from "@/lib/access-codes";
import type { Instrumento } from "@/lib/storage";

export async function createAccessCode(input: {
  label: string;
  empresa?: string;
  maxUses: number;
  allowedInstruments: Instrumento[];
  expiresAt?: string;
  createdById: string;
}) {
  const db = getDb();
  const now = new Date().toISOString();
  const plain = generateAccessCodePlain();
  const normalized = normalizeAccessCode(plain);
  const id = `code-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

  await db.insert(schema.accessCodes).values({
    id,
    label: input.label.trim(),
    empresa: input.empresa?.trim() || null,
    lookupHash: hashAccessCodeLookup(normalized),
    codeSuffix: normalized.slice(-4),
    allowedInstruments: input.allowedInstruments,
    maxUses: input.maxUses,
    usedCount: 0,
    active: true,
    expiresAt: input.expiresAt ?? null,
    createdById: input.createdById,
    createdAt: now,
    updatedAt: now,
  });

  return { id, plainCode: plain, normalized };
}

export async function listAccessCodes() {
  const db = getDb();
  return db.select().from(schema.accessCodes).orderBy(desc(schema.accessCodes.createdAt));
}

export async function getAccessCodeById(id: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(schema.accessCodes)
    .where(eq(schema.accessCodes.id, id))
    .limit(1);
  return row ?? null;
}

export async function setAccessCodeActive(id: string, active: boolean) {
  const db = getDb();
  const now = new Date().toISOString();
  await db
    .update(schema.accessCodes)
    .set({ active, updatedAt: now })
    .where(eq(schema.accessCodes.id, id));
}

export async function redeemAccessCode(input: {
  code: string;
  nombre: string;
  empresa?: string;
  puesto?: string;
  ip: string;
}) {
  const db = getDb();
  const normalized = normalizeAccessCode(input.code);
  const lookupHash = hashAccessCodeLookup(normalized);
  const nombre = input.nombre.trim();

  const [codeRow] = await db
    .select()
    .from(schema.accessCodes)
    .where(eq(schema.accessCodes.lookupHash, lookupHash))
    .limit(1);

  if (!codeRow) return { ok: false as const, error: "Código inválido" };
  if (!codeRow.active) return { ok: false as const, error: "Este código fue desactivado" };
  if (codeRow.expiresAt && new Date(codeRow.expiresAt) < new Date()) {
    return { ok: false as const, error: "Este código expiró" };
  }

  const allowed = parseAllowedInstruments(codeRow.allowedInstruments);
  const existing = await findExistingRedemption(codeRow.id, nombre);

  if (existing) {
    const completed = parseAllowedInstruments(existing.completedInstruments);
    if (completed.length >= allowed.length) {
      return { ok: false as const, error: "Ya completaste todas las pruebas de este código" };
    }
    return {
      ok: true as const,
      redemption: {
        id: existing.id,
        codeId: codeRow.id,
        nombre: existing.participantNombre,
        empresa: existing.empresa ?? codeRow.empresa ?? undefined,
        puesto: existing.puesto ?? undefined,
        allowed,
        completed,
        label: codeRow.label,
        resumed: true,
      },
    };
  }

  if (codeRow.usedCount >= codeRow.maxUses) {
    return { ok: false as const, error: "Este código ya no tiene cupos disponibles" };
  }

  const now = new Date().toISOString();
  const redemptionId = `red-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

  const [fresh] = await db
    .select()
    .from(schema.accessCodes)
    .where(eq(schema.accessCodes.id, codeRow.id))
    .limit(1);

  if (!fresh || fresh.usedCount >= fresh.maxUses) {
    return { ok: false as const, error: "Este código ya no tiene cupos disponibles" };
  }

  await db.insert(schema.accessRedemptions).values({
    id: redemptionId,
    accessCodeId: codeRow.id,
    participantNombre: nombre,
    empresa: input.empresa?.trim() || codeRow.empresa || null,
    puesto: input.puesto?.trim() || null,
    completedInstruments: [],
    ipHash: hashIp(input.ip),
    createdAt: now,
  });

  await db
    .update(schema.accessCodes)
    .set({
      usedCount: fresh.usedCount + 1,
      updatedAt: now,
    })
    .where(eq(schema.accessCodes.id, codeRow.id));

  return {
    ok: true as const,
    redemption: {
      id: redemptionId,
      codeId: codeRow.id,
      nombre,
      empresa: input.empresa?.trim() || codeRow.empresa || undefined,
      puesto: input.puesto?.trim() || undefined,
      allowed,
      completed: [] as Instrumento[],
      label: codeRow.label,
      resumed: false,
    },
  };
}

export async function getRedemption(id: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(schema.accessRedemptions)
    .where(eq(schema.accessRedemptions.id, id))
    .limit(1);
  return row ?? null;
}

export async function markRedemptionInstrumentComplete(
  redemptionId: string,
  instrumento: Instrumento,
): Promise<{ redemption: typeof schema.accessRedemptions.$inferSelect; allowed: Instrumento[] } | null> {
  const db = getDb();
  const row = await getRedemption(redemptionId);
  if (!row) return null;

  const completed = parseAllowedInstruments(row.completedInstruments);
  if (completed.includes(instrumento)) {
    const [codeRow] = await db
      .select()
      .from(schema.accessCodes)
      .where(eq(schema.accessCodes.id, row.accessCodeId))
      .limit(1);
    return {
      redemption: row,
      allowed: parseAllowedInstruments(codeRow?.allowedInstruments),
    };
  }

  const next = [...completed, instrumento];
  await db
    .update(schema.accessRedemptions)
    .set({ completedInstruments: next })
    .where(eq(schema.accessRedemptions.id, redemptionId));

  const [codeRow] = await db
    .select()
    .from(schema.accessCodes)
    .where(eq(schema.accessCodes.id, row.accessCodeId))
    .limit(1);

  return {
    redemption: { ...row, completedInstruments: next },
    allowed: parseAllowedInstruments(codeRow?.allowedInstruments),
  };
}

export async function listRedemptionsForCode(codeId: string) {
  const db = getDb();
  return db
    .select()
    .from(schema.accessRedemptions)
    .where(eq(schema.accessRedemptions.accessCodeId, codeId))
    .orderBy(desc(schema.accessRedemptions.createdAt));
}

export interface CodeUsageRow {
  id: string;
  participantNombre: string;
  empresa: string | null;
  puesto: string | null;
  completedInstruments: Instrumento[];
  pendingInstruments: Instrumento[];
  progress: string;
  createdAt: string;
  sessions: Array<{
    id: string;
    instrumento: Instrumento;
    iniciada: string;
    actualizada: string;
    aprobada: boolean;
    terminada: boolean;
  }>;
}

export async function getCodeUsageReport(codeId: string) {
  const code = await getAccessCodeById(codeId);
  if (!code) return null;

  const redemptions = await listRedemptionsForCode(codeId);
  const allowed = parseAllowedInstruments(code.allowedInstruments);

  const db = getDb();
  const sessions = await db
    .select({
      id: schema.assessmentSessions.id,
      instrumento: schema.assessmentSessions.instrumento,
      iniciada: schema.assessmentSessions.iniciada,
      actualizada: schema.assessmentSessions.actualizada,
      aprobada: schema.assessmentSessions.aprobada,
      terminada: schema.assessmentSessions.terminada,
      accessRedemptionId: schema.assessmentSessions.accessRedemptionId,
    })
    .from(schema.assessmentSessions)
    .where(eq(schema.assessmentSessions.accessCodeId, codeId));

  const byRedemption = new Map<string, typeof sessions>();
  for (const ses of sessions) {
    if (!ses.accessRedemptionId) continue;
    const list = byRedemption.get(ses.accessRedemptionId) ?? [];
    list.push(ses);
    byRedemption.set(ses.accessRedemptionId, list);
  }

  const rows: CodeUsageRow[] = redemptions.map((r) => {
    const completed = parseAllowedInstruments(r.completedInstruments);
    const pending = allowed.filter((i) => !completed.includes(i));
    return {
      id: r.id,
      participantNombre: r.participantNombre,
      empresa: r.empresa,
      puesto: r.puesto,
      completedInstruments: completed,
      pendingInstruments: pending,
      progress: `${completed.length}/${allowed.length}`,
      createdAt: r.createdAt,
      sessions: (byRedemption.get(r.id) ?? []).map((ses) => ({
        id: ses.id,
        instrumento: ses.instrumento as Instrumento,
        iniciada: ses.iniciada,
        actualizada: ses.actualizada,
        aprobada: ses.aprobada,
        terminada: ses.terminada,
      })),
    };
  });

  return { code, allowed, rows };
}

/** Evita doble canje con el mismo nombre en el mismo código (fraude interno). */
export async function findExistingRedemption(codeId: string, nombre: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(schema.accessRedemptions)
    .where(
      and(
        eq(schema.accessRedemptions.accessCodeId, codeId),
        eq(schema.accessRedemptions.participantNombre, nombre.trim()),
      ),
    )
    .limit(1);
  return row ?? null;
}
