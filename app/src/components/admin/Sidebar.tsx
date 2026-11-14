"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  UserRound,
  FlaskConical,
  GraduationCap,
  Video,
  CreditCard,
  Mail,
  Users,
  ChevronLeft,
  LogOut,
  FolderOpen,
  Globe2,
  X,
} from "lucide-react";
import s from "./Sidebar.module.css";
import { APP_NAME } from "@/lib/brand";
import { NOMBRE_ROL, puedeVerSeccion, type Rol } from "@/lib/auth-rutas";
import type { ReactNode } from "react";

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  compact: boolean;
  onNavigate?: () => void;
}

function SidebarItem({ href, icon, label, compact, onNavigate }: SidebarItemProps) {
  const pathname = usePathname();
  const isActive =
    href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`${s.item} ${isActive ? s.itemActive : ""}`}
      title={compact ? label : undefined}
      onClick={onNavigate}
    >
      <span className={s.itemIcon}>{icon}</span>
      {!compact && (
        <motion.span
          className={s.itemLabel}
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: "auto" }}
          exit={{ opacity: 0, width: 0 }}
        >
          {label}
        </motion.span>
      )}
    </Link>
  );
}

interface SidebarProps {
  user: { nombre: string; email: string; rol?: string } | null;
  onLogout: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

/**
 * Menú del panel. Cada rol ve solo lo que puede abrir, con la misma regla que
 * aplican el middleware y el layout (esto solo evita mostrar caminos muertos).
 */
const NAV: { href: string; label: string; icon: ReactNode }[] = [
  { href: "/admin", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
  { href: "/admin/pruebas", label: "Pruebas", icon: <FlaskConical size={20} /> },
  { href: "/admin/participantes", label: "Participantes", icon: <UserRound size={20} /> },
  { href: "/admin/cursos", label: "Cursos", icon: <GraduationCap size={20} /> },
  { href: "/admin/clases-vivo", label: "Clases en Vivo", icon: <Video size={20} /> },
  { href: "/admin/expedientes", label: "Expedientes", icon: <FolderOpen size={20} /> },
  { href: "/admin/canales", label: "Canales", icon: <Globe2 size={20} /> },
  { href: "/admin/pagos", label: "Pagos", icon: <CreditCard size={20} /> },
  { href: "/admin/marketing", label: "Marketing", icon: <Mail size={20} /> },
  { href: "/admin/usuarios", label: "Usuarios", icon: <Users size={20} /> },
];

export function Sidebar({
  user,
  onLogout,
  isCollapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  // En drawer móvil siempre mostramos labels aunque el desktop esté colapsado
  const compact = isCollapsed && !mobileOpen;
  const rol = user?.rol as Rol | undefined;
  const navVisible = rol ? NAV.filter((item) => puedeVerSeccion(rol, item.href)) : [];

  return (
    <aside
      className={`${s.sidebar} ${isCollapsed ? s.sidebarCollapsed : ""} ${mobileOpen ? s.open : ""}`}
    >
      <div className={s.sidebarInner}>
        <div className={s.header}>
          {!compact && (
            <motion.div
              className={s.headerContent}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h2 className={s.headerTitle}>{APP_NAME}</h2>
              <span className={s.headerSubtitle}>{rol ? NOMBRE_ROL[rol] ?? "Panel" : "Panel"}</span>
            </motion.div>
          )}
          <button
            type="button"
            onClick={onToggleCollapse}
            className={`${s.toggleBtn} ${s.toggleDesktop}`}
            aria-label={isCollapsed ? "Expandir sidebar" : "Contraer sidebar"}
          >
            <ChevronLeft
              size={18}
              style={{
                transform: isCollapsed ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
              }}
            />
          </button>
          <button
            type="button"
            onClick={onCloseMobile}
            className={`${s.toggleBtn} ${s.toggleMobile}`}
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>

        <nav className={s.nav} aria-label="Navegación admin">
          {navVisible.map((item) => (
            <SidebarItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              compact={compact}
              onNavigate={onCloseMobile}
            />
          ))}
        </nav>

        <div className={s.footer}>
          {user && (
            <div className={s.user}>
              <div className={s.userAvatar}>
                {user.nombre
                  .split(" ")
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join("")}
              </div>
              {!compact && (
                <motion.div
                  className={s.userInfo}
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                >
                  <span className={s.userName}>{user.nombre}</span>
                  <span className={s.userEmail}>{user.email}</span>
                </motion.div>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={onLogout}
            className={s.logoutBtn}
            title={compact ? "Cerrar sesión" : undefined}
          >
            <LogOut size={18} />
            {!compact && <span>Salir</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
