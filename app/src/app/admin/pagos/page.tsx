"use client";

import Link from "next/link";
import { CreditCard, TrendingUp, Receipt, Tag } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { Card, CardHeader } from "@/components/admin/Card";
import { EmptyState } from "@/components/admin/EmptyState";
import s from "./pagos.module.css";

export default function PagosPage() {
  return (
    <div className={s.container}>
      <PageHeader
        title="Pagos y Ventas"
        subtitle="Gestiona transacciones, reportes y cupones de descuento"
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Pagos" }]}
        action={
          <Link href="/admin/pagos/cupones" className="btn btn-primary">
            <Tag size={16} />
            Crear Cupón
          </Link>
        }
      />

      <div className={s.statsGrid}>
        <StatCard
          label="Ingresos del Mes"
          value="$0"
          icon={<CreditCard size={24} />}
          color="blue"
        />
        <StatCard
          label="Transacciones"
          value={0}
          icon={<Receipt size={24} />}
          color="green"
        />
        <StatCard label="Cupones Activos" value={0} icon={<Tag size={24} />} color="purple" />
      </div>

      <div className={s.grid}>
        <Card>
          <CardHeader
            title="Transacciones Recientes"
            action={
              <Link href="/admin/pagos/transacciones" className="btn btn-sm">
                Ver todas
              </Link>
            }
          />
          <EmptyState
            icon={<Receipt size={32} />}
            title="Sin transacciones"
            description="Las ventas de cursos aparecerán aquí"
          />
        </Card>

        <Card>
          <CardHeader
            title="Reportes"
            action={
              <Link href="/admin/pagos/reportes" className="btn btn-sm">
                Ver reportes
              </Link>
            }
          />
          <div className={s.reportLinks}>
            <Link href="/admin/pagos/reportes" className={s.reportLink}>
              <TrendingUp size={18} />
              <span>Reporte Mensual</span>
            </Link>
            <Link href="/admin/pagos/reportes" className={s.reportLink}>
              <Receipt size={18} />
              <span>Ventas por Curso</span>
            </Link>
            <Link href="/admin/pagos/cupones" className={s.reportLink}>
              <Tag size={18} />
              <span>Uso de Cupones</span>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
