/**
 * Contenido editable de las páginas públicas (canales).
 *
 * Persiste en Postgres/Supabase, no en disco: el sistema de archivos de Vercel
 * es efímero y cualquier edición hecha desde /admin/canales se perdería en el
 * siguiente deploy o cold start.
 *
 * Si la base no responde, se devuelve el contenido semilla para que la página
 * pública nunca se caiga por un problema de persistencia.
 */

import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { channelPages } from "@/db/schema";
import { CHANNEL_CONTENT_SEED, type ChannelPageContent } from "./channel-content";
import { CHANNEL_IDS, type ChannelId } from "./channels";

function semilla(id: ChannelId): ChannelPageContent {
  return structuredClone(CHANNEL_CONTENT_SEED[id]);
}

/** Durante `next build` no hay base disponible: se usa la semilla sin ruido. */
function enBuild(): boolean {
  return (
    !process.env.DATABASE_URL?.trim() &&
    (process.env.NEXT_PHASE === "phase-production-build" ||
      process.env.npm_lifecycle_event === "build")
  );
}

function desdeFila(row: {
  channelId: string;
  seoTitle: string;
  seoDescription: string;
  published: boolean;
  hero: unknown;
  sections: unknown;
  updatedAt: string;
}): ChannelPageContent {
  const base = semilla(row.channelId as ChannelId);
  return {
    channelId: row.channelId as ChannelId,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    published: row.published,
    hero: (row.hero as ChannelPageContent["hero"]) ?? base.hero,
    sections: (row.sections as ChannelPageContent["sections"]) ?? base.sections,
    updatedAt: row.updatedAt,
  };
}

/** Siembra el canal en la base la primera vez que se consulta. */
async function asegurarFila(id: ChannelId): Promise<ChannelPageContent> {
  const db = getDb();
  const base = semilla(id);
  await db
    .insert(channelPages)
    .values({
      channelId: id,
      seoTitle: base.seoTitle,
      seoDescription: base.seoDescription,
      published: base.published,
      hero: base.hero,
      sections: base.sections,
      updatedAt: base.updatedAt,
    })
    .onConflictDoNothing({ target: channelPages.channelId });
  return base;
}

export async function getChannelPage(id: ChannelId): Promise<ChannelPageContent> {
  if (enBuild()) return semilla(id);
  try {
    const db = getDb();
    const [row] = await db.select().from(channelPages).where(eq(channelPages.channelId, id)).limit(1);
    if (row) return desdeFila(row);
    return await asegurarFila(id);
  } catch (error) {
    console.error(`[canales] no se pudo leer "${id}" de la base, se usa el contenido base:`, error);
    return semilla(id);
  }
}

export async function listChannelPages(): Promise<ChannelPageContent[]> {
  if (enBuild()) return CHANNEL_IDS.map((id) => semilla(id));
  try {
    const db = getDb();
    const rows = await db.select().from(channelPages);
    const porId = new Map(rows.map((r) => [r.channelId, desdeFila(r)]));
    return CHANNEL_IDS.map((id) => porId.get(id) ?? semilla(id));
  } catch (error) {
    console.error("[canales] no se pudo listar desde la base, se usa el contenido base:", error);
    return CHANNEL_IDS.map((id) => semilla(id));
  }
}

export async function updateChannelPage(
  id: ChannelId,
  patch: {
    seoTitle?: string;
    seoDescription?: string;
    published?: boolean;
    hero?: Partial<ChannelPageContent["hero"]>;
    sections?: ChannelPageContent["sections"];
  },
): Promise<ChannelPageContent> {
  const db = getDb();
  const actual = await getChannelPage(id);

  const siguiente: ChannelPageContent = {
    ...actual,
    seoTitle: patch.seoTitle ?? actual.seoTitle,
    seoDescription: patch.seoDescription ?? actual.seoDescription,
    published: patch.published ?? actual.published,
    hero: patch.hero ? { ...actual.hero, ...patch.hero } : actual.hero,
    sections: patch.sections ?? actual.sections,
    channelId: id,
    updatedAt: new Date().toISOString(),
  };

  await db
    .insert(channelPages)
    .values({
      channelId: id,
      seoTitle: siguiente.seoTitle,
      seoDescription: siguiente.seoDescription,
      published: siguiente.published,
      hero: siguiente.hero,
      sections: siguiente.sections,
      updatedAt: siguiente.updatedAt,
    })
    .onConflictDoUpdate({
      target: channelPages.channelId,
      set: {
        seoTitle: siguiente.seoTitle,
        seoDescription: siguiente.seoDescription,
        published: siguiente.published,
        hero: siguiente.hero,
        sections: siguiente.sections,
        updatedAt: siguiente.updatedAt,
      },
    });

  return siguiente;
}
