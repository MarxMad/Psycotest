import type { CSSProperties, ReactNode } from "react";
import type { ChannelDef } from "@/lib/channels";
import s from "./ChannelShell.module.css";

export function ChannelShell({
  channel,
  children,
}: {
  channel: ChannelDef;
  children: ReactNode;
}) {
  const style = {
    ...channel.theme.vars,
    "--ch-font-display": channel.theme.fontDisplay,
    "--ch-font-body": channel.theme.fontBody,
  } as CSSProperties;

  return (
    <div className={s.shell} style={style} data-channel={channel.id}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,500;9..144,700&family=IBM+Plex+Sans:wght@400;500;600&family=Libre+Baskerville:wght@400;700&family=Manrope:wght@400;600;700&family=Outfit:wght@500;700;800&family=Source+Sans+3:wght@400;600;700&family=Space+Grotesk:wght@500;700&display=swap');`}</style>
      <header className={`${s.nav} ${channel.id === "ceduct" ? s.navLight : ""}`}>
        <a href="/" className={s.brand}>
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
      <footer className={`${s.footer} ${channel.id === "ceduct" ? s.footerLight : ""}`}>
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
