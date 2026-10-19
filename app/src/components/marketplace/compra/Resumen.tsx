"use client";

import { useState, type ReactNode } from "react";
import { Tag, X } from "lucide-react";
import { useCarrito } from "@/lib/carrito";
import { calcularTotales } from "@/lib/ceduct/totales";
import { precio } from "@/lib/ceduct/tipos";
import s from "../mk.module.css";
import k from "./compra.module.css";

/** Campo de cupón: lo valida el servidor y lo recuerda el carrito. */
export function CampoCupon() {
  const { cupon, aplicarCupon } = useCarrito();
  const [codigo, setCodigo] = useState("");
  const [estado, setEstado] = useState<"" | "validando" | "error">("");
  const [mensaje, setMensaje] = useState("");

  async function validar(e: React.FormEvent) {
    e.preventDefault();
    const code = codigo.trim().toUpperCase();
    if (!code) return;
    setEstado("validando");
    setMensaje("");
    try {
      const r = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.valid) throw new Error(d.error ?? "Ese cupón no es válido.");
      aplicarCupon({ code: d.coupon.code, type: d.coupon.type, value: d.coupon.value });
      setCodigo("");
      setEstado("");
      setMensaje(`Cupón ${d.coupon.code} aplicado.`);
    } catch (err) {
      setEstado("error");
      setMensaje((err as Error).message);
    }
  }

  if (cupon) {
    return (
      <div className={k.cuponAplicado}>
        <Tag size={16} aria-hidden />
        <span>
          Cupón <strong>{cupon.code}</strong> ·{" "}
          {cupon.type === "percentage" ? `${cupon.value}%` : precio(cupon.value)} de descuento
        </span>
        <button type="button" onClick={() => aplicarCupon(null)} aria-label={`Quitar cupón ${cupon.code}`}>
          <X size={16} aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <form className={k.cupon} onSubmit={validar} noValidate>
      <label htmlFor="cupon" className={s.visualmenteOculto}>
        Cupón de descuento
      </label>
      <input
        id="cupon"
        className={s.entrada}
        placeholder="Cupón de descuento"
        value={codigo}
        onChange={(e) => setCodigo(e.target.value)}
        autoComplete="off"
        aria-invalid={estado === "error"}
        aria-describedby="cupon-msg"
      />
      <button type="submit" className={`${s.btn} ${s.btnSecundario}`} disabled={estado === "validando" || !codigo.trim()}>
        {estado === "validando" ? "…" : "Aplicar"}
      </button>
      <p id="cupon-msg" role="status" className={estado === "error" ? s.error : s.ayuda}>
        {mensaje}
      </p>
    </form>
  );
}

/** Subtotal, descuento, IVA y total. Mismo cálculo en carrito y checkout. */
export function Totales({ children, titulo = "Resumen" }: { children?: ReactNode; titulo?: string }) {
  const { items, cupon } = useCarrito();
  const t = calcularTotales(items, cupon);
  const pct = Math.round(t.tasa * 100);

  return (
    <div className={`${s.tarjeta} ${k.resumen}`}>
      <h2 className={k.resumenTitulo}>{titulo}</h2>
      <dl className={k.cifras}>
        <div>
          <dt>
            {items.length} {items.length === 1 ? "programa" : "programas"}
          </dt>
          <dd>{precio(t.bruto, true)}</dd>
        </div>
        {t.descuento > 0 && (
          <div className={k.descuento}>
            <dt>Descuento ({cupon?.code})</dt>
            <dd>−{precio(t.descuento, true)}</dd>
          </div>
        )}
        <div className={k.separa}>
          <dt>Subtotal{t.incluido ? " sin IVA" : ""}</dt>
          <dd>{precio(t.subtotal, true)}</dd>
        </div>
        <div>
          <dt>IVA ({pct}%)</dt>
          <dd>{precio(t.impuestos, true)}</dd>
        </div>
        <div className={k.total}>
          <dt>Total</dt>
          <dd>
            {precio(t.total, true)} <small>MXN</small>
          </dd>
        </div>
      </dl>
      {children}
    </div>
  );
}
