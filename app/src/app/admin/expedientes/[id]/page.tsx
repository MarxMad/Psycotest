"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/admin/Card";

export default function ExpedienteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [certCode, setCertCode] = useState<string | null>(null);
  const [clinica, setClinica] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/expedientes/${id}`);
    if (!res.ok) {
      setError("No se pudo cargar");
      return;
    }
    setData(await res.json());
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    const res = await fetch(`/api/expedientes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error || "Error");
      return;
    }
    const d = await res.json();
    if (d.certificate?.verificationCode) setCertCode(d.certificate.verificationCode);
    await load();
  }

  if (error) {
    return (
      <Card>
        <p>{error}</p>
        <Link href="/admin/expedientes">← Volver</Link>
      </Card>
    );
  }

  if (!data) return <p>Cargando…</p>;

  const expediente = data.expediente as {
    status: string;
    aprovechamientoPercent: number;
    presencePercentAvg: number;
    notes?: string;
  };
  const program = data.program as {
    code: string;
    title: string;
    minAprovechamientoPercent: number;
    minPresencePercent: number;
  } | null;
  const user = data.user as { nombre: string; email: string } | null;
  const evaluations = (data.evaluations as Array<{ id: string; type: string; score: number | null; submittedAt: string }>) || [];
  const evidences = (data.evidences as Array<{ id: string; title: string; evidenceType: string; fileUrl?: string }>) || [];

  return (
    <div>
      <PageHeader
        title={user?.nombre || "Expediente"}
        subtitle={program ? `${program.code} · ${program.title}` : "Programa CONOCER"}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Expedientes", href: "/admin/expedientes" },
          { label: "Detalle" },
        ]}
        action={
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn"
              disabled={busy}
              onClick={() => void patch({ status: "en_revision" })}
            >
              En revisión
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy}
              onClick={() => void patch({ status: "aprobado" })}
            >
              Aprobar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy}
              onClick={() => void patch({ action: "issue_certificate" })}
            >
              Emitir constancia
            </button>
          </div>
        }
      />

      <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
        <Card>
          <h3>Estado</h3>
          <p>
            <strong>{expediente.status}</strong>
          </p>
          <p>Aprovechamiento: {expediente.aprovechamientoPercent}% (mín. {program?.minAprovechamientoPercent}%)</p>
          <p>Presencia vivo: {expediente.presencePercentAvg}% (mín. {program?.minPresencePercent}%)</p>
          {user && (
            <p>
              {user.email}
            </p>
          )}
          {certCode && (
            <p>
              Constancia:{" "}
              <Link href={`/verificar/${certCode}`}>{certCode}</Link>
              {" · "}
              <a href={`/api/certificates/${certCode}/pdf`} target="_blank" rel="noreferrer">
                PDF
              </a>
            </p>
          )}
        </Card>

        <Card>
          <h3>Evaluación clínica</h3>
          <textarea
            value={clinica}
            onChange={(e) => setClinica(e.target.value)}
            rows={4}
            style={{ width: "100%", marginBottom: "0.5rem" }}
            placeholder="Notas del evaluador…"
          />
          <button
            type="button"
            className="btn"
            disabled={busy || !clinica.trim()}
            onClick={() =>
              void patch({
                action: "evaluation",
                type: "clinica",
                answers: { notas: clinica },
              })
            }
          >
            Guardar evaluación clínica
          </button>
        </Card>
      </div>

      <Card>
        <h3>Evaluaciones ({evaluations.length})</h3>
        <ul>
          {evaluations.map((e) => (
            <li key={e.id}>
              {e.type} · {new Date(e.submittedAt).toLocaleString("es-MX")}
              {e.score != null ? ` · score ${e.score}` : ""}
            </li>
          ))}
          {evaluations.length === 0 && <li>Sin evaluaciones aún</li>}
        </ul>
      </Card>

      <Card>
        <h3>Portafolio ({evidences.length})</h3>
        <ul>
          {evidences.map((e) => (
            <li key={e.id}>
              [{e.evidenceType}] {e.title}
              {e.fileUrl ? (
                <>
                  {" "}
                  — <a href={e.fileUrl}>ver</a>
                </>
              ) : null}
            </li>
          ))}
          {evidences.length === 0 && <li>Sin evidencias</li>}
        </ul>
        <button
          type="button"
          className="btn"
          disabled={busy}
          onClick={() =>
            void patch({
              action: "evidence",
              title: "Evidencia registrada por admin",
              evidenceType: "otro",
              description: "Carga manual",
            })
          }
        >
          Agregar evidencia placeholder
        </button>
      </Card>
    </div>
  );
}
