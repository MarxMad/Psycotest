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
} from "lucide-react";
import { useAdminSidebar } from "@/hooks/useAdmin";
import s from "./Sidebar.module.css";

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isCollapsed: boolean;
  badge?: number;
}

function SidebarItem({ href, icon, label, isCollapsed, badge }: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={`${s.item} ${isActive ? s.itemActive : ""}`}
      title={isCollapsed ? label : undefined}
    >
      <span className={s.itemIcon}>{icon}</span>
      {!isCollapsed && (
        <motion.span
          className={s.itemLabel}
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: "auto" }}
          exit={{ opacity: 0, width: 0 }}
        >
          {label}
        </motion.span>
      )}
      {badge !== undefined && badge > 0 && !isCollapsed && (
        <span className={s.badge}>{badge}</span>
      )}
    </Link>
  );
}

interface SidebarProps {
  user: { nombre: string; email: string } | null;
  onLogout: () => void;
}

export function Sidebar({ user, onLogout }: SidebarProps) {
  const { isCollapsed, toggle, mounted } = useAdminSidebar();

  if (!mounted) {
    return <div className={s.sidebar} />;
  }

  return (
    <aside className={`${s.sidebar} ${isCollapsed ? s.sidebarCollapsed : ""}`}>
      <div className={s.sidebarInner}>
        {/* Header */}
        <div className={s.header}>
          {!isCollapsed && (
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
            onClick={toggle}
            className={s.toggleBtn}
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
        </div>

        {/* Navigation */}
        <nav className={s.nav}>
          <SidebarItem
            href="/admin"
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            isCollapsed={isCollapsed}
          />
          <SidebarItem
            href="/admin/pruebas"
            icon={<FlaskConical size={20} />}
            label="Pruebas"
            isCollapsed={isCollapsed}
          />
          <SidebarItem
            href="/admin/cursos"
            icon={<GraduationCap size={20} />}
            label="Cursos"
            isCollapsed={isCollapsed}
          />
          <SidebarItem
            href="/admin/clases-vivo"
            icon={<Video size={20} />}
            label="Clases en Vivo"
            isCollapsed={isCollapsed}
          />
          <SidebarItem
            href="/admin/pagos"
            icon={<CreditCard size={20} />}
            label="Pagos"
            isCollapsed={isCollapsed}
          />
          <SidebarItem
            href="/admin/marketing"
            icon={<Mail size={20} />}
            label="Marketing"
            isCollapsed={isCollapsed}
          />
          <SidebarItem
            href="/admin/usuarios"
            icon={<Users size={20} />}
            label="Usuarios"
            isCollapsed={isCollapsed}
          />
        </nav>

        {/* Footer */}
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
              {!isCollapsed && (
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
            title={isCollapsed ? "Cerrar sesión" : undefined}
          >
            <LogOut size={18} />
            {!isCollapsed && <span>Salir</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
