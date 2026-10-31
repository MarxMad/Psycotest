"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardHeader } from "@/components/admin/Card";
import { EmptyState } from "@/components/admin/EmptyState";
import s from "./cupones.module.css";

type Coupon = {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  maxUses: number | null;
  currentUses: number;
  active: boolean;
  expiresAt: string | null;
  grantOnCourseComplete?: boolean;
};

/** Lo que el cliente ve del cupón: vigente, agotado, vencido o pausado. */
function estado(c: Coupon): { texto: string; clase: string } {
  if (!c.active) return { texto: "Desactivado", clase: s.apagado };
  if (c.expiresAt && new Date(c.expiresAt) < new Date()) return { texto: "Vencido", clase: s.apagado };
  if (c.maxUses && c.currentUses >= c.maxUses) return { texto: "Agotado", clase: s.apagado };
  return { texto: "Vigente", clase: s.vigente };
}

function valor(c: Coupon) {
  return c.type === "percentage"
    ? `${c.value}%`
    : `$${(c.value / 100).toLocaleString("es-MX")} MXN`;
}

export default function AdminCuponesPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState({
    code: "",
    type: "percentage" as Coupon["type"],
    value: "10",
    maxUses: "",
    expiresAt: "",
  });
  const [msg, setMsg] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [borrando, setBorrando] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/coupons");
    if (res.ok) {
      const data = await res.json();
      setCoupons(data.coupons || []);
    }
    setCargando(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const numero = parseFloat(form.value);
    const res = await fetch("/api/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.code,
        type: form.type,
        // Los descuentos fijos se guardan en centavos, como los precios.
        value: form.type === "fixed" ? Math.round(numero * 100) : Math.round(numero),
        maxUses: form.maxUses ? parseInt(form.maxUses) : null,
        // Vence al terminar el día elegido.
        expiresAt: form.expiresAt ? new Date(`${form.expiresAt}T23:59:59`).toISOString() : null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg({ tipo: "error", texto: data.error ?? "Error al crear" });
      return;
    }
    setForm((f) => ({ ...f, code: "", maxUses: "", expiresAt: "" }));
    setMsg({ tipo: "ok", texto: `Cupón ${data.coupon.code} creado` });
    void load();
  }

  async function cambiar(c: Coupon, active: boolean) {
    setMsg(null);
    const res = await fetch(`/api/coupons/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    if (res.ok) {
      setCoupons((cs) => cs.map((x) => (x.id === c.id ? { ...x, active } : x)));
    } else {
      const data = await res.json().catch(() => ({}));
      setMsg({ tipo: "error", texto: data.error ?? "No se pudo cambiar el cupón" });
    }
  }

  async function borrar(c: Coupon) {
    setMsg(null);
    const res = await fetch(`/api/coupons/${c.id}`, { method: "DELETE" });
    setBorrando(null);
    if (res.ok) {
      setCoupons((cs) => cs.filter((x) => x.id !== c.id));
    } else {
      const data = await res.json().catch(() => ({}));
      setMsg({ tipo: "error", texto: data.error ?? "No se pudo borrar" });
    }
  }

  return (
    <div className={s.container}>
      <PageHeader
        title="Cupones"
        subtitle="Descuentos y cupones al completar 100% del curso"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Pagos", href: "/admin/pagos" },
          { label: "Cupones" },
        ]}
      />

      <Card className={s.bloque}>
        <CardHeader title="Crear cupón" />
        <form className={s.form} onSubmit={create}>
          <label className={s.campo}>
            <span>Código</span>
            <input
              className={s.input}
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="BIENVENIDA10"
              required
            />
          </label>
          <label className={s.campo}>
            <span>Tipo</span>
            <select
              className={s.input}
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as Coupon["type"] })}
            >
              <option value="percentage">Porcentaje</option>
              <option value="fixed">Monto fijo (MXN)</option>
            </select>
          </label>
          <label className={s.campo}>
            <span>{form.type === "percentage" ? "Descuento (%)" : "Descuento (MXN)"}</span>
            <input
              className={s.input}
              type="number"
              min={1}
              max={form.type === "percentage" ? 100 : undefined}
              step={form.type === "percentage" ? 1 : 0.01}
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              required
            />
          </label>
          <label className={s.campo}>
            <span>Tope de usos</span>
            <input
              className={s.input}
              type="number"
              min={1}
              value={form.maxUses}
              onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
              placeholder="Sin tope"
            />
          </label>
          <label className={s.campo}>
            <span>Vence</span>
            <input
              className={s.input}
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
            />
          </label>
          <button type="submit" className="btn btn-primary">
            Crear
          </button>
        </form>
        {msg && (
          <p role="status" className={msg.tipo === "ok" ? s.ok : s.error}>
            {msg.texto}
          </p>
        )}
      </Card>

      {cargando ? (
        <Card>
          <p className={s.muted}>Cargando cupones...</p>
        </Card>
      ) : coupons.length === 0 ? (
        <Card>
          <EmptyState title="Sin cupones" description="Los cupones que crees aparecerán aquí" />
        </Card>
      ) : (
        <Card padding="none">
          <div className={s.tablaCaja}>
            <table className={s.tabla}>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Descuento</th>
                  <th>Usos</th>
                  <th>Vence</th>
                  <th>Origen</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => {
                  const e = estado(c);
                  return (
                    <tr key={c.id}>
                      <td>
                        <code>{c.code}</code>
                      </td>
                      <td>{valor(c)}</td>
                      <td>
                        {c.currentUses}/{c.maxUses ?? "∞"}
                      </td>
                      <td className={s.muted}>
                        {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("es-MX") : "—"}
                      </td>
                      <td className={s.muted}>{c.grantOnCourseComplete ? "Completar 100%" : "Manual"}</td>
                      <td>
                        <span className={`${s.estado} ${e.clase}`}>{e.texto}</span>
                      </td>
                      <td className={s.acciones}>
                        <button type="button" className="btn btn-sm" onClick={() => void cambiar(c, !c.active)}>
                          {c.active ? "Desactivar" : "Activar"}
                        </button>
                        {c.currentUses === 0 &&
                          (borrando === c.id ? (
                            <>
                              <button type="button" className="btn btn-sm" onClick={() => void borrar(c)}>
                                Sí, borrar
                              </button>
                              <button type="button" className="btn btn-sm" onClick={() => setBorrando(null)}>
                                No
                              </button>
                            </>
                          ) : (
                            <button type="button" className="btn btn-sm" onClick={() => setBorrando(c.id)}>
                              Borrar
                            </button>
                          ))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
