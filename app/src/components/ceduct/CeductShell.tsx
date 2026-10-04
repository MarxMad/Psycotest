import type { ReactNode } from "react";
import Link from "next/link";
import { CHANNELS } from "@/lib/channels";
import { FUENTES_CANAL } from "@/lib/channel-fonts";
import { BotonCarrito } from "./BotonCarrito";
import s from "./ceduct.module.css";

/**
 * Cáscara de las páginas de diplomados: hereda la identidad de CEDUCT
 * para que comprar no se sienta salir del sitio.
 */
export function CeductShell({ children }: { children: ReactNode }) {
  const canal = CHANNELS.ceduct;
  const fuentes = FUENTES_CANAL.ceduct;

  return (
    <div
      className={`${s.shell} ${fuentes.className}`}
      style={
        {
          ...(canal.theme.vars as Record<string, string>),
          "--ch-font-display": fuentes.display,
          "--ch-font-body": fuentes.body,
        } as React.CSSProperties
      }
    >
      <header className={s.nav}>
        <div className={s.navInterior}>
          <Link href="/sites/ceduct" className={s.marca}>
            <span className={s.marcaClave}>ECE 002-10</span>
            <strong>CEDUCT</strong>
          </Link>
          <nav className={s.navLinks} aria-label="Principal">
            <Link href="/diplomados">Diplomados</Link>
            <Link href="/sites/ceduct#certificaciones">Certificaciones</Link>
            <Link href="/sites/ceduct#proceso">Proceso</Link>
          </nav>
          <BotonCarrito />
        </div>
      </header>

      <main>{children}</main>

      <footer className={s.pie}>
        <div className={s.pieInterior}>
          <div>
            <strong>{canal.legalName}</strong>
            <p>Clave de acreditación CONOCER: ECE 002-10</p>
          </div>
          <p className={s.pieCopy}>
            © {new Date().getFullYear()} {canal.name}
          </p>
        </div>
      </footer>
    </div>
  );
}
