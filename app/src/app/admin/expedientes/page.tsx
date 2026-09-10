"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/admin/Card";

type Row = {
  id: string;
  userId: string;
  status: string;
  aprovechamientoPercent: number;
  presencePercentAvg: number;
  program?: { code: string; title: string; courseId: string } | null;
};

export default function AdminExpedientesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/expedientes");
      if (res.ok) {
        const data = await res.json();
        setRows(data.expedientes || []);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <PageHeader
        title="Expedientes CONOCER"
        subtitle="Evaluaciones, portafolio, dictamen y constancias"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Expedientes" },
        ]}
      />

      <Card>
        {loading && <p>Cargando…</p>}
        {!loading && rows.length === 0 && (
          <p>
            Aún no hay expedientes. Se abren al solicitar evaluación desde el curso o al emitir
            constancia.
          </p>
        )}
        {!loading && rows.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr>
                <th align="left">Programa</th>
                <th align="left">Usuario</th>
                <th align="left">Estado</th>
                <th align="right">Aprov.</th>
                <th align="right">Presencia</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderTop: "1px solid #ddd" }}>
                  <td>{r.program?.code || "—"}</td>
                  <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{r.userId}</td>
                  <td>{r.status}</td>
                  <td align="right">{r.aprovechamientoPercent}%</td>
                  <td align="right">{r.presencePercentAvg}%</td>
                  <td align="right">
                    <Link href={`/admin/expedientes/${r.id}`} className="btn btn-sm">
                      Abrir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
