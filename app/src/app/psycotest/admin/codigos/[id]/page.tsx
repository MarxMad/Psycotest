"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, Users } from "lucide-react";
import type { Instrumento } from "@/lib/storage";
import s from "../../admin.module.css";
import c from "../codigos.module.css";

const ETIQUETAS: Record<Instrumento, string> = {
  papi: "PAPI",
  hartman: "Hartman",
  mabe: "MABE",
};

interface CodeInfo {
  id: string;
  label: string;
  empresa: string | null;
  codeSuffix: string;
  allowedInstruments: Instrumento[];
  maxUses: number;
  usedCount: number;
  active: boolean;
  createdAt: string;
}

interface UsageRow {
  id: string;
  participantNombre: string;
  empresa: string | null;
  puesto: string | null;
  completedInstruments: Instrumento[];
  pendingInstruments: Instrumento[];
  progress: string;
  createdAt: string;
  sessions: Array<{
    id: string;
    instrumento: Instrumento;
    iniciada: string;
    actualizada: string;
    aprobada: boolean;
    terminada: boolean;
  }>;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toCsv(code: CodeInfo, rows: UsageRow[]) {
  const header = [
    "Nombre",
    "Empresa",
    "Puesto",
    "Fecha acceso",
    "Progreso",
    "Completadas",
    "Pendientes",
    "Sesiones (id · prueba · fecha)",
  ];
  const lines = rows.map((r) => [
    r.participantNombre,
    r.empresa ?? "",
    r.puesto ?? "",
    fmt(r.createdAt),
    r.progress,
    r.completedInstruments.map((i) => ETIQUETAS[i]).join("; "),
    r.pendingInstruments.map((i) => ETIQUETAS[i]).join("; ") || "—",
    r.sessions.map((ses) => `${ses.id} · ${ETIQUETAS[ses.instrumento]} · ${fmt(ses.actualizada)}`).join(" | "),
  ]);
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  return [
    `# Lote: ${code.label}`,
    `# Código: ••••-${code.codeSuffix} · Cupos: ${code.usedCount}/${code.maxUses}`,
    header.map(esc).join(","),
    ...lines.map((row) => row.map(esc).join(",")),
  ].join("\n");
}

export default function CodigoReportePage() {
  const { id } = useParams<{ id: string }>();
  const [code, setCode] = useState<CodeInfo | null>(null);
  const [rows, setRows] = useState<UsageRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch(`/api/admin/codigos/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCode(data.code);
        setRows(data.rows);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  const completadasTotal = useMemo(
    () => rows.reduce((a, r) => a + r.completedInstruments.length, 0),
    [rows],
  );

  function exportarCsv() {
    if (!code) return;
    const blob = new Blob([toCsv(code, rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-${code.label.replace(/\s+/g, "-").slice(0, 40)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <main className={s.main}>
        <div className={s.wrap}>
          <p className={s.muted}>Cargando reporte…</p>
        </div>
      </main>
    );
  }

  if (!code) {
    return (
      <main className={s.main}>
        <div className={s.wrap}>
          <p>Código no encontrado.</p>
          <Link href="/psycotest/admin/codigos" className="btn">
            Volver
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className={s.main}>
      <div className={s.wrap}>
        <nav className={s.crumb}>
          <Link href="/psycotest/admin">Panel</Link>
          <span>/</span>
          <Link href="/psycotest/admin/codigos">Códigos</Link>
          <span>/</span>
          <span>Reporte</span>
        </nav>

        <header className={s.detailHead}>
          <div>
            <span className="eyebrow">Reporte de uso</span>
            <h1>{code.label}</h1>
            <p className={s.muted}>
              Código ••••-{code.codeSuffix}
              {code.empresa && <> · {code.empresa}</>}
              {" · "}
              {code.usedCount}/{code.maxUses} cupos usados
            </p>
          </div>
          <div className={s.row}>
            <Link href="/psycotest/admin/codigos" className="btn">
              <ArrowLeft size={16} />
              Volver
            </Link>
            <button type="button" className="btn btn-primary" onClick={exportarCsv} disabled={rows.length === 0}>
              <Download size={16} />
              Exportar CSV
            </button>
          </div>
        </header>

        <div className={c.reportStats}>
          <div className={c.stat}>
            <Users size={18} />
            <span className={c.statN}>{rows.length}</span>
            <span>Personas registradas</span>
          </div>
          <div className={c.stat}>
            <span className={c.statN}>{completadasTotal}</span>
            <span>Pruebas terminadas</span>
          </div>
          <div className={c.stat}>
            <span className={c.statN}>{code.allowedInstruments.length}</span>
            <span>Pruebas por persona</span>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className={s.empty}>
            <p>Nadie ha usado este código todavía.</p>
          </div>
        ) : (
          <div className={s.tableShell}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Participante</th>
                  <th>Empresa / puesto</th>
                  <th>Acceso</th>
                  <th>Progreso</th>
                  <th>Completadas</th>
                  <th>Pendientes</th>
                  <th>Sesiones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.participantNombre}</strong>
                    </td>
                    <td className={s.muted}>
                      {[row.empresa, row.puesto].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className={s.muted}>{fmt(row.createdAt)}</td>
                    <td className="mono">{row.progress}</td>
                    <td>
                      <div className={c.tags}>
                        {row.completedInstruments.length === 0 ? (
                          <span className={s.muted}>—</span>
                        ) : (
                          row.completedInstruments.map((i) => (
                            <span key={i} className={c.tagDone}>
                              {ETIQUETAS[i]}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td>
                      <div className={c.tags}>
                        {row.pendingInstruments.length === 0 ? (
                          <span className={c.tagAllDone}>Listo</span>
                        ) : (
                          row.pendingInstruments.map((i) => (
                            <span key={i} className={c.tagPending}>
                              {ETIQUETAS[i]}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td>
                      {row.sessions.length === 0 ? (
                        <span className={s.muted}>Sin envíos</span>
                      ) : (
                        <ul className={c.sessionList}>
                          {row.sessions.map((ses) => (
                            <li key={ses.id}>
                              <Link href={`/psycotest/admin/${ses.id}`} className={s.link}>
                                {ETIQUETAS[ses.instrumento]}
                                {ses.aprobada ? " ✓" : ""}
                              </Link>
                              <span className={s.muted}> · {fmt(ses.actualizada)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
