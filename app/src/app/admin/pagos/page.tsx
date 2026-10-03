"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CreditCard, TrendingUp, Receipt, Tag } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { Card, CardHeader } from "@/components/admin/Card";
import { EmptyState } from "@/components/admin/EmptyState";
import { mxn } from "@/lib/formato";
import s from "./pagos.module.css";

type Resumen = {
  ingresoMes: number;
  transacciones: number;
  cuponesActivos: number;
  recientes: { id: string; comprador: string; total: number; fecha: string }[];
};

export default function PagosPage() {
  const [r, setR] = useState<Resumen | null>(null);

  useEffect(() => {
    let vivo = true;
    Promise.all([
      fetch("/api/admin/stats").then((x) => (x.ok ? x.json() : null)),
      fetch("/api/orders?status=completed").then((x) => (x.ok ? x.json() : null)),
      fetch("/api/coupons").then((x) => (x.ok ? x.json() : null)),
    ])
      .then(([stats, ordenes, cupones]) => {
        if (!vivo) return;
        const lista = (ordenes?.orders ?? []) as {
          id: string;
          total: number;
          createdAt: string;
          compradorNombre: string | null;
        }[];
        setR({
          ingresoMes: stats?.stats?.ingresos?.mes ?? 0,
          transacciones: lista.length,
          cuponesActivos: ((cupones?.coupons ?? []) as { active: boolean }[]).filter((c) => c.active)
            .length,
          recientes: lista.slice(0, 5).map((o) => ({
            id: o.id,
            comprador: o.compradorNombre ?? "—",
            total: o.total,
            fecha: new Date(o.createdAt).toLocaleDateString("es-MX", {
              day: "2-digit",
              month: "short",
            }),
          })),
        });
      })
      .catch(() => vivo && setR(null));
    return () => {
      vivo = false;
    };
  }, []);

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
          value={mxn(r?.ingresoMes ?? 0)}
          icon={<CreditCard size={24} />}
          color="blue"
        />
        <StatCard
          label="Transacciones"
          value={r?.transacciones ?? 0}
          icon={<Receipt size={24} />}
          color="green"
        />
        <StatCard
          label="Cupones Activos"
          value={r?.cuponesActivos ?? 0}
          icon={<Tag size={24} />}
          color="purple"
        />
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
          {r && r.recientes.length > 0 ? (
            <ul className={s.recientes}>
              {r.recientes.map((o) => (
                <li key={o.id}>
                  <span className={s.recienteNombre}>{o.comprador}</span>
                  <span className={s.recienteFecha}>{o.fecha}</span>
                  <strong className={s.recienteTotal}>{mxn(o.total)}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={<Receipt size={32} />}
              title="Sin transacciones"
              description="Las ventas de cursos aparecerán aquí"
            />
          )}
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
