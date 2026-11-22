"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, KeyRound, Layers, Plus } from "lucide-react";
import type { Instrumento } from "@/lib/storage";
import s from "../../admin.module.css";
import c from "./codigos.module.css";
import { NOMBRE_INSTRUMENTO } from "@/lib/instrumentos";

const INSTRUMENTOS: { id: Instrumento; label: string }[] = (
  ["papi", "hartman", "mabe", "cleaver", "lifo", "socioeconomico"] as Instrumento[]
).map((id) => ({ id, label: NOMBRE_INSTRUMENTO[id] }));

interface CodeRow {
  id: string;
  label: string;
  empresa: string | null;
  codeSuffix: string;
  allowedInstruments: Instrumento[];
  maxUses: number;
  usedCount: number;
  active: boolean;
  expiresAt: string | null;
  createdAt: string;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function CodigosPage() {
  const [codes, setCodes] = useState<CodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [maxUses, setMaxUses] = useState(30);
  const [allowed, setAllowed] = useState<Instrumento[]>(["papi", "hartman", "mabe", "cleaver", "lifo"]);
  const [nuevoCodigo, setNuevoCodigo] = useState<string | null>(null);
  const [error, setError] = useState("");
  // Banco de códigos: uno por cada aplicación de cada prueba.
  const [showLote, setShowLote] = useState(false);
  const [lote, setLote] = useState({ empresa: "", clienteEmail: "", clienteNombre: "", vigenciaDias: 180 });
  const [cantidades, setCantidades] = useState<Partial<Record<Instrumento, number>>>({});
  const [generados, setGenerados] = useState<{ codigo: string; prueba: string }[] | null>(null);
  const [generando, setGenerando] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/codigos");
    if (res.ok) {
      const data = await res.json();
      setCodes(data.codes);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function toggleInstrumento(id: Instrumento) {
    setAllowed((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/codigos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, empresa, maxUses, allowedInstruments: allowed }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error al crear");
      return;
    }
    setNuevoCodigo(data.code.plainCode);
    setShowForm(false);
    setLabel("");
    setEmpresa("");
    setMaxUses(30);
    load();
  }

  async function crearLote(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setGenerando(true);
    const res = await fetch("/api/admin/codigos/lote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...lote, cantidades }),
    });
    const data = await res.json().catch(() => ({}));
    setGenerando(false);
    if (!res.ok) {
      setError(data.error ?? "Error al generar");
      return;
    }
    setGenerados(data.codigos);
    setShowLote(false);
    setCantidades({});
    load();
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/admin/codigos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    load();
  }

  function copiar(text: string) {
    navigator.clipboard.writeText(text);
  }

  return (
    <main className={s.main}>
      <div className={s.wrap}>
        <nav className={s.crumb}>
          <Link href="/admin">Panel</Link>
          <span>/</span>
          <span>Códigos de acceso</span>
        </nav>

        <header className={s.detailHead}>
          <div>
            <span className="eyebrow">Control masivo</span>
            <h1>Códigos de acceso</h1>
            <p className={s.muted}>
              Genera lotes con cupos limitados para empresas. Cada código define qué pruebas puede
              aplicar el participante.
            </p>
          </div>
          <div className={s.row}>
            <button type="button" className="btn" onClick={() => { setShowLote(true); setShowForm(false); }}>
              <Layers size={16} />
              Banco de códigos
            </button>
            <button type="button" className="btn btn-primary" onClick={() => { setShowForm(true); setShowLote(false); }}>
              <Plus size={16} />
              Nuevo código
            </button>
          </div>
        </header>

        {nuevoCodigo && (
          <div className={c.reveal} role="alert">
            <KeyRound size={20} />
            <div>
              <strong>Código generado — cópialo ahora</strong>
              <p>No se volverá a mostrar completo por seguridad.</p>
              <code className={c.plainCode}>{nuevoCodigo}</code>
              <button type="button" className="btn" onClick={() => copiar(nuevoCodigo)}>
                <Copy size={14} /> Copiar
              </button>
            </div>
            <button type="button" className={c.close} onClick={() => setNuevoCodigo(null)} aria-label="Cerrar">
              ×
            </button>
          </div>
        )}

        {generados && (
          <div className={c.reveal} role="alert">
            <KeyRound size={20} />
            <div>
              <strong>{generados.length} códigos generados, uno por prueba</strong>
              <p>
                Cópialos ahora. Si indicaste el correo de la empresa, también los ve en su panel
                (Mis evaluaciones).
              </p>
              <pre className={c.plainCode} style={{ maxHeight: 240, overflow: "auto", whiteSpace: "pre-wrap" }}>
                {generados.map((g) => `${g.prueba}: ${g.codigo}`).join("\n")}
              </pre>
              <button
                type="button"
                className="btn"
                onClick={() => copiar(generados.map((g) => `${g.prueba}: ${g.codigo}`).join("\n"))}
              >
                <Copy size={14} /> Copiar todos
              </button>
            </div>
            <button type="button" className={c.close} onClick={() => setGenerados(null)} aria-label="Cerrar">
              ×
            </button>
          </div>
        )}

        {showLote && (
          <form className={c.form} onSubmit={crearLote}>
            <h2>Banco de códigos</h2>
            <p className={s.muted}>
              Un código por aplicación: cada uno abre una sola prueba para una persona, una vez. Quien lo
              activa tiene 24 horas para contestar.
            </p>
            <label>
              Empresa
              <input
                value={lote.empresa}
                onChange={(e) => setLote((l) => ({ ...l, empresa: e.target.value }))}
                placeholder="Ej. Empresa ABC"
              />
            </label>
            <label>
              Correo de la empresa (para que los vea en su panel)
              <input
                type="email"
                value={lote.clienteEmail}
                onChange={(e) => setLote((l) => ({ ...l, clienteEmail: e.target.value }))}
                placeholder="Opcional"
              />
            </label>
            <label>
              Nombre del contacto
              <input
                value={lote.clienteNombre}
                onChange={(e) => setLote((l) => ({ ...l, clienteNombre: e.target.value }))}
                placeholder="Opcional"
              />
            </label>
            <label>
              Vigencia sin activar (días)
              <input
                type="number"
                min={1}
                max={730}
                value={lote.vigenciaDias}
                onChange={(e) => setLote((l) => ({ ...l, vigenciaDias: Number(e.target.value) }))}
              />
            </label>
            <fieldset className={c.checks}>
              <legend>Cuántos códigos de cada prueba</legend>
              {INSTRUMENTOS.filter((i) => i.id !== "socioeconomico").map((i) => (
                <label key={i.id} className={c.check}>
                  <input
                    type="number"
                    min={0}
                    max={500}
                    value={cantidades[i.id] ?? 0}
                    onChange={(e) => setCantidades((q) => ({ ...q, [i.id]: Math.max(0, Number(e.target.value) || 0) }))}
                    style={{ width: "5rem" }}
                  />
                  {i.label}
                </label>
              ))}
            </fieldset>
            {error && <p className={c.error}>{error}</p>}
            <div className={s.row}>
              <button type="button" className="btn" onClick={() => setShowLote(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={generando}>
                {generando
                  ? "Generando…"
                  : `Generar ${Object.values(cantidades).reduce((n, v) => n + (v ?? 0), 0)} códigos`}
              </button>
            </div>
          </form>
        )}

        {showForm && (
          <form className={c.form} onSubmit={crear}>
            <h2>Nuevo lote</h2>
            <label>
              Nombre del lote
              <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ej. Empresa ABC — Gerentes 2026" required />
            </label>
            <label>
              Empresa
              <input value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Opcional" />
            </label>
            <label>
              Cupos (personas)
              <input type="number" min={1} max={500} value={maxUses} onChange={(e) => setMaxUses(Number(e.target.value))} required />
            </label>
            <fieldset className={c.checks}>
              <legend>Pruebas incluidas</legend>
              {INSTRUMENTOS.map((i) => (
                <label key={i.id} className={c.check}>
                  <input
                    type="checkbox"
                    checked={allowed.includes(i.id)}
                    onChange={() => toggleInstrumento(i.id)}
                  />
                  {i.label}
                </label>
              ))}
            </fieldset>
            {error && <p className={c.error}>{error}</p>}
            <div className={s.row}>
              <button type="button" className="btn" onClick={() => setShowForm(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Generar código
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p className={s.muted}>Cargando…</p>
        ) : codes.length === 0 ? (
          <div className={s.empty}>
            <p>No hay códigos. Crea uno para aplicaciones masivas.</p>
          </div>
        ) : (
          <div className={s.tableShell}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Lote</th>
                  <th>Código</th>
                  <th>Pruebas</th>
                  <th>Cupos</th>
                  <th>Estado</th>
                  <th>Creado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {codes.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.label}</strong>
                      {row.empresa && <span className={s.muted}> · {row.empresa}</span>}
                    </td>
                    <td className="mono">••••-{row.codeSuffix}</td>
                    <td>{row.allowedInstruments.map((i) => i.toUpperCase()).join(", ")}</td>
                    <td className="mono">
                      {row.usedCount}/{row.maxUses}
                    </td>
                    <td>
                      <span className={row.active ? s.validated : s.pending}>
                        {row.active ? "Activo" : "Desactivado"}
                      </span>
                    </td>
                    <td className={s.muted}>{fmt(row.createdAt)}</td>
                    <td>
                      <div className={c.rowActions}>
                        <Link href={`/admin/pruebas/codigos/${row.id}`} className={s.link}>
                          Reporte →
                        </Link>
                        <button
                          type="button"
                          className="btn"
                          onClick={() => toggleActive(row.id, !row.active)}
                        >
                          {row.active ? "Desactivar" : "Activar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className={c.securityNote}>
          <strong>Seguridad:</strong> los códigos se almacenan con hash criptográfico (nunca en texto
          plano). Rate limiting en validación. Cada envío de prueba requiere cookie firmada de 8 h.
        </div>
      </div>
    </main>
  );
}
