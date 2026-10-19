"use client";

import { useCallback, useEffect, useState } from "react";
import { UserPlus, Users } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardHeader } from "@/components/admin/Card";
import { DataTable, type Columna } from "@/components/admin/DataTable";
import { createParticipant, fetchParticipants, type ParticipantRow } from "@/lib/api-client";
import s from "./participantes.module.css";

const VACIO = {
  nombre: "",
  edad: "",
  sexo: "",
  estadoCivil: "",
  estudios: "",
  ocupacion: "",
  empresa: "",
  notas: "",
};

export default function ParticipantesPage() {
  const [lista, setLista] = useState<ParticipantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [form, setForm] = useState(VACIO);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      setLista(await fetchParticipants());
      setError("");
    } catch {
      setError("No se pudieron cargar los participantes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setAviso("");
    try {
      await createParticipant({
        nombre: form.nombre,
        edad: form.edad || undefined,
        sexo: form.sexo || undefined,
        estadoCivil: form.estadoCivil || undefined,
        estudios: form.estudios || undefined,
        ocupacion: form.ocupacion || undefined,
        empresa: form.empresa || undefined,
        notas: form.notas || undefined,
      });
      setForm(VACIO);
      setAviso(`${form.nombre} quedó registrado.`);
      await cargar();
    } catch {
      setError("No se pudo registrar al participante.");
    } finally {
      setSaving(false);
    }
  }

  const setField = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const columnas: Columna<ParticipantRow>[] = [
    { header: "Nombre", cell: (p) => <strong>{p.nombre}</strong> },
    { header: "Ocupación", cell: (p) => p.ocupacion || <span className={s.sub}>—</span> },
    { header: "Empresa", cell: (p) => p.empresa || <span className={s.sub}>—</span> },
    {
      header: "Edad",
      cell: (p) => (p.edad ? `${p.edad}` : <span className={s.sub}>—</span>),
      align: "center",
      numeric: true,
    },
  ];

  return (
    <div className={s.container}>
      <PageHeader
        title="Participantes"
        subtitle="Registro de evaluados para vincular con sus sesiones"
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Participantes" }]}
      />

      {error && <div className={s.error}>{error}</div>}
      {aviso && <div className={s.aviso}>{aviso}</div>}

      <div className={s.grid}>
        <Card>
          <CardHeader title="Nuevo participante" subtitle="Solo el nombre es obligatorio" />
          <form className={s.form} onSubmit={onSubmit}>
            <label className={s.campo}>
              <span>Nombre completo *</span>
              <input value={form.nombre} onChange={(e) => setField("nombre", e.target.value)} required />
            </label>
            <div className={s.row2}>
              <label className={s.campo}>
                <span>Edad</span>
                <input value={form.edad} onChange={(e) => setField("edad", e.target.value)} />
              </label>
              <label className={s.campo}>
                <span>Sexo</span>
                <input value={form.sexo} onChange={(e) => setField("sexo", e.target.value)} />
              </label>
            </div>
            <div className={s.row2}>
              <label className={s.campo}>
                <span>Estado civil</span>
                <input
                  value={form.estadoCivil}
                  onChange={(e) => setField("estadoCivil", e.target.value)}
                />
              </label>
              <label className={s.campo}>
                <span>Estudios</span>
                <input value={form.estudios} onChange={(e) => setField("estudios", e.target.value)} />
              </label>
            </div>
            <div className={s.row2}>
              <label className={s.campo}>
                <span>Ocupación</span>
                <input
                  value={form.ocupacion}
                  onChange={(e) => setField("ocupacion", e.target.value)}
                />
              </label>
              <label className={s.campo}>
                <span>Empresa</span>
                <input value={form.empresa} onChange={(e) => setField("empresa", e.target.value)} />
              </label>
            </div>
            <label className={s.campo}>
              <span>Notas</span>
              <textarea value={form.notas} onChange={(e) => setField("notas", e.target.value)} rows={3} />
            </label>
            <button type="submit" className="btn btn-primary" disabled={saving || !form.nombre.trim()}>
              <UserPlus size={16} />
              {saving ? "Guardando…" : "Registrar"}
            </button>
          </form>
        </Card>

        <Card padding="none">
          <div className={s.listHead}>
            <CardHeader title={`Registrados (${lista.length})`} />
          </div>
          {loading ? (
            <p className={s.cargando}>Cargando…</p>
          ) : (
            <DataTable
              columns={columnas}
              rows={lista}
              rowKey={(p) => p.id}
              empty={
                <span>
                  <Users size={18} aria-hidden /> Sin participantes todavía.
                </span>
              }
            />
          )}
        </Card>
      </div>
    </div>
  );
}
