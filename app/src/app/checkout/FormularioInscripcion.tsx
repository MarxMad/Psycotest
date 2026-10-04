"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { useCarrito } from "@/lib/carrito";
import { precioMxn } from "@/lib/diplomados-formato";
import { CONTACTO, whatsapp } from "@/lib/contacto";
import s from "../diplomados/ceduct.module.css";

export function FormularioInscripcion() {
  const { items, total, listo, vaciar } = useCarrito();
  const [datos, setDatos] = useState({ nombre: "", email: "", telefono: "", notas: "" });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hecho, setHecho] = useState<{ pedidoId: string; total: number } | null>(null);

  const campo = (k: keyof typeof datos) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setDatos((d) => ({ ...d, [k]: e.target.value }));

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const r = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...datos, slugs: items.map((i) => i.slug) }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "No se pudo registrar la inscripción");
      setHecho({ pedidoId: d.pedidoId, total: d.total });
      vaciar();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  if (hecho) {
    return (
      <div className={s.detalle}>
        <div className={s.exito}>
          <span className={s.exitoIcono} aria-hidden>
            <Check size={24} />
          </span>
          <h1>Solicitud registrada</h1>
          <p className={s.parrafo}>
            Tu inscripción quedó con el folio <strong>{hecho.pedidoId}</strong> por{" "}
            {precioMxn(hecho.total)}. Te contactamos para confirmar el pago y darte tus accesos.
          </p>
          <div className={s.exitoAcciones}>
            <a
              className={s.btnPrimario}
              href={whatsapp(`Hola, acabo de inscribirme. Mi folio es ${hecho.pedidoId}.`)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Confirmar por WhatsApp
            </a>
            <a className={s.btnSecundario} href={`mailto:${CONTACTO.email}`}>
              {CONTACTO.email}
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (listo && items.length === 0) {
    return (
      <div className={s.detalle}>
        <h1 className={s.detalleTitulo}>No hay nada que inscribir</h1>
        <p className={s.parrafo}>Elige un diplomado del catálogo para continuar.</p>
        <Link href="/diplomados" className={s.btnPrimario}>
          Ver diplomados
        </Link>
      </div>
    );
  }

  return (
    <div className={s.detalle}>
      <h1 className={s.detalleTitulo}>Completa tu inscripción</h1>
      <p className={s.parrafo}>
        Déjanos tus datos y registramos tu lugar. Te contactamos para confirmar el pago.
      </p>

      <div className={s.carritoRejilla}>
        <form className={s.formulario} onSubmit={enviar}>
          <label className={s.campo}>
            <span>Nombre completo *</span>
            <input value={datos.nombre} onChange={campo("nombre")} required autoComplete="name" />
          </label>
          <label className={s.campo}>
            <span>Correo *</span>
            <input
              type="email"
              value={datos.email}
              onChange={campo("email")}
              required
              autoComplete="email"
            />
          </label>
          <label className={s.campo}>
            <span>Teléfono</span>
            <input
              type="tel"
              value={datos.telefono}
              onChange={campo("telefono")}
              autoComplete="tel"
            />
          </label>
          <label className={s.campo}>
            <span>¿Algo que debamos saber?</span>
            <textarea value={datos.notas} onChange={campo("notas")} rows={3} />
          </label>

          {error && <p className={s.formError}>{error}</p>}

          <button type="submit" className={s.btnPrimario} disabled={enviando || !listo}>
            {enviando ? "Registrando…" : "Registrar mi inscripción"}
          </button>
        </form>

        <aside className={s.resumen}>
          <h2>Tu selección</h2>
          <ul className={s.resumenItems}>
            {items.map((i) => (
              <li key={i.slug}>
                <span>{i.titulo}</span>
                <strong>{precioMxn(i.precioMxn)}</strong>
              </li>
            ))}
          </ul>
          <p className={s.resumenTotal}>
            <span>Total</span>
            <strong>{precioMxn(total)}</strong>
          </p>
        </aside>
      </div>
    </div>
  );
}
