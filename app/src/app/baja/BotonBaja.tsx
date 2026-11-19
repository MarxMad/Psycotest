"use client";

import { useState } from "react";
import s from "./baja.module.css";

export function BotonBaja({ e, m, t }: { e: string; m: string; t: string }) {
  const [estado, setEstado] = useState<"listo" | "enviando" | "hecho" | "error">("listo");

  async function baja(todas: boolean) {
    setEstado("enviando");
    try {
      const r = await fetch("/api/correo/baja", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ e, m, t, todas }),
      });
      setEstado(r.ok ? "hecho" : "error");
    } catch {
      setEstado("error");
    }
  }

  if (estado === "hecho") return <p className={s.ok}>Listo: ya no recibirás promociones.</p>;

  return (
    <div className={s.acciones}>
      <button type="button" className={s.boton} disabled={estado === "enviando"} onClick={() => void baja(false)}>
        Confirmar baja
      </button>
      <button type="button" className={s.secundario} disabled={estado === "enviando"} onClick={() => void baja(true)}>
        Darme de baja de las tres marcas
      </button>
      {estado === "error" ? <p className={s.error}>No se pudo registrar. Intenta de nuevo.</p> : null}
    </div>
  );
}
