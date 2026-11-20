"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { ChannelId } from "@/lib/channels";
import { AREA_BASE, SECCIONES_ALUMNO, TITULO_AREA } from "@/lib/area-alumno";
import { LOGO_DE_MARCA } from "@/lib/logos-marca";
import { FUENTES_CANAL } from "@/lib/channel-fonts";
import { CHANNELS } from "@/lib/channels";
import s from "./area.module.css";
import { rutaDeSalida } from "@/lib/salir";

/**
 * Cáscara de la zona privada. Hereda el color y la tipografía del canal por
 * el que llegó la persona, para que no sienta que cambió de sitio al entrar.
 */
export function AreaShell({
  canal,
  nombre,
  marca,
  children,
}: {
  canal: ChannelId;
  nombre: string;
  marca: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname() || "";
  const [abierto, setAbierto] = useState(false);

  async function salir() {
    await fetch("/api/auth/login", { method: "DELETE" });
    router.push(rutaDeSalida());
    router.refresh();
  }

  // «Inicio» (el resumen) va primero; luego las secciones de la marca.
  const secciones = [{ href: AREA_BASE, label: "Inicio" }, ...SECCIONES_ALUMNO[canal]];
  const fuentes = FUENTES_CANAL[canal];
  const tema = CHANNELS[canal].theme.vars as Record<string, string>;

  const activo = (href: string) =>
    href === AREA_BASE ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div
      className={`${s.area} ${fuentes.className}`}
      data-canal={canal}
      style={{
        ...tema,
        "--ch-font-display": fuentes.display,
        "--ch-font-body": fuentes.body,
      } as React.CSSProperties}
    >
      <header className={s.header}>
        <div className={s.headerInner}>
          <Link href={AREA_BASE} className={s.brand}>
            <span className={s.brandMark} data-canal={canal} aria-hidden>
              <img src={LOGO_DE_MARCA[canal]} alt="" />
            </span>
            <span className={s.brandText}>
              <strong>{TITULO_AREA[canal]}</strong>
              <small>{marca}</small>
            </span>
          </Link>

          <nav className={s.nav} aria-label="Secciones de mi cuenta">
            {secciones.map((sec) => (
              <Link
                key={sec.href}
                href={sec.href}
                className={s.navLink}
                data-activo={activo(sec.href) || undefined}
                aria-current={activo(sec.href) ? "page" : undefined}
              >
                {sec.label}
              </Link>
            ))}
          </nav>

          <div className={s.acciones}>
            <span className={s.nombre} title={nombre}>
              {nombre.split(" ")[0]}
            </span>
            <button type="button" className={s.salir} onClick={salir}>
              Salir
            </button>
            <button
              type="button"
              className={s.menuBtn}
              aria-expanded={abierto}
              onClick={() => setAbierto((v) => !v)}
            >
              {abierto ? "Cerrar" : "Menú"}
            </button>
          </div>
        </div>

        {abierto && (
          <div className={s.movil} role="dialog" aria-label="Menú">
            {secciones.map((sec) => (
              <Link
                key={sec.href}
                href={sec.href}
                className={s.movilLink}
                data-activo={activo(sec.href) || undefined}
                onClick={() => setAbierto(false)}
              >
                {sec.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      <main className={s.main}>{children}</main>
    </div>
  );
}
