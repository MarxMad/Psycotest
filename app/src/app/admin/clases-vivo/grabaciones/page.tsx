"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Video } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/admin/Card";
import { Badge, DataTable, type Columna } from "@/components/admin/DataTable";
import { fechaHora } from "@/lib/formato";
import s from "./grabaciones.module.css";

type Clase = {
  id: string;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  status: "scheduled" | "live" | "completed" | "cancelled";
  recordingUrl: string | null;
  courseId: string | null;
};

export default function GrabacionesPage() {
  const [clases, setClases] = useState<Clase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const r = await fetch("/api/live-classes");
      if (!r.ok) throw new Error("No se pudieron cargar las clases");
      const d = await r.json();
      const lista: Clase[] = d.classes ?? d.liveClasses ?? [];
      // Solo las que ya ocurrieron: son las que pueden tener grabación
      setClases(lista.filter((c) => c.status === "completed" || c.recordingUrl));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function guardarUrl(c: Clase, recordingUrl: string) {
    const limpia = recordingUrl.trim();
    if (limpia === (c.recordingUrl ?? "")) return;
    setGuardando(c.id);
    setError(null);
    try {
      const r = await fetch(`/api/live-classes/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordingUrl: limpia || null }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error ?? "No se pudo guardar el enlace");
      }
      setClases((prev) =>
        prev.map((x) => (x.id === c.id ? { ...x, recordingUrl: limpia || null } : x)),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGuardando(null);
    }
  }

  const columnas: Columna<Clase>[] = [
    {
      header: "Clase",
      cell: (c) => (
        <div>
          <strong>{c.title}</strong>
          <div className={s.sub}>
            {fechaHora(c.scheduledAt)} · {c.durationMinutes} min
          </div>
        </div>
      ),
    },
    {
      header: "Grabación",
      cell: (c) => (
        <input
          className={s.urlInput}
          type="url"
          defaultValue={c.recordingUrl ?? ""}
          placeholder="https://… enlace del video"
          disabled={guardando === c.id}
          onBlur={(e) => guardarUrl(c, e.target.value)}
          aria-label={`Enlace de la grabación de ${c.title}`}
        />
      ),
    },
    {
      header: "Estado",
      cell: (c) =>
        c.recordingUrl ? (
          <Badge tone="success">Disponible</Badge>
        ) : (
          <Badge tone="warn">Sin grabación</Badge>
        ),
      align: "center",
    },
    {
      header: "",
      cell: (c) =>
        c.recordingUrl ? (
          <a className="btn btn-sm" href={c.recordingUrl} target="_blank" rel="noopener noreferrer">
            Ver
          </a>
        ) : (
          <Link className="btn btn-sm" href={`/admin/clases-vivo/${c.id}`}>
            Abrir clase
          </Link>
        ),
      align: "end",
    },
  ];

  return (
    <div className={s.container}>
      <PageHeader
        title="Grabaciones"
        subtitle="Enlaza el video de cada clase para que los inscritos puedan repetirla"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Clases en vivo", href: "/admin/clases-vivo" },
          { label: "Grabaciones" },
        ]}
      />

      {error && <div className={s.error}>{error}</div>}

      <Card padding="none">
        {loading ? (
          <p className={s.cargando}>Cargando clases…</p>
        ) : (
          <DataTable
            columns={columnas}
            rows={clases}
            rowKey={(c) => c.id}
            empty={
              <span>
                <Video size={18} aria-hidden /> Aún no hay clases terminadas. Cuando una clase
                concluya, aparecerá aquí para que le pegues el enlace de su grabación.
              </span>
            }
          />
        )}
      </Card>
    </div>
  );
}
