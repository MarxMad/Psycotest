"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { CONSULTORIO } from "@/lib/consultorio-brand";
import { NAV_ACTIONS, NAV_SCROLL } from "@/lib/consultorio-content";
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

        <nav className={styles.navDesktop} aria-label="Secciones">
          {NAV_SCROLL.map((item) => (
            <Link key={item.label} href={item.href} className={styles.navLink}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.headerActions}>
          <ThemeToggle />
          {NAV_ACTIONS.map((item) => (
            <Link key={item.label} href={item.href} className={styles.navCta}>
              {item.label}
            </Link>
          ))}
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
          {NAV_SCROLL.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={styles.mobileLink}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <div className={styles.mobileCtas}>
            {NAV_ACTIONS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={styles.navCta}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}
