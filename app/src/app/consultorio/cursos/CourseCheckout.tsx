"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./cursos.module.css";

type Props = {
  courseSlug: string;
  priceLabel: string;
  priceMxn: number;
  stripeReady: boolean;
  hasPriceId: boolean;
  enrolled: boolean;
};

export function CourseCheckout({
  courseSlug,
  priceLabel,
  priceMxn,
  stripeReady,
  hasPriceId,
  enrolled,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const isFree = priceMxn <= 0;

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

  async function enroll(withCoupon?: boolean) {
    setLoading(true);
    setError("");
    const res = await fetch("/api/courses/enroll", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseSlug,
        couponCode: withCoupon ? couponCode.trim() : undefined,
      }),
    });
    const data = (await res.json()) as { error?: string; code?: string };
    setLoading(false);

    if (res.status === 401) {
      router.push(`/consultorio/ingreso?next=/consultorio/cursos/${courseSlug}`);
      return;
    }
    if (!res.ok) {
      setError(data.error ?? "No se pudo inscribir");
      return;
    }
    router.refresh();
    router.push(`/consultorio/cursos/${courseSlug}/aprender`);
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
      <p className={styles.priceTag}>{isFree ? "Gratis" : priceLabel}</p>

      {isFree ? (
        <button type="button" className={styles.btnPrimary} onClick={() => enroll(false)} disabled={loading}>
          {loading ? "Inscribiendo…" : "Inscribirme gratis"}
        </button>
      ) : stripeReady && hasPriceId ? (
        <button type="button" className={styles.btnPrimary} onClick={buy} disabled={loading}>
          {loading ? "Redirigiendo…" : "Comprar con tarjeta"}
        </button>
      ) : (
        <p className={styles.checkoutHint}>
          {stripeReady
            ? "Pago con tarjeta pendiente de configurar. Usa el cupón DEMO100 para acceso inmediato."
            : "Usa el cupón DEMO100 (100% descuento) o BIENVENIDA20 para inscribirte ya."}
        </p>
      )}

      {!isFree ? (
        <div className={styles.couponRow} style={{ marginTop: "0.75rem", display: "grid", gap: "0.5rem" }}>
          <label htmlFor={`coupon-${courseSlug}`} className={styles.checkoutFine}>
            Código de cupón
          </label>
          <input
            id={`coupon-${courseSlug}`}
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="DEMO100"
            autoComplete="off"
            style={{
              padding: "0.55rem 0.75rem",
              borderRadius: "8px",
              border: "1px solid currentColor",
              background: "transparent",
              color: "inherit",
            }}
          />
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => enroll(true)}
            disabled={loading || !couponCode.trim()}
          >
            {loading ? "Aplicando…" : "Inscribirme con cupón"}
          </button>
        </div>
      ) : null}

      {error ? <p className={styles.error}>{error}</p> : null}
      <p className={styles.checkoutFine}>
        ¿Ya tienes cuenta?{" "}
        <Link href={`/consultorio/ingreso?next=/consultorio/cursos/${courseSlug}`}>Inicia sesión</Link>
      </p>
    </div>
  );
}
