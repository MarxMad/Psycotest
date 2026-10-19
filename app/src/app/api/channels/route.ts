import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { CHANNELS, CHANNEL_IDS } from "@/lib/channels";
import { listChannelPages } from "@/lib/channel-store";

export async function GET() {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const pages = await listChannelPages();
  const channels = CHANNEL_IDS.map((id) => ({
    ...CHANNELS[id],
    page: pages.find((p) => p.channelId === id) ?? null,
  }));
  return NextResponse.json({ channels });
}
