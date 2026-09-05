"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FlaskConical,
  GraduationCap,
  Video,
  CreditCard,
  Mail,
  Users,
  ChevronLeft,
  LogOut,
  X,
} from "lucide-react";
import s from "./Sidebar.module.css";

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
  user: { nombre: string; email: string } | null;
  onLogout: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

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
              <h2 className={s.headerTitle}>PsycoTest</h2>
              <span className={s.headerSubtitle}>Panel Admin</span>
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
          <SidebarItem
            href="/admin"
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            compact={compact}
            onNavigate={onCloseMobile}
          />
          <SidebarItem
            href="/admin/pruebas"
            icon={<FlaskConical size={20} />}
            label="Pruebas"
            compact={compact}
            onNavigate={onCloseMobile}
          />
          <SidebarItem
            href="/admin/cursos"
            icon={<GraduationCap size={20} />}
            label="Cursos"
            compact={compact}
            onNavigate={onCloseMobile}
          />
          <SidebarItem
            href="/admin/clases-vivo"
            icon={<Video size={20} />}
            label="Clases en Vivo"
            compact={compact}
            onNavigate={onCloseMobile}
          />
          <SidebarItem
            href="/admin/pagos"
            icon={<CreditCard size={20} />}
            label="Pagos"
            compact={compact}
            onNavigate={onCloseMobile}
          />
          <SidebarItem
            href="/admin/marketing"
            icon={<Mail size={20} />}
            label="Marketing"
            compact={compact}
            onNavigate={onCloseMobile}
          />
          <SidebarItem
            href="/admin/usuarios"
            icon={<Users size={20} />}
            label="Usuarios"
            compact={compact}
            onNavigate={onCloseMobile}
          />
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
