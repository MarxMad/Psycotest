"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { CONSULTORIO } from "@/lib/consultorio-brand";
import { NAV_MORE, NAV_PRIMARY, NAV_SCROLL } from "@/lib/consultorio-content";
import styles from "./consultorio.module.css";

export function ConsultorioNav() {
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(true);
  const moreRef = useRef<HTMLDivElement>(null);
  const moreId = useId();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!moreOpen) return;
    function onDoc(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMoreOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [moreOpen]);

  function closeAll() {
    setOpen(false);
    setMoreOpen(false);
  }

  return (
    <header className={styles.header} data-anime="nav">
      <div className={styles.headerInner}>
        <Link href="/" className={styles.brand} onClick={closeAll}>
          <span className={styles.brandMark} aria-hidden>
            SP
          </span>
          <span className={styles.brandText}>
            <strong>Sistema Psic</strong>
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

          <div className={`${styles.navDropdown} ${styles.navDropdownDesktop}`} ref={moreRef}>
            <button
              type="button"
              className={styles.navDropdownBtn}
              aria-expanded={moreOpen}
              aria-controls={moreId}
              onClick={() => setMoreOpen((v) => !v)}
            >
              Plataforma
              <span className={styles.navDropdownCaret} aria-hidden>
                ▾
              </span>
            </button>
            {moreOpen ? (
              <div id={moreId} className={styles.navDropdownPanel} role="menu">
                {NAV_MORE.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={styles.navDropdownItem}
                    role="menuitem"
                    onClick={closeAll}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          {NAV_PRIMARY.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={
                item.label === "Acceder" ? styles.navCta : `${styles.navCta} ${styles.navCtaAlt}`
              }
              onClick={closeAll}
            >
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
              onClick={closeAll}
            >
              {item.label}
            </Link>
          ))}

          <button
            type="button"
            className={styles.mobileAccordionBtn}
            aria-expanded={mobileMoreOpen}
            onClick={() => setMobileMoreOpen((v) => !v)}
          >
            Plataforma {mobileMoreOpen ? "▴" : "▾"}
          </button>
          {mobileMoreOpen
            ? NAV_MORE.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={styles.mobileLinkNested}
                  onClick={closeAll}
                >
                  {item.label}
                </Link>
              ))
            : null}

          <div className={styles.mobileCtas}>
            {NAV_PRIMARY.map((item) => (
              <Link key={item.label} href={item.href} className={styles.navCta} onClick={closeAll}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}
