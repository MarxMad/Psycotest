"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CONSULTORIO } from "@/lib/consultorio-brand";
import { psycotest } from "@/lib/routes";
import { NAV_LINKS } from "@/lib/consultorio-content";
import styles from "./consultorio.module.css";

export function ConsultorioNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link href="/" className={styles.brand} onClick={() => setOpen(false)}>
          <span className={styles.brandMark} aria-hidden>
            MH
          </span>
          <span className={styles.brandText}>
            <strong>{CONSULTORIO.shortName}</strong>
            <small>{CONSULTORIO.practiceTitle}</small>
          </span>
        </Link>

        <nav className={styles.navDesktop} aria-label="Principal">
          {NAV_LINKS.map((item) =>
            item.href.startsWith("/") && !item.href.includes("#") ? (
              <Link key={item.label} href={item.href} className={styles.navLink}>
                {item.label}
              </Link>
            ) : (
              <a key={item.label} href={item.href} className={styles.navLink}>
                {item.label}
              </a>
            ),
          )}
        </nav>

        <div className={styles.headerActions}>
          <Link href="/consultorio/ingreso" className={styles.navGhost}>
            Acceder
          </Link>
          <Link href={psycotest.home} className={styles.navGhost}>
            Panel evaluación
          </Link>
          <a href="#conocer" className={styles.btnPrimary}>
            Certificarse
          </a>
          <button
            type="button"
            className={styles.menuBtn}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Cerrar" : "Menú"}
          </button>
        </div>
      </div>

      {open ? (
        <div className={styles.mobileNav} role="dialog" aria-label="Menú">
          {NAV_LINKS.map((item) =>
            item.href.startsWith("/") && !item.href.includes("#") ? (
              <Link key={item.label} href={item.href} className={styles.mobileLink} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ) : (
              <a key={item.label} href={item.href} className={styles.mobileLink} onClick={() => setOpen(false)}>
                {item.label}
              </a>
            ),
          )}
          <Link href="/consultorio/ingreso" className={styles.mobileLink} onClick={() => setOpen(false)}>
            Acceder a cursos
          </Link>
          <Link href={psycotest.home} className={styles.mobileLink} onClick={() => setOpen(false)}>
            Panel de evaluación
          </Link>
        </div>
      ) : null}
    </header>
  );
}
