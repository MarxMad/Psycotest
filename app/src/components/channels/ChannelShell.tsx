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
      <header className={s.nav}>
        <a href="/" className={s.brand}>
          <span className={s.brandMark}>{channel.accentLabel}</span>
          <strong>{channel.name}</strong>
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
      <footer className={s.footer}>
        <div>
          <strong>{channel.legalName}</strong>
          <p>{channel.description}</p>
        </div>
        <p className={s.copy}>
          © {new Date().getFullYear()} {channel.name}
        </p>
      </footer>
    </div>
  );
}
