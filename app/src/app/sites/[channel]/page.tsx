import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CeductLanding } from "@/components/channels/CeductLanding";
import { ChannelLanding } from "@/components/channels/ChannelLanding";
import { ChannelShell } from "@/components/channels/ChannelShell";
import { PsicologiaLanding } from "@/components/channels/PsicologiaLanding";
import { getChannel, type ChannelId, CHANNEL_IDS } from "@/lib/channels";
import { getChannelPage } from "@/lib/channel-store";

type Props = { params: Promise<{ channel: string }> };

export function generateStaticParams() {
  return CHANNEL_IDS.map((channel) => ({ channel }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { channel: id } = await params;
  if (!CHANNEL_IDS.includes(id as ChannelId)) return {};
  const content = getChannelPage(id as ChannelId);
  return {
    title: content.seoTitle,
    description: content.seoDescription,
  };
}

export default async function ChannelSitePage({ params }: Props) {
  const { channel: id } = await params;
  const channel = getChannel(id);
  if (!channel) notFound();
  const content = getChannelPage(channel.id);

  let landing = <ChannelLanding channel={channel} content={content} />;
  if (channel.id === "ceduct") {
    landing = <CeductLanding channel={channel} content={content} />;
  } else if (channel.id === "psicologia") {
    landing = <PsicologiaLanding channel={channel} content={content} />;
  }

  return <ChannelShell channel={channel}>{landing}</ChannelShell>;
}
