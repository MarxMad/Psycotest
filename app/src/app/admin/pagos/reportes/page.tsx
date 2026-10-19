"use client";

import { useEffect, useState } from "react";
import { DollarSign, Receipt, TicketPercent, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { Card, CardHeader } from "@/components/admin/Card";
import { EmptyState } from "@/components/admin/EmptyState";
import { mxn } from "@/lib/formato";
import s from "./reportes.module.css";

type Reporte = {
  resumen: { ordenes: number; ingreso: number; descuento: number; ticket: number };
  porMes: { mes: string; ordenes: number; ingreso: number; descuento: number }[];
  porCurso: { cursoId: string; titulo: string; ventas: number; ingreso: number }[];
};

const MESES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

/** "2026-03" → "mar 2026" */
function etiquetaMes(ym: string): string {
  const [anio, mes] = ym.split("-");
  const i = Number(mes) - 1;
  return `${MESES[i] ?? mes} ${anio}`;
}

/** Barra horizontal: una sola serie, magnitud por categoría. */
function Barras({
  filas,
  maximo,
}: {
  filas: { clave: string; etiqueta: string; valor: number; nota: string }[];
  maximo: number;
}) {
  return (
    <ul className={s.barras}>
      {filas.map((f) => (
        <li key={f.clave} className={s.barraFila}>
          <span className={s.barraEtiqueta}>{f.etiqueta}</span>
          <span className={s.barraPista}>
            <span
              className={s.barraValor}
              style={{ inlineSize: `${maximo > 0 ? Math.max((f.valor / maximo) * 100, 1.5) : 0}%` }}
            />
          </span>
          <span className={s.barraCifra}>
            {mxn(f.valor)}
            <small>{f.nota}</small>
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function ReportesPage() {
  const [data, setData] = useState<Reporte | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    fetch("/api/admin/reportes")
      .then(async (r) => {
        if (!r.ok) throw new Error("No se pudo generar el reporte");
        return r.json();
      })
      .then((d) => vivo && setData(d))
      .catch((e: Error) => vivo && setError(e.message))
      .finally(() => vivo && setLoading(false));
    return () => {
      vivo = false;
    };
  }, []);

  const maxMes = Math.max(0, ...(data?.porMes.map((m) => m.ingreso) ?? []));
  const maxCurso = Math.max(0, ...(data?.porCurso.map((c) => c.ingreso) ?? []));
  const sinVentas = !loading && !error && (data?.resumen.ordenes ?? 0) === 0;

  return (
    <div className={s.container}>
      <PageHeader
        title="Reportes de venta"
        subtitle="Ingresos por periodo y por curso, sobre órdenes pagadas"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Pagos", href: "/admin/pagos" },
          { label: "Reportes" },
        ]}
      />

      {error && <div className={s.error}>{error}</div>}
      {loading && <p className={s.cargando}>Generando reporte…</p>}

      {!loading && !error && (
        <>
          <div className={s.statsGrid}>
            <StatCard
              label="Ingreso total"
              value={mxn(data?.resumen.ingreso ?? 0)}
              icon={<DollarSign size={24} />}
              color="blue"
            />
            <StatCard
              label="Órdenes pagadas"
              value={data?.resumen.ordenes ?? 0}
              icon={<Receipt size={24} />}
              color="green"
            />
            <StatCard
              label="Ticket promedio"
              value={mxn(data?.resumen.ticket ?? 0)}
              icon={<TrendingUp size={24} />}
              color="purple"
            />
            <StatCard
              label="Descuentos aplicados"
              value={mxn(data?.resumen.descuento ?? 0)}
              icon={<TicketPercent size={24} />}
              color="orange"
            />
          </div>

          {sinVentas ? (
            <Card>
              <EmptyState
                icon={<Receipt size={32} />}
                title="Todavía no hay ventas pagadas"
                description="Cuando se complete la primera orden, aquí verás el ingreso por mes y por curso."
              />
            </Card>
          ) : (
            <div className={s.grid}>
              <Card>
                <CardHeader title="Ingreso por mes" subtitle="Últimos 12 meses con ventas" />
                {data && data.porMes.length > 0 ? (
                  <Barras
                    maximo={maxMes}
                    filas={data.porMes.map((m) => ({
                      clave: m.mes,
                      etiqueta: etiquetaMes(m.mes),
                      valor: m.ingreso,
                      nota: `${m.ordenes} orden${m.ordenes === 1 ? "" : "es"}`,
                    }))}
                  />
                ) : (
                  <p className={s.vacio}>Sin datos todavía.</p>
                )}
              </Card>

              <Card>
                <CardHeader title="Ingreso por curso" subtitle="Los que más han vendido" />
                {data && data.porCurso.length > 0 ? (
                  <Barras
                    maximo={maxCurso}
                    filas={data.porCurso.map((c) => ({
                      clave: c.cursoId,
                      etiqueta: c.titulo,
                      valor: c.ingreso,
                      nota: `${c.ventas} venta${c.ventas === 1 ? "" : "s"}`,
                    }))}
                  />
                ) : (
                  <p className={s.vacio}>Sin datos todavía.</p>
                )}
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
