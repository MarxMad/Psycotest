/**
 * Reescribe el contenido de un canal en la base con la semilla del repositorio.
 *
 * Las páginas públicas leen de `channel_pages`, no de `channel-content.ts`:
 * cambiar el copy en el código no se ve hasta correr esto.
 *
 *   npm run canal:sembrar -- psicologia
 *
 * Ojo: pisa lo que se haya editado desde /admin/canales para ese canal.
 */
import { config } from "dotenv";
import { eq } from "drizzle-orm";
import type { ChannelId } from "@/lib/channels";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const { getDb } = await import("./index");
  const { channelPages } = await import("./schema");
  const { CHANNEL_CONTENT_SEED } = await import("@/lib/channel-content");
  const { CHANNEL_IDS } = await import("@/lib/channels");

  const pedidos = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  const ids = (pedidos.length ? pedidos : CHANNEL_IDS) as ChannelId[];

  const desconocido = ids.find((id) => !CHANNEL_IDS.includes(id));
  if (desconocido) {
    console.error(`Canal desconocido: "${desconocido}". Opciones: ${CHANNEL_IDS.join(", ")}`);
    process.exit(1);
  }

  const db = getDb();

  for (const id of ids) {
    const base = CHANNEL_CONTENT_SEED[id];
    const [antes] = await db
      .select({ headline: channelPages.hero })
      .from(channelPages)
      .where(eq(channelPages.channelId, id))
      .limit(1);

    const valores = {
      channelId: id,
      seoTitle: base.seoTitle,
      seoDescription: base.seoDescription,
      published: base.published,
      hero: base.hero,
      sections: base.sections,
      updatedAt: new Date().toISOString(),
    };

    await db
      .insert(channelPages)
      .values(valores)
      .onConflictDoUpdate({ target: channelPages.channelId, set: valores });

    const previo = (antes?.headline as { headline?: string } | undefined)?.headline;
    console.log(`✓ ${id}`);
    if (previo && previo !== base.hero.headline) {
      console.log(`    antes: ${previo}`);
      console.log(`    ahora: ${base.hero.headline}`);
    }
  }

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
