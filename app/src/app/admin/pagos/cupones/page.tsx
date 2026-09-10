"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/admin/Card";

type Coupon = {
  id: string;
  code: string;
  type: string;
  value: number;
  maxUses: number | null;
  currentUses: number;
  active: boolean;
  expiresAt: string | null;
  grantOnCourseComplete?: boolean;
};

export default function AdminCuponesPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [code, setCode] = useState("");
  const [value, setValue] = useState(100);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/coupons");
    if (res.ok) {
      const data = await res.json();
      setCoupons(data.coupons || []);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function create() {
    setMsg(null);
    const res = await fetch("/api/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: code || `DESC${value}`,
        type: "percentage",
        value,
        maxUses: 50,
      }),
    });
    if (!res.ok) {
      setMsg("Error al crear");
      return;
    }
    setCode("");
    setMsg("Cupón creado");
    void load();
  }

  return (
    <div>
      <PageHeader
        title="Cupones"
        subtitle="Descuentos y cupones al completar 100% del curso"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Pagos", href: "/admin/pagos" },
          { label: "Cupones" },
        ]}
      />

      <Card>
        <h3>Crear cupón porcentual</h3>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          <input
            placeholder="Código"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <input
            type="number"
            min={1}
            max={100}
            value={value}
            onChange={(e) => setValue(Number(e.target.value) || 1)}
          />
          <button type="button" className="btn btn-primary" onClick={() => void create()}>
            Crear
          </button>
        </div>
        {msg && <p>{msg}</p>}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
          <thead>
            <tr>
              <th align="left">Código</th>
              <th align="left">Tipo</th>
              <th align="right">Valor</th>
              <th align="right">Usos</th>
              <th align="left">Origen</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} style={{ borderTop: "1px solid #ddd" }}>
                <td>
                  <code>{c.code}</code>
                </td>
                <td>{c.type}</td>
                <td align="right">{c.value}{c.type === "percentage" ? "%" : ""}</td>
                <td align="right">
                  {c.currentUses}/{c.maxUses ?? "∞"}
                </td>
                <td>{c.grantOnCourseComplete ? "Completar 100%" : "Manual"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
