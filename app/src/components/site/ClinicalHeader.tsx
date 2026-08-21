"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CONSULTORIO } from "@/lib/consultorio-brand";
import { psycotest } from "@/lib/routes";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import styles from "@/app/consultorio/consultorio.module.css";

interface AuthUser {
  nombre: string;
  email: string;
}

function iniciales(nombre: string) {
  return nombre
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function ClinicalHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setUser(data?.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  async function logout() {
    await fetch("/api/auth/login", { method: "DELETE" });
    setUser(null);
    router.push(psycotest.login);
    router.refresh();
  }

  const link = (href: string, label: string, active: boolean) => (
    <Link
      key={href}
      href={href}
      className={active ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink}
      onClick={() => setOpen(false)}
    >
      {label}
    </Link>
  );

  const enPanel = pathname.startsWith(psycotest.admin);
  const enParticipantes = pathname.startsWith(psycotest.participantes);
  const enHome = pathname === psycotest.home;
  const enCodigos = pathname.startsWith(psycotest.codigos);

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link href="/" className={styles.brand} onClick={() => setOpen(false)}>
          <span className={styles.brandMark} aria-hidden>
            MH
          </span>
          <span className={styles.brandText}>
            <strong>{CONSULTORIO.shortName}</strong>
            <small>Panel de evaluación psicométrica</small>
          </span>
        </Link>

        <nav className={styles.navDesktop} aria-label="Panel clínico">
          {link(psycotest.home, "Aplicación", enHome)}
          {ready && user ? (
            <>
              {link(psycotest.admin, "Panel", enPanel && !enCodigos)}
              {link(psycotest.codigos, "Códigos", enCodigos)}
              {link(psycotest.participantes, "Participantes", enParticipantes)}
            </>
          ) : null}
          {link("/consultorio/cursos", "Cursos", pathname.startsWith("/consultorio/cursos"))}
        </nav>

        <div className={styles.headerActions}>
          <ThemeToggle className={styles.themeToggle} />
          {ready && user ? (
            <>
              <span className={styles.userBadge} title={user.email}>
                {iniciales(user.nombre)}
              </span>
              <button type="button" className={styles.navGhost} onClick={logout}>
                Salir
              </button>
            </>
          ) : ready ? (
            <Link href={psycotest.login} className={styles.btnPrimary}>
              Acceso profesional
            </Link>
          ) : null}
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
        <div className={styles.mobileNav} role="dialog" aria-label="Menú panel">
          {link(psycotest.home, "Aplicación", enHome)}
          {ready && user ? (
            <>
              {link(psycotest.admin, "Panel", enPanel && !enCodigos)}
              {link(psycotest.codigos, "Códigos", enCodigos)}
              {link(psycotest.participantes, "Participantes", enParticipantes)}
            </>
          ) : null}
          {link("/consultorio/cursos", "Cursos", pathname.startsWith("/consultorio/cursos"))}
          {ready && user ? (
            <button type="button" className={styles.mobileLink} onClick={logout}>
              Cerrar sesión
            </button>
          ) : (
            <Link href={psycotest.login} className={styles.mobileLink} onClick={() => setOpen(false)}>
              Acceso profesional
            </Link>
          )}
        </div>
      ) : null}
    </header>
  );
}
