"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { APP_NAME } from "@/lib/brand";
import { ConsultorioNav } from "../ConsultorioNav";
import { BrandShell } from "../BrandShell";
import styles from "../conocer-pages.module.css";

export default function ConstanciasLandingPage() {
  const [code, setCode] = useState("");

  useEffect(() => {
    document.title = `Constancias CONOCER | ${APP_NAME}`;
  }, []);

  return (
    <BrandShell>
      <ConsultorioNav />
      <div className={styles.shell} data-anime="page">
        <main className={styles.main}>
          <header className={styles.hero} data-anime="hero">
            <p className={styles.eyebrow}>{APP_NAME}</p>
            <h1>Constancias CONOCER</h1>
            <p className={styles.lead}>
              Formación, evaluación y dictamen con expediente formal. Verifica una constancia o
              inicia tu ruta de certificación.
            </p>
            <div className={styles.ctaRow}>
              <Link href="/consultorio/cursos" className={styles.btnPrimary}>
                Ver programas
              </Link>
              <Link href="/consultorio/expediente" className={styles.btnSecondary}>
                Mi expediente
              </Link>
            </div>
          </header>

          <section className={styles.section} data-anime="section">
            <div className={styles.card}>
              <h2>Verificar constancia</h2>
              <p className={styles.muted}>
                Ingresa el código impreso en tu PDF o escanea el QR.
              </p>
              <form
                className={styles.verifyForm}
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
            </div>
          </section>

          <section className={styles.section} data-anime="section">
            <h2>Qué incluye el expediente</h2>
            <ul className={styles.benefits}>
              <li>Diagnóstico e evaluaciones inicial / final</li>
              <li>Portafolio de evidencias y presencia en vivo</li>
              <li>Permanencia VOD y % de aprovechamiento</li>
              <li>Dictamen y constancia con verificación pública</li>
            </ul>
          </section>
        </main>
      </div>
    </BrandShell>
  );
}
