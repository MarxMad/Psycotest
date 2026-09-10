"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./verificar.module.css";

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
    <main className={styles.page}>
      <p className={styles.brand}>PsycoTest · Verificación CONOCER</p>
      <h1>Constancia</h1>
      {!result && <p className={styles.muted}>Verificando…</p>}
      {result && !result.valid && (
        <div className={styles.cardBad}>
          <p>No se encontró una constancia válida con ese código.</p>
          <Link href="/consultorio">Ir al consultorio</Link>
        </div>
      )}
      {result?.valid && (
        <div className={styles.card}>
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
          <a className={styles.cta} href={`/api/certificates/${code}/pdf`}>
            Descargar PDF
          </a>
        </div>
      )}
    </main>
  );
}
