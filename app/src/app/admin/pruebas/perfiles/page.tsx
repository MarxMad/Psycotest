"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Briefcase, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/admin/Card";
import { EmptyState } from "@/components/admin/EmptyState";
import { fetchJobProfiles, type JobProfileRow } from "@/lib/api-client";
import {
  ITEMS_CLEAVER_JOB,
  asCleaverPuesto,
  calificarCleaverJob,
  type RespuestasCleaverJob,
  type ResultadoCleaverJob,
} from "@/lib/cleaver-job";
import { FACTORES_CLEAVER, NOMBRES_FACTOR } from "@/lib/cleaver";
import s from "./perfiles.module.css";

const RATINGS = [1, 2, 3, 4, 5] as const;

function emptyRespuestas(): RespuestasCleaverJob {
  const r: RespuestasCleaverJob = {};
  for (const it of ITEMS_CLEAVER_JOB) r[it.id] = 3;
  return r;
}

export default function PerfilesPuestoPage() {
  const [profiles, setProfiles] = useState<JobProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [respuestas, setRespuestas] = useState<RespuestasCleaverJob>(emptyRespuestas);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ResultadoCleaverJob | null>(null);

  async function reload() {
    setLoading(true);
    const rows = await fetchJobProfiles();
    setProfiles(rows);
    setLoading(false);
  }

  useEffect(() => {
    void reload();
  }, []);

  const filled = useMemo(
    () => ITEMS_CLEAVER_JOB.every((it) => {
      const v = respuestas[it.id];
      return typeof v === "number" && v >= 1 && v <= 5;
    }),
    [respuestas],
  );

  useEffect(() => {
    if (!creating || !filled) {
      setPreview(null);
      return;
    }
    setPreview(calificarCleaverJob(respuestas));
  }, [creating, filled, respuestas]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!titulo.trim()) {
      setError("Indique el título del puesto.");
      return;
    }
    if (!filled) {
      setError("Complete los 24 ítems con rating 1–5.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/job-profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo, empresa, respuestasCleaver: respuestas }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "No se pudo guardar el perfil");
      return;
    }
    setCreating(false);
    setTitulo("");
    setEmpresa("");
    setRespuestas(emptyRespuestas());
    await reload();
  }

  async function onDelete(id: string) {
    if (!confirm("¿Eliminar este perfil de puesto?")) return;
    await fetch(`/api/job-profiles/${id}`, { method: "DELETE" });
    await reload();
  }

  return (
    <div className={s.container}>
      <PageHeader
        title="Perfiles de puesto"
        subtitle="Análisis del Trabajo (Factor Humano Cleaver)"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Pruebas", href: "/admin/pruebas" },
          { label: "Perfiles" },
        ]}
        action={
          !creating ? (
            <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
              <Plus size={16} />
              Nuevo Análisis del Trabajo
            </button>
          ) : undefined
        }
      />

      {creating && (
        <Card className={s.formCard}>
          <form onSubmit={onCreate} className={s.form}>
            <div className={s.formHead}>
              <h2>Nuevo Factor Humano</h2>
              <p>
                Califique la importancia de cada conducta para el puesto (1 = mínima … 5 = máxima).
              </p>
            </div>
            <div className={s.metaRow}>
              <label>
                Título del puesto *
                <input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej. Gerente de operaciones"
                  required
                />
              </label>
              <label>
                Empresa
                <input
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  placeholder="Opcional"
                />
              </label>
            </div>

            <ol className={s.items}>
              {ITEMS_CLEAVER_JOB.map((it) => (
                <li key={it.id}>
                  <div className={s.itemText}>
                    <span className={s.factor}>{it.factor}</span>
                    <span>
                      {it.id}. {it.texto}
                    </span>
                  </div>
                  <div className={s.ratings} role="radiogroup" aria-label={`Ítem ${it.id}`}>
                    {RATINGS.map((n) => (
                      <label key={n} className={respuestas[it.id] === n ? s.rateOn : s.rate}>
                        <input
                          type="radio"
                          name={`item-${it.id}`}
                          value={n}
                          checked={respuestas[it.id] === n}
                          onChange={() =>
                            setRespuestas((prev) => ({ ...prev, [it.id]: n }))
                          }
                        />
                        {n}
                      </label>
                    ))}
                  </div>
                </li>
              ))}
            </ol>

            {preview?.completo && (
              <div className={s.preview}>
                <strong>Vista previa</strong>
                <span>
                  A={preview.A} · X={preview.multiplicador} · aplanado=
                  {preview.aplanado ? "sí" : "no"}
                </span>
                <div className={s.previewGrid}>
                  {FACTORES_CLEAVER.map((f) => (
                    <div key={f}>
                      <b>{f}</b> {NOMBRES_FACTOR[f]}
                      <div>
                        R={preview.R[f]} · gráf={Math.round(preview.grafica[f])}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && <p className={s.error}>{error}</p>}

            <div className={s.formActions}>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setCreating(false);
                  setError(null);
                }}
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving || !filled}>
                {saving ? "Guardando…" : "Guardar perfil"}
              </button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <p className={s.muted}>Cargando perfiles…</p>
      ) : profiles.length === 0 && !creating ? (
        <EmptyState
          icon={<Briefcase size={28} />}
          title="Sin perfiles de puesto"
          description="Cree un Análisis del Trabajo para confrontar Autodescripción Cleaver con el Factor Humano del puesto."
          action={
            <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
              <Plus size={16} />
              Crear primero
            </button>
          }
        />
      ) : (
        <div className={s.list}>
          {profiles.map((p) => {
            const cleaver = asCleaverPuesto(p.cleaverPuesto);
            return (
              <Card key={p.id} className={s.row}>
                <div>
                  <h3>{p.titulo}</h3>
                  <p className={s.muted}>
                    {[p.empresa, cleaver?.resultado?.completo ? "Cleaver FH listo" : "Sin Cleaver"]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {cleaver?.resultado?.completo && (
                    <p className={s.mini}>
                      A={cleaver.resultado.A} · D/I/S/C gráf=
                      {FACTORES_CLEAVER.map((f) => Math.round(cleaver.resultado.grafica[f])).join("/")}
                    </p>
                  )}
                </div>
                <div className={s.rowActions}>
                  <Link href={`/admin/pruebas?perfil=${p.id}`} className="btn btn-sm">
                    Usar en pruebas
                  </Link>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => void onDelete(p.id)}
                    aria-label="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
