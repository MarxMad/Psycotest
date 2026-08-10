"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createParticipant, fetchParticipants, type ParticipantRow } from "@/lib/api-client";
import s from "./participantes.module.css";

export default function ParticipantesPage() {
  const [lista, setLista] = useState<ParticipantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    nombre: "",
    edad: "",
    sexo: "",
    estadoCivil: "",
    estudios: "",
    ocupacion: "",
    empresa: "",
    notas: "",
  });

  async function load() {
    setLoading(true);
    const rows = await fetchParticipants();
    setLista(rows);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const created = await createParticipant({
      nombre: form.nombre,
      edad: form.edad || undefined,
      sexo: form.sexo || undefined,
      estadoCivil: form.estadoCivil || undefined,
      estudios: form.estudios || undefined,
      ocupacion: form.ocupacion || undefined,
      empresa: form.empresa || undefined,
      notas: form.notas || undefined,
    });
    setSaving(false);
    if (!created) {
      setError("No se pudo guardar el participante");
      return;
    }
    setForm({
      nombre: "",
      edad: "",
      sexo: "",
      estadoCivil: "",
      estudios: "",
      ocupacion: "",
      empresa: "",
      notas: "",
    });
    await load();
  }

  function setField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <main className={s.main}>
      <div className={s.wrap}>
        <header className={s.head}>
          <div>
            <span className="eyebrow">Catálogo</span>
            <h1>Participantes</h1>
            <p>Registro de evaluados para vincular con sesiones futuras.</p>
          </div>
          <Link href="/admin" className="btn">
            ← Panel
          </Link>
        </header>

        <div className={s.grid}>
          <form className={s.form} onSubmit={onSubmit}>
            <h2>Nuevo participante</h2>
            <label>
              Nombre completo *
              <input
                value={form.nombre}
                onChange={(e) => setField("nombre", e.target.value)}
                required
              />
            </label>
            <div className={s.row2}>
              <label>
                Edad
                <input value={form.edad} onChange={(e) => setField("edad", e.target.value)} />
              </label>
              <label>
                Sexo
                <input value={form.sexo} onChange={(e) => setField("sexo", e.target.value)} />
              </label>
            </div>
            <div className={s.row2}>
              <label>
                Estado civil
                <input
                  value={form.estadoCivil}
                  onChange={(e) => setField("estadoCivil", e.target.value)}
                />
              </label>
              <label>
                Estudios
                <input
                  value={form.estudios}
                  onChange={(e) => setField("estudios", e.target.value)}
                />
              </label>
            </div>
            <div className={s.row2}>
              <label>
                Ocupación
                <input
                  value={form.ocupacion}
                  onChange={(e) => setField("ocupacion", e.target.value)}
                />
              </label>
              <label>
                Empresa
                <input value={form.empresa} onChange={(e) => setField("empresa", e.target.value)} />
              </label>
            </div>
            <label>
              Notas
              <textarea
                value={form.notas}
                onChange={(e) => setField("notas", e.target.value)}
                rows={3}
              />
            </label>
            {error && <p className={s.error}>{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Guardando…" : "Registrar"}
            </button>
          </form>

          <section className={s.list}>
            <h2>Registrados ({lista.length})</h2>
            {loading ? (
              <p className={s.muted}>Cargando…</p>
            ) : lista.length === 0 ? (
              <p className={s.muted}>Sin participantes todavía.</p>
            ) : (
              <ul>
                {lista.map((p) => (
                  <li key={p.id}>
                    <strong>{p.nombre}</strong>
                    <span className={s.meta}>
                      {[p.ocupacion, p.empresa, p.edad && `${p.edad} años`]
                        .filter(Boolean)
                        .join(" · ") || "Sin datos adicionales"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
