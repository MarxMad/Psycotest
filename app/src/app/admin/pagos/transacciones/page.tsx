"use client";

import { useEffect, useMemo, useState } from "react";
import { Receipt } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/admin/Card";
import { Badge, DataTable, type Columna } from "@/components/admin/DataTable";
import { fechaCorta, mxn } from "@/lib/formato";
import s from "./transacciones.module.css";

type Order = {
  id: string;
  total: number;
  subtotal: number;
  discount: number;
  status: "pending" | "completed" | "cancelled" | "refunded";
  stripePaymentIntentId: string | null;
  createdAt: string;
  completedAt: string | null;
  compradorNombre: string | null;
  compradorEmail: string | null;
  cuponCodigo: string | null;
  items: { cursoTitulo: string | null; price: number }[];
};

const ESTADOS = [
  { id: "", label: "Todas" },
  { id: "completed", label: "Pagadas" },
  { id: "pending", label: "Pendientes" },
  { id: "refunded", label: "Reembolsadas" },
  { id: "cancelled", label: "Canceladas" },
] as const;

const TONO = {
  completed: "success",
  pending: "warn",
  refunded: "info",
  cancelled: "danger",
} as const;

const ETIQUETA = {
  completed: "Pagada",
  pending: "Pendiente",
  refunded: "Reembolsada",
  cancelled: "Cancelada",
} as const;

export default function TransaccionesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filtro, setFiltro] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    setLoading(true);
    fetch(`/api/orders${filtro ? `?status=${filtro}` : ""}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("No se pudieron cargar las transacciones");
        return r.json();
      })
      .then((d) => vivo && setOrders(d.orders ?? []))
      .catch((e: Error) => vivo && setError(e.message))
      .finally(() => vivo && setLoading(false));
    return () => {
      vivo = false;
    };
  }, [filtro]);

  const totalCobrado = useMemo(
    () => orders.filter((o) => o.status === "completed").reduce((a, o) => a + o.total, 0),
    [orders],
  );

  const columnas: Columna<Order>[] = [
    {
      header: "Fecha",
      cell: (o) => fechaCorta(o.createdAt),
      numeric: true,
    },
    {
      header: "Comprador",
      cell: (o) => (
        <div>
          <strong>{o.compradorNombre ?? "—"}</strong>
          {o.compradorEmail && <div className={s.sub}>{o.compradorEmail}</div>}
        </div>
      ),
    },
    {
      header: "Concepto",
      cell: (o) =>
        o.items.length === 0 ? (
          <span className={s.sub}>Sin partidas</span>
        ) : (
          <ul className={s.items}>
            {o.items.map((it, i) => (
              <li key={i}>{it.cursoTitulo ?? "Curso eliminado"}</li>
            ))}
          </ul>
        ),
    },
    {
      header: "Cupón",
      cell: (o) => (o.cuponCodigo ? <code className={s.code}>{o.cuponCodigo}</code> : <span className={s.sub}>—</span>),
    },
    {
      header: "Descuento",
      cell: (o) => (o.discount > 0 ? `− ${mxn(o.discount)}` : "—"),
      align: "end",
      numeric: true,
    },
    {
      header: "Total",
      cell: (o) => <strong>{mxn(o.total)}</strong>,
      align: "end",
      numeric: true,
    },
    {
      header: "Estado",
      cell: (o) => <Badge tone={TONO[o.status]}>{ETIQUETA[o.status]}</Badge>,
      align: "center",
    },
  ];

  return (
    <div className={s.container}>
      <PageHeader
        title="Transacciones"
        subtitle="Todas las órdenes de compra registradas"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Pagos", href: "/admin/pagos" },
          { label: "Transacciones" },
        ]}
      />

      <div className={s.toolbar}>
        <div className={s.filtros} role="group" aria-label="Filtrar por estado">
          {ESTADOS.map((e) => (
            <button
              key={e.id}
              type="button"
              className={`${s.filtro} ${filtro === e.id ? s.filtroActivo : ""}`}
              onClick={() => setFiltro(e.id)}
              aria-pressed={filtro === e.id}
            >
              {e.label}
            </button>
          ))}
        </div>
        <p className={s.resumen}>
          <Receipt size={15} aria-hidden />
          {orders.length} orden{orders.length === 1 ? "" : "es"} · {mxn(totalCobrado)} cobrado
        </p>
      </div>

      {error && <div className={s.error}>{error}</div>}

      <Card padding="none">
        {loading ? (
          <p className={s.cargando}>Cargando transacciones…</p>
        ) : (
          <DataTable
            columns={columnas}
            rows={orders}
            rowKey={(o) => o.id}
            empty="No hay transacciones con este filtro."
          />
        )}
      </Card>
    </div>
  );
}
