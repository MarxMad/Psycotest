import type { CSSProperties, ReactNode } from "react";
import { channelPublicUrl, type ChannelDef } from "@/lib/channels";
import { FUENTES_CANAL } from "@/lib/channel-fonts";
import s from "./ChannelShell.module.css";

export function ChannelShell({
  channel,
  children,
}: {
  channel: ChannelDef;
  children: ReactNode;
}) {
  const fuentes = FUENTES_CANAL[channel.id];
  const style = {
    ...channel.theme.vars,
    "--ch-font-display": fuentes.display,
    "--ch-font-body": fuentes.body,
  } as CSSProperties;

  return (
    <div
      className={`${s.shell} ${fuentes.className}`}
      style={style}
      data-channel={channel.id}
    >
      <header
        className={`${s.nav} ${
          channel.id === "ceduct" ? s.navCeduct : channel.id === "psicologia" ? s.navPsico : ""
        }`}
      >
        <a href={channelPublicUrl(channel.id)} className={s.brand}>
          {channel.logo ? (
            <img
              src={channel.logo}
              alt=""
              className={`${s.brandLogo} ${channel.id === "ceduct" ? s.brandLogoWide : ""}`}
              width={channel.id === "ceduct" ? 56 : 40}
              height={channel.id === "ceduct" ? 42 : 40}
            />
          ) : null}
          <span className={s.brandText}>
            <span className={s.brandMark}>{channel.accentLabel}</span>
            <strong>{channel.name}</strong>
          </span>
        </a>
        <nav className={s.links} aria-label="Principal">
          {channel.nav.map((item) => (
            <a key={item.href + item.label} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
      </header>
      <main>{children}</main>
      <footer
        className={`${s.footer} ${
          channel.id === "ceduct" ? s.footerCeduct : channel.id === "psicologia" ? s.footerPsico : ""
        }`}
      >
        <div>
          <strong>{channel.legalName}</strong>
          <p>{channel.description}</p>
          {channel.id === "ceduct" && (
            <p className={s.eceFooter}>Clave de acreditación CONOCER: ECE 002-10</p>
          )}
        </div>
        <p className={s.copy}>
          © {new Date().getFullYear()} {channel.name}
        </p>
      </footer>
    </div>
  );
}
