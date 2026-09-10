"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { APP_NAME } from "@/lib/brand";
import { ConsultorioNav } from "@/app/consultorio/ConsultorioNav";
import { BrandShell } from "@/app/consultorio/BrandShell";
import styles from "@/app/consultorio/conocer-pages.module.css";

type Result = {
  valid: boolean;
  folio?: string;
  issuedAt?: string;
  participant?: string;
  course?: string;
  dictamen?: Record<string, unknown>;
  error?: string;
};

export default function VerificarPage() {
  const { code } = useParams<{ code: string }>();
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/certificates/verify/${code}`);
      const data = await res.json();
      setResult(data);
    })();
  }, [code]);

  return (
    <BrandShell>
      <ConsultorioNav />
      <div className={styles.shell} data-anime="page">
        <main className={styles.main}>
          <header className={styles.hero} data-anime="hero">
            <p className={styles.eyebrow}>{APP_NAME} · Verificación CONOCER</p>
            <h1>Constancia</h1>
          </header>

          {!result && <p className={styles.muted}>Verificando…</p>}
          {result && !result.valid && (
            <div className={styles.card}>
              <p>No se encontró una constancia válida con ese código.</p>
              <Link href="/consultorio/constancias" className={styles.btnPrimary}>
                Ir a constancias
              </Link>
            </div>
          )}
          {result?.valid && (
            <div className={styles.card} data-anime="section">
              <p className={styles.ok}>Constancia válida</p>
              <h2>{result.participant}</h2>
              <p>{result.course}</p>
              <p className={styles.meta}>Folio {result.folio}</p>
              <p className={styles.meta}>
                Emitida{" "}
                {result.issuedAt
                  ? new Date(result.issuedAt).toLocaleDateString("es-MX", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "—"}
              </p>
              <div className={styles.ctaRow}>
                <a className={styles.btnPrimary} href={`/api/certificates/${code}/pdf`}>
                  Descargar PDF
                </a>
                <Link href="/consultorio/constancias" className={styles.btnSecondary}>
                  Más información
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>
    </BrandShell>
  );
}
