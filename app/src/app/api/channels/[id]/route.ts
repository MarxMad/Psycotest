import { NextResponse } from "next/server";
import { logAudit, requireUser } from "@/lib/auth";
import { CHANNELS, getChannel, type ChannelId } from "@/lib/channels";
import { getChannelPage, updateChannelPage } from "@/lib/channel-store";
import type { ChannelHero, ChannelSection } from "@/lib/channel-content";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const channel = getChannel(id);
  if (!channel) return NextResponse.json({ error: "Canal no encontrado" }, { status: 404 });
  return NextResponse.json({ channel, page: getChannelPage(channel.id) });
}

export async function PATCH(request: Request, { params }: Params) {
  let user;
  try {
    user = await requireUser(["admin", "psicologo"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  if (!CHANNELS[id as ChannelId]) {
    return NextResponse.json({ error: "Canal no encontrado" }, { status: 404 });
  }

  const body = (await request.json()) as {
    seoTitle?: string;
    seoDescription?: string;
    published?: boolean;
    hero?: ChannelHero;
    sections?: ChannelSection[];
  };

  const page = updateChannelPage(id as ChannelId, {
    seoTitle: body.seoTitle,
    seoDescription: body.seoDescription,
    published: body.published,
    hero: body.hero,
    sections: body.sections,
  });
  await logAudit(user.id, "update", "channel_page", id, {
    fields: Object.keys(body),
  });
  return NextResponse.json({ page });
}
