"use client";

import Link from "next/link";
import { Mail, Send, Zap, BarChart3, Plus } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { Card, CardHeader } from "@/components/admin/Card";
import { EmptyState } from "@/components/admin/EmptyState";
import s from "./marketing.module.css";

export default function MarketingPage() {
  return (
    <div className={s.container}>
      <PageHeader
        title="Marketing"
        subtitle="Gestiona campañas de email y automatizaciones"
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Marketing" }]}
        action={
          <Link href="/admin/marketing/emails/crear" className="btn btn-primary">
            <Plus size={16} />
            Nueva Campaña
          </Link>
        }
      />

      <div className={s.statsGrid}>
        <StatCard label="Emails Enviados" value={0} icon={<Send size={24} />} color="blue" />
        <StatCard
          label="Tasa de Apertura"
          value="0%"
          icon={<Mail size={24} />}
          color="green"
        />
        <StatCard
          label="Automatizaciones"
          value={0}
          icon={<Zap size={24} />}
          color="purple"
        />
        <StatCard
          label="Conversiones"
          value={0}
          icon={<BarChart3 size={24} />}
          color="orange"
        />
      </div>

      <div className={s.grid}>
        <Card>
          <CardHeader
            title="Campañas de Email"
            action={
              <Link href="/admin/marketing/emails" className="btn btn-sm">
                Ver todas
              </Link>
            }
          />
          <EmptyState
            icon={<Mail size={32} />}
            title="Sin campañas"
            description="Crea tu primera campaña de email marketing"
            action={
              <Link href="/admin/marketing/emails/crear" className="btn btn-primary">
                Crear Campaña
              </Link>
            }
          />
        </Card>

        <Card>
          <CardHeader
            title="Automatizaciones"
            action={
              <Link href="/admin/marketing/automatizaciones" className="btn btn-sm">
                Ver todas
              </Link>
            }
          />
          <div className={s.autoList}>
            <div className={s.autoItem}>
              <Zap size={18} />
              <div>
                <strong>Bienvenida</strong>
                <p className={s.autoDesc}>Email de bienvenida a nuevos usuarios</p>
              </div>
              <span className={s.badge}>Inactiva</span>
            </div>
            <div className={s.autoItem}>
              <Zap size={18} />
              <div>
                <strong>Carrito Abandonado</strong>
                <p className={s.autoDesc}>Recordatorio de compra pendiente</p>
              </div>
              <span className={s.badge}>Inactiva</span>
            </div>
            <div className={s.autoItem}>
              <Zap size={18} />
              <div>
                <strong>Post-Compra</strong>
                <p className={s.autoDesc}>Seguimiento después de la compra</p>
              </div>
              <span className={s.badge}>Inactiva</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
