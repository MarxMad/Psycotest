"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/admin/Sidebar";
import { useAdminSidebar } from "@/hooks/useAdmin";
import s from "./admin-layout.module.css";

interface AuthUser {
  nombre: string;
  email: string;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { isCollapsed, toggle, mobileOpen, openMobile, closeMobile, mounted } =
    useAdminSidebar();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => {
        if (!r.ok) throw new Error("Not authenticated");
        return r.json();
      })
      .then((data) => {
        setUser(data?.user ?? null);
        setLoading(false);
      })
      .catch(() => {
        router.push("/login");
      });
  }, [router]);

  // Cerrar drawer al cambiar de ruta en móvil
  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  const handleLogout = async () => {
    await fetch("/api/auth/login", { method: "DELETE" });
    setUser(null);
    router.push("/login");
    router.refresh();
  };

  if (loading || !mounted) {
    return (
      <div className={s.loading}>
        <div className={s.loadingSpinner} />
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div
      className={s.adminLayout}
      data-collapsed={isCollapsed ? "true" : "false"}
      data-mobile-open={mobileOpen ? "true" : "false"}
    >
      <header className={s.mobileTopbar}>
        <button
          type="button"
          className={s.menuBtn}
          onClick={openMobile}
          aria-label="Abrir menú"
          aria-expanded={mobileOpen}
        >
          <Menu size={22} />
        </button>
        <div className={s.mobileBrand}>
          <span className={s.mobileTitle}>PsycoTest</span>
          <span className={s.mobileSubtitle}>Admin</span>
        </div>
      </header>

      {mobileOpen ? (
        <button
          type="button"
          className={s.backdrop}
          aria-label="Cerrar menú"
          onClick={closeMobile}
        />
      ) : null}

      <Sidebar
        user={user}
        onLogout={handleLogout}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggle}
        mobileOpen={mobileOpen}
        onCloseMobile={closeMobile}
      />

      <main className={s.mainContent}>{children}</main>
    </div>
  );
}
