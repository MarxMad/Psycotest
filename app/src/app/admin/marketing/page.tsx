"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Mail, Tag, Users } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { Card, CardHeader } from "@/components/admin/Card";
import { EmptyState } from "@/components/admin/EmptyState";
import { Badge, DataTable, type Columna } from "@/components/admin/DataTable";
import { fechaCorta } from "@/lib/formato";
import s from "./marketing.module.css";

type Cupon = {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  maxUses: number | null;
  currentUses: number;
  active: boolean;
  expiresAt: string | null;
};

type Audiencia = {
  usuarios: number;
  verificados: number;
  inscritos: number;
};

function descuento(c: Cupon): string {
  return c.type === "percentage" ? `${c.value}%` : `$${(c.value / 100).toFixed(0)}`;
}

function vigente(c: Cupon): boolean {
  if (!c.active) return false;
  if (c.expiresAt && new Date(c.expiresAt) < new Date()) return false;
  if (c.maxUses !== null && c.currentUses >= c.maxUses) return false;
  return true;
}

export default function MarketingPage() {
  const [cupones, setCupones] = useState<Cupon[]>([]);
  const [audiencia, setAudiencia] = useState<Audiencia | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let vivo = true;
    Promise.all([
      fetch("/api/coupons").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/users").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/admin/stats").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([cup, usr, stats]) => {
        if (!vivo) return;
        setCupones(cup?.coupons ?? []);
        const users = (usr?.users ?? []) as { emailVerified: boolean }[];
        setAudiencia({
          usuarios: users.length,
          verificados: users.filter((u) => u.emailVerified).length,
          inscritos: stats?.stats?.cursos?.estudiantes ?? 0,
        });
      })
      .finally(() => vivo && setLoading(false));
    return () => {
      vivo = false;
    };
  }, []);

  const activos = cupones.filter(vigente);

  const columnas: Columna<Cupon>[] = [
    { header: "Código", cell: (c) => <code className={s.code}>{c.code}</code> },
    { header: "Descuento", cell: (c) => descuento(c), align: "center" },
    {
      header: "Usos",
      cell: (c) => `${c.currentUses}${c.maxUses !== null ? ` / ${c.maxUses}` : ""}`,
      align: "center",
      numeric: true,
    },
    { header: "Vence", cell: (c) => fechaCorta(c.expiresAt), numeric: true },
    {
      header: "Estado",
      cell: (c) =>
        vigente(c) ? <Badge tone="success">Vigente</Badge> : <Badge tone="neutral">Inactivo</Badge>,
      align: "center",
    },
  ];

  return (
    <div className={s.container}>
      <PageHeader
        title="Marketing"
        subtitle="Tu audiencia y las promociones activas"
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Marketing" }]}
        action={
          <Link href="/admin/pagos/cupones" className="btn btn-primary">
            <Tag size={16} />
            Gestionar cupones
          </Link>
        }
      />

      <div className={s.statsGrid}>
        <StatCard
          label="Personas registradas"
          value={audiencia?.usuarios ?? 0}
          icon={<Users size={24} />}
          color="blue"
        />
        <StatCard
          label="Correos verificados"
          value={audiencia?.verificados ?? 0}
          icon={<BadgeCheck size={24} />}
          color="green"
        />
        <StatCard
          label="Inscripciones a cursos"
          value={audiencia?.inscritos ?? 0}
          icon={<Mail size={24} />}
          color="purple"
        />
        <StatCard
          label="Cupones vigentes"
          value={activos.length}
          icon={<Tag size={24} />}
          color="orange"
        />
      </div>

      <Card padding="none">
        <div className={s.cardHead}>
          <CardHeader
            title="Promociones"
            subtitle="Cupones de descuento emitidos"
            action={
              <Link href="/admin/pagos/cupones" className="btn btn-sm">
                Crear cupón
              </Link>
            }
          />
        </div>
        {loading ? (
          <p className={s.cargando}>Cargando…</p>
        ) : cupones.length === 0 ? (
          <EmptyState
            icon={<Tag size={32} />}
            title="Sin cupones"
            description="Crea un cupón de descuento para tus campañas"
            action={
              <Link href="/admin/pagos/cupones" className="btn btn-primary">
                Crear cupón
              </Link>
            }
          />
        ) : (
          <DataTable columns={columnas} rows={cupones} rowKey={(c) => c.id} />
        )}
      </Card>
    </div>
  );
}
