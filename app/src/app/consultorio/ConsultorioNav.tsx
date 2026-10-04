"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV_ALUMNO, NAV_PRIMARY } from "@/lib/consultorio-content";
import styles from "./consultorio.module.css";

/**
 * Encabezado del área de alumno. Marca la sección activa para que la
 * persona sepa siempre en qué parte de su formación está.
 */
export function ConsultorioNav() {
  const pathname = usePathname() || "";
  const [abierto, setAbierto] = useState(false);

  // El menú móvil se cierra al cambiar de sección
  useEffect(() => {
    setAbierto(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = abierto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [abierto]);

  const activo = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link href="/consultorio/cursos" className={styles.brand}>
          <span className={styles.brandMark} aria-hidden>
            SP
          </span>
          <span className={styles.brandText}>
            <strong>Área de alumno</strong>
            <small>Formación y certificación</small>
          </span>
        </Link>

        <nav className={styles.navDesktop} aria-label="Secciones">
          {NAV_ALUMNO.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={styles.navLink}
              data-activo={activo(item.href) || undefined}
              aria-current={activo(item.href) ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.headerActions}>
          {NAV_PRIMARY.map((item) => (
            <Link key={item.href} href={item.href} className={styles.navCta}>
              {item.label}
            </Link>
          ))}
          <button
            type="button"
            className={styles.menuBtn}
            aria-expanded={abierto}
            onClick={() => setAbierto((v) => !v)}
          >
            {abierto ? "Cerrar" : "Menú"}
          </button>
        </div>
      </div>

      {abierto && (
        <div className={styles.mobileNav} role="dialog" aria-label="Menú">
          {NAV_ALUMNO.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={styles.mobileLink}
              data-activo={activo(item.href) || undefined}
            >
              {item.label}
            </Link>
          ))}
          {NAV_PRIMARY.map((item) => (
            <Link key={item.href} href={item.href} className={styles.navCta}>
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
