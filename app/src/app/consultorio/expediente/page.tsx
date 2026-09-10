"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ConsultorioNav } from "../ConsultorioNav";
import { BrandShell } from "../BrandShell";
import styles from "../conocer-pages.module.css";

type Exp = {
  id: string;
  status: string;
  aprovechamientoPercent: number;
  presencePercentAvg: number;
  program?: { code: string; title: string; courseId: string } | null;
};

export default function MiExpedientePage() {
  const [rows, setRows] = useState<Exp[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [answers, setAnswers] = useState({ q1: "", q2: "", q3: "" });
  const [evidenceTitle, setEvidenceTitle] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/expedientes?mine=1");
      if (res.status === 401) return;
      if (res.ok) {
        const data = await res.json();
        setRows(data.expedientes || []);
      }
    })();
  }, []);

  async function openDetail(id: string) {
    setSelected(id);
    const res = await fetch(`/api/expedientes/${id}`);
    if (res.ok) setDetail(await res.json());
  }

  async function submitEval(type: string) {
    if (!selected) return;
    const res = await fetch(`/api/expedientes/${selected}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "evaluation", type, answers }),
    });
    setMsg(res.ok ? "Evaluación enviada" : "Error al enviar");
    if (res.ok) void openDetail(selected);
  }

  async function submitEvidence() {
    if (!selected || !evidenceTitle.trim()) return;
    const res = await fetch(`/api/expedientes/${selected}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "evidence",
        title: evidenceTitle,
        fileUrl: evidenceUrl || undefined,
        evidenceType: evidenceUrl ? "enlace" : "documento",
      }),
    });
    setMsg(res.ok ? "Evidencia agregada" : "Error");
    if (res.ok) {
      setEvidenceTitle("");
      setEvidenceUrl("");
      void openDetail(selected);
    }
  }

  return (
    <BrandShell>
      <ConsultorioNav />
      <div className={styles.shell} data-anime="page">
        <main className={styles.main}>
          <header className={styles.hero} data-anime="hero">
            <p className={styles.eyebrow}>CONOCER · Expediente</p>
            <h1>Mi expediente</h1>
            <p className={styles.lead}>
              Diagnóstico, evaluaciones, portafolio y seguimiento de aprovechamiento.
            </p>
          </header>

          {rows.length === 0 && (
            <p className={styles.muted}>
              No tienes expedientes abiertos. Inscríbete a un curso o pide a un administrador que
              abra tu expediente.
            </p>
          )}

          <ul className={styles.list}>
            {rows.map((r) => (
              <li key={r.id}>
                <button type="button" onClick={() => void openDetail(r.id)}>
                  <strong>{r.program?.code || "Programa"}</strong>
                  <span>
                    {r.status} · aprov. {r.aprovechamientoPercent}% · presencia{" "}
                    {r.presencePercentAvg}%
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {msg && <p className={styles.msg}>{msg}</p>}

          {detail && (
            <section className={styles.section} data-anime="section">
              <div className={styles.card}>
                <h2>Evaluaciones</h2>
                <div className={styles.form}>
                  <label>
                    ¿Qué esperas del programa?
                    <input
                      value={answers.q1}
                      onChange={(e) => setAnswers((a) => ({ ...a, q1: e.target.value }))}
                    />
                  </label>
                  <label>
                    Nivel percibido actual (1-5)
                    <input
                      value={answers.q2}
                      onChange={(e) => setAnswers((a) => ({ ...a, q2: e.target.value }))}
                    />
                  </label>
                  <label>
                    Comentarios
                    <input
                      value={answers.q3}
                      onChange={(e) => setAnswers((a) => ({ ...a, q3: e.target.value }))}
                    />
                  </label>
                  <div className={styles.row}>
                    <button type="button" onClick={() => void submitEval("diagnostico")}>
                      Diagnóstico
                    </button>
                    <button type="button" onClick={() => void submitEval("inicial")}>
                      Eval. inicial
                    </button>
                    <button type="button" onClick={() => void submitEval("final")}>
                      Eval. final
                    </button>
                    <button type="button" onClick={() => void submitEval("satisfaccion")}>
                      Satisfacción
                    </button>
                  </div>
                </div>
              </div>

              <div className={styles.card}>
                <h2>Portafolio</h2>
                <div className={styles.form}>
                  <input
                    placeholder="Título de evidencia"
                    value={evidenceTitle}
                    onChange={(e) => setEvidenceTitle(e.target.value)}
                  />
                  <input
                    placeholder="URL (opcional)"
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                  />
                  <button type="button" onClick={() => void submitEvidence()}>
                    Agregar evidencia
                  </button>
                </div>
                <ul>
                  {((detail.evidences as Array<{ id: string; title: string }>) || []).map((e) => (
                    <li key={e.id}>{e.title}</li>
                  ))}
                </ul>
              </div>

              <div className={styles.card}>
                <h2>Historial</h2>
                <ul>
                  {(
                    (detail.evaluations as Array<{
                      id: string;
                      type: string;
                      submittedAt: string;
                    }>) || []
                  ).map((e) => (
                    <li key={e.id}>
                      {e.type} · {new Date(e.submittedAt).toLocaleString("es-MX")}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          <p className={styles.muted} style={{ marginTop: "2rem" }}>
            <Link href="/consultorio/constancias">Ver constancias</Link>
            {" · "}
            <Link href="/consultorio/legal">Documentos legales</Link>
          </p>
        </main>
      </div>
    </BrandShell>
  );
}
