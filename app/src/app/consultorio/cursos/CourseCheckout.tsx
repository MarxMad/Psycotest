"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./cursos.module.css";

type Props = {
  courseSlug: string;
  priceLabel: string;
  stripeReady: boolean;
  hasPriceId: boolean;
  enrolled: boolean;
};

export function CourseCheckout({ courseSlug, priceLabel, stripeReady, hasPriceId, enrolled }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function buy() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/stripe/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseSlug }),
    });
    const data = (await res.json()) as { url?: string; error?: string; code?: string };
    setLoading(false);

    if (res.status === 401) {
      router.push(`/consultorio/ingreso?next=/consultorio/cursos/${courseSlug}`);
      return;
    }
    if (!res.ok) {
      setError(data.error ?? "No se pudo iniciar el pago");
      return;
    }
    if (data.url) window.location.href = data.url;
  }

  async function devEnroll() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/courses/enroll", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ courseSlug }) });
    setLoading(false);
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Error");
      return;
    }
    router.refresh();
  }

  if (enrolled) {
    return (
      <div className={styles.checkoutBox}>
        <p className={styles.enrolledBadge}>Ya estás inscrito</p>
        <Link href={`/consultorio/cursos/${courseSlug}/aprender`} className={styles.btnPrimary}>
          Continuar viendo →
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.checkoutBox}>
      <p className={styles.priceTag}>{priceLabel}</p>
      {stripeReady && hasPriceId ? (
        <button type="button" className={styles.btnPrimary} onClick={buy} disabled={loading}>
          {loading ? "Redirigiendo…" : "Comprar con tarjeta"}
        </button>
      ) : (
        <>
          <p className={styles.checkoutHint}>
            {stripeReady
              ? "Falta configurar STRIPE_PRICE_* para este curso."
              : "Stripe no configurado — usa inscripción de prueba en desarrollo."}
          </p>
          {process.env.NODE_ENV !== "production" ? (
            <button type="button" className={styles.btnSecondary} onClick={devEnroll} disabled={loading}>
              Inscribirme (dev)
            </button>
          ) : (
            <Link href={`/consultorio/ingreso?next=/consultorio/cursos/${courseSlug}`} className={styles.btnSecondary}>
              Crear cuenta / iniciar sesión
            </Link>
          )}
        </>
      )}
      {error ? <p className={styles.error}>{error}</p> : null}
      <p className={styles.checkoutFine}>
        ¿Ya tienes cuenta?{" "}
        <Link href={`/consultorio/ingreso?next=/consultorio/cursos/${courseSlug}`}>Inicia sesión</Link>
      </p>
    </div>
  );
}
