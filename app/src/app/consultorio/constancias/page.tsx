"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./constancias.module.css";

export default function ConstanciasLandingPage() {
  const [code, setCode] = useState("");

  useEffect(() => {
    document.title = "Constancias CONOCER | PsycoTest";
  }, []);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.brand}>PsycoTest</p>
        <h1>Constancias CONOCER</h1>
        <p className={styles.lead}>
          Formación, evaluación y dictamen con expediente formal. Verifica una constancia o inicia tu
          ruta de certificación.
        </p>
        <div className={styles.ctaRow}>
          <Link href="/consultorio/cursos" className={styles.primary}>
            Ver programas
          </Link>
          <Link href="/consultorio/expediente" className={styles.secondary}>
            Mi expediente
          </Link>
        </div>
      </section>

      <section className={styles.verify}>
        <h2>Verificar constancia</h2>
        <p>Ingresa el código impreso en tu PDF o escanea el QR.</p>
        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            if (code.trim()) window.location.href = `/verificar/${code.trim().toUpperCase()}`;
          }}
        >
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Código de verificación"
            aria-label="Código de verificación"
          />
          <button type="submit">Verificar</button>
        </form>
      </section>

      <section className={styles.benefits}>
        <h2>Qué incluye el expediente</h2>
        <ul>
          <li>Diagnóstico e evaluaciones inicial / final</li>
          <li>Portafolio de evidencias y presencia en vivo</li>
          <li>Permanencia VOD y % de aprovechamiento</li>
          <li>Dictamen y constancia con verificación pública</li>
        </ul>
      </section>
    </main>
  );
}
