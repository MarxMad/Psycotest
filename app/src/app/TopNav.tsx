"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

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

function NavLink({
  href,
  children,
  active,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link href={href} className={active ? "topnav-link topnav-link--active" : "topnav-link"}>
      {children}
    </Link>
  );
}

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setUser(data?.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/login", { method: "DELETE" });
    setUser(null);
    router.push("/login");
    router.refresh();
  }

  const enPanel = pathname.startsWith("/admin");
  const enParticipantes = pathname.startsWith("/participantes");
  const enLogin = pathname.startsWith("/login");

  return (
    <nav className="topnav" aria-label="Navegación principal">
      <NavLink href="/" active={pathname === "/"}>
        Aplicación
      </NavLink>

      {ready && user ? (
        <>
          <NavLink href="/participantes" active={enParticipantes}>
            Participantes
          </NavLink>
          <div className="topnav-user">
            <span className="topnav-avatar" title={user.email}>
              {iniciales(user.nombre)}
            </span>
            <button type="button" className="topnav-btn" onClick={logout}>
              Salir
            </button>
          </div>
        </>
      ) : ready ? (
        <Link
          href="/login"
          className={enLogin ? "topnav-cta topnav-cta--active" : "topnav-cta"}
        >
          Acceso profesional
        </Link>
      ) : (
        <span className="topnav-skeleton" aria-hidden />
      )}
    </nav>
  );
}

export function BrandDot() {
  return (
    <motion.span
      className="dot"
      animate={{ scale: [1, 1.15, 1], opacity: [1, 0.85, 1] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}
