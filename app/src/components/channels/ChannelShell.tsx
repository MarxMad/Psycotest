import type { ReactNode } from "react";
import { channelPublicUrl, type ChannelDef } from "@/lib/channels";
import { clasesDeCanal, estiloDeCanal } from "@/lib/tema-canal";
import s from "./ChannelShell.module.css";

/**
 * Cáscara de un sitio de canal: encabezado, contenido y pie.
 *
 * El tema va por `estiloDeCanal`, que además de los tokens `--ch-*` deja los
 * alias de la paleta original (`--ink`, `--paper`, `--brand`…). Así una
 * página interna escrita con esos tokens —la ficha de un curso, por
 * ejemplo— se pinta con la identidad del canal sin reescribir su CSS.
 */
export function ChannelShell({
  channel,
  children,
}: {
  channel: ChannelDef;
  children: ReactNode;
}) {
  const home = channelPublicUrl(channel.id);

  // Las entradas del menú son anclas de la portada. Fuera de ella no hay
  // nada que buscar: hay que volver a la portada y luego bajar a la sección.
  const destino = (href: string) => (href.startsWith("#") ? `${home}${href}` : href);

  return (
    <div
      className={`${s.shell} ${clasesDeCanal(channel.id)}`}
      style={estiloDeCanal(channel.id)}
      data-channel={channel.id}
    >
      <header
        className={`${s.nav} ${
          channel.id === "ceduct" ? s.navCeduct : channel.id === "psicologia" ? s.navPsico : ""
        }`}
      >
        <a href={home} className={s.brand}>
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
            <a key={item.href + item.label} href={destino(item.href)}>
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
