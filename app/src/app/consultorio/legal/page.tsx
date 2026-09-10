"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ConsultorioNav } from "../ConsultorioNav";
import { BrandShell } from "../BrandShell";
import styles from "../conocer-pages.module.css";

type Doc = {
  id: string;
  type: string;
  title: string;
  bodyMarkdown: string;
  version: string;
};

export default function LegalDocsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [acked, setAcked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/legal");
      if (res.ok) {
        const data = await res.json();
        setDocs(data.documents || []);
      }
    })();
  }, []);

  async function ack(id: string) {
    const res = await fetch("/api/legal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId: id }),
    });
    if (res.ok) setAcked((a) => ({ ...a, [id]: true }));
    else if (res.status === 401) {
      window.location.href = "/login?next=/consultorio/legal";
    }
  }

  return (
    <BrandShell>
      <ConsultorioNav />
      <div className={styles.shell} data-anime="page">
        <main className={styles.main}>
          <header className={styles.hero} data-anime="hero">
            <p className={styles.eyebrow}>Legal</p>
            <h1>Documentos legales</h1>
            <p className={styles.lead}>
              Finiquito, liquidación y avisos compartidos del programa de certificación.
            </p>
          </header>

          {docs.map((d) => (
            <article key={d.id} className={styles.card} data-anime="section">
              <h2>
                {d.title} <span>v{d.version}</span>
              </h2>
              <pre className={styles.body}>{d.bodyMarkdown}</pre>
              <button type="button" onClick={() => void ack(d.id)} disabled={acked[d.id]}>
                {acked[d.id] ? "Acuse registrado" : "Registrar acuse de lectura"}
              </button>
            </article>
          ))}

          <p className={styles.muted}>
            <Link href="/consultorio/expediente">Mi expediente</Link>
          </p>
        </main>
      </div>
    </BrandShell>
  );
}
