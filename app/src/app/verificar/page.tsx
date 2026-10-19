"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./verificar.module.css";

/**
 * Verificación pública de constancias.
 *
 * Cualquiera puede llegar aquí con el código impreso en el PDF: un
 * empleador comprobando una constancia no tiene cuenta ni la necesita.
 * El resultado se muestra en /verificar/[code].
 */
export default function VerificarPage() {
  const [codigo, setCodigo] = useState("");

  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>Verificación pública</p>
        <h1>Comprobar una constancia</h1>
        <p className={styles.lead}>
          Escribe el código impreso en el documento o escanea su QR. No necesitas cuenta.
        </p>

        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            const limpio = codigo.trim().toUpperCase();
            if (limpio) window.location.href = `/verificar/${encodeURIComponent(limpio)}`;
          }}
        >
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Código de verificación"
            aria-label="Código de verificación"
            autoFocus
          />
          <button type="submit" disabled={!codigo.trim()}>
            Verificar
          </button>
        </form>

        <p className={styles.pie}>
          ¿Buscas tu propia constancia?{" "}
          <Link href="/mi-cuenta/expediente">Entra a tu expediente</Link>.
        </p>
      </div>
    </main>
  );
}
