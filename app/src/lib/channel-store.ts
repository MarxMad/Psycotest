import { mkdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import {
  CHANNEL_CONTENT_SEED,
  type ChannelPageContent,
} from "./channel-content";
import { CHANNEL_IDS, type ChannelId } from "./channels";

function storePath() {
  const dir = process.env.VERCEL
    ? path.join("/tmp", "sistemapsic-channels")
    : path.join(process.cwd(), "data");
  mkdirSync(dir, { recursive: true });
  return path.join(dir, "channel-pages.json");
}

function readAll(): Record<ChannelId, ChannelPageContent> {
  const file = storePath();
  if (!existsSync(file)) {
    return structuredClone(CHANNEL_CONTENT_SEED);
  }
  try {
    const raw = JSON.parse(readFileSync(file, "utf8")) as Record<
      string,
      ChannelPageContent
    >;
    const merged = structuredClone(CHANNEL_CONTENT_SEED);
    for (const id of CHANNEL_IDS) {
      if (raw[id]) merged[id] = { ...merged[id], ...raw[id], channelId: id };
    }
    return merged;
  } catch {
    return structuredClone(CHANNEL_CONTENT_SEED);
  }
}

function writeAll(data: Record<ChannelId, ChannelPageContent>) {
  writeFileSync(storePath(), JSON.stringify(data, null, 2), "utf8");
}

export function listChannelPages(): ChannelPageContent[] {
  const all = readAll();
  return CHANNEL_IDS.map((id) => all[id]);
}

export function getChannelPage(id: ChannelId): ChannelPageContent {
  return readAll()[id];
}

export function updateChannelPage(
  id: ChannelId,
  patch: {
    seoTitle?: string;
    seoDescription?: string;
    published?: boolean;
    hero?: Partial<ChannelPageContent["hero"]>;
    sections?: ChannelPageContent["sections"];
  },
): ChannelPageContent {
  const all = readAll();
  const current = all[id];
  const next: ChannelPageContent = {
    ...current,
    seoTitle: patch.seoTitle ?? current.seoTitle,
    seoDescription: patch.seoDescription ?? current.seoDescription,
    published: patch.published ?? current.published,
    hero: patch.hero ? { ...current.hero, ...patch.hero } : current.hero,
    sections: patch.sections ?? current.sections,
    channelId: id,
    updatedAt: new Date().toISOString(),
  };
  all[id] = next;
  writeAll(all);
  return next;
}
