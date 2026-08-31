"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FlaskConical, Plus, KeyRound } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/admin/Card";
import { EmptyState } from "@/components/admin/EmptyState";
import {
  dbSessionToMeta,
  fetchSessions,
} from "@/lib/api-client";
import { listarSesiones, type Instrumento, type MetaSesion } from "@/lib/storage";
import s from "./pruebas.module.css";

const ETIQUETAS: Record<Instrumento, string> = {
  papi: "PAPI",
  hartman: "Hartman",
  mabe: "MABE",
};

const COLORES: Record<Instrumento, string> = {
  papi: "var(--papi)",
  hartman: "var(--hartman)",
  mabe: "var(--mabe)",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mergeSesiones(servidor: MetaSesion[], local: MetaSesion[]): MetaSesion[] {
  const ids = new Set(servidor.map((x) => x.id));
  const extra = local.filter((x) => !ids.has(x.id));
  return [...servidor, ...extra].sort(
    (a, b) => new Date(b.iniciada).getTime() - new Date(a.iniciada).getTime(),
  );
}

export default function PruebasPage() {
  const [sesiones, setSesiones] = useState<MetaSesion[]>([]);
  const [filtro, setFiltro] = useState<Instrumento | "">("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    async function load() {
      setLoading(true);
      const rows = await fetchSessions(filtro || undefined);
      if (cancel) return;
      if (rows.length > 0) {
        setSesiones(mergeSesiones(rows.map(dbSessionToMeta), listarSesiones(filtro || undefined)));
      } else {
        setSesiones(listarSesiones(filtro || undefined));
      }
      setLoading(false);
    }
    load();
    return () => {
      cancel = true;
    };
  }, [filtro]);

  const stats = {
    total: sesiones.length,
    terminadas: sesiones.filter((x) => x.terminada).length,
  };

  return (
    <div className={s.container}>
      <PageHeader
        title="Pruebas Psicométricas"
        subtitle="Gestiona evaluaciones y resultados"
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Pruebas" }]}
        action={
          <div className={s.actions}>
            <Link href="/admin/pruebas/codigos" className="btn">
              <KeyRound size={16} />
              Códigos
            </Link>
            <Link href="/" className="btn btn-primary">
              <Plus size={16} />
              Nueva Evaluación
            </Link>
          </div>
        }
      />

      <div className={s.stats}>
        <div className={s.stat}>
          <FlaskConical size={18} />
          <span className={s.statN}>{stats.total}</span>
          <span>Sesiones</span>
        </div>
        <div className={s.stat}>
          <span className={s.statN}>{stats.terminadas}</span>
          <span>Completadas</span>
        </div>
      </div>

      <div className={s.filters}>
        <span>Filtrar:</span>
        {(["", "papi", "hartman", "mabe"] as const).map((f) => (
          <button
            key={f || "all"}
            type="button"
            className={filtro === f ? s.filterOn : s.filter}
            onClick={() => setFiltro(f)}
          >
            {f ? ETIQUETAS[f] : "Todas"}
          </button>
        ))}
      </div>

      <Card padding="none">
        {loading ? (
          <div className={s.empty}>
            <p>Cargando sesiones…</p>
          </div>
        ) : sesiones.length === 0 ? (
          <EmptyState
            icon={<FlaskConical size={32} />}
            title="No hay sesiones guardadas"
            description="Las evaluaciones aparecerán aquí una vez aplicadas"
            action={
              <Link href="/" className="btn btn-primary">
                Aplicar Prueba
              </Link>
            }
          />
        ) : (
          <div className={s.tableShell}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Instrumento</th>
                  <th>Participante</th>
                  <th>Puesto / contexto</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {sesiones.map((ses) => (
                  <tr key={ses.id}>
                    <td>
                      <span
                        className={s.badge}
                        style={{ ["--c" as string]: COLORES[ses.instrumento] }}
                      >
                        {ETIQUETAS[ses.instrumento]}
                      </span>
                    </td>
                    <td>
                      <strong>{ses.participante}</strong>
                    </td>
                    <td className={s.muted}>
                      {[ses.puesto, ses.empresa].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className={s.muted}>{fmt(ses.finalizadaEn ?? ses.iniciada)}</td>
                    <td>
                      {!ses.terminada ? (
                        <span className={s.pending}>En curso</span>
                      ) : ses.aprobada ? (
                        <span className={s.validated}>Validada</span>
                      ) : (
                        <span className={s.review}>Pendiente revisión</span>
                      )}
                    </td>
                    <td>
                      <Link href={`/admin/pruebas/sesiones/${ses.id}`} className={s.link}>
                        Ver detalle →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
