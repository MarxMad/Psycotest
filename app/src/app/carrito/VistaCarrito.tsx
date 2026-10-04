"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useCarrito } from "@/lib/carrito";
import { precioMxn } from "@/lib/diplomados-formato";
import s from "../diplomados/ceduct.module.css";

export function VistaCarrito() {
  const { items, total, listo, quitar } = useCarrito();

  if (!listo) {
    return (
      <div className={s.detalle}>
        <p className={s.vacio}>Cargando…</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={s.detalle}>
        <h1 className={s.detalleTitulo}>Tu carrito está vacío</h1>
        <p className={s.parrafo}>
          Elige un diplomado del catálogo y aparecerá aquí para que lo inscribas.
        </p>
        <Link href="/diplomados" className={s.btnPrimario}>
          Ver diplomados
        </Link>
      </div>
    );
  }

  return (
    <div className={s.detalle}>
      <h1 className={s.detalleTitulo}>Tu carrito</h1>

      <div className={s.carritoRejilla}>
        <ul className={s.carritoLista}>
          {items.map((it) => (
            <li key={it.slug} className={s.carritoItem}>
              {it.imagen ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.imagen} alt="" className={s.carritoImagen} />
              ) : (
                <span className={s.carritoImagen} aria-hidden />
              )}
              <div className={s.carritoTexto}>
                <h2>
                  <Link href={`/diplomados/${it.slug}`}>{it.titulo}</Link>
                </h2>
                <p>{it.horas} horas</p>
              </div>
              <span className={s.carritoPrecio}>{precioMxn(it.precioMxn)}</span>
              <button
                type="button"
                className={s.carritoQuitar}
                onClick={() => quitar(it.slug)}
                aria-label={`Quitar ${it.titulo}`}
              >
                <Trash2 size={16} aria-hidden />
              </button>
            </li>
          ))}
        </ul>

        <aside className={s.resumen}>
          <h2>Resumen</h2>
          <dl className={s.resumenLista}>
            <div>
              <dt>
                {items.length} diplomado{items.length === 1 ? "" : "s"}
              </dt>
              <dd>{precioMxn(total)}</dd>
            </div>
          </dl>
          <p className={s.resumenTotal}>
            <span>Total</span>
            <strong>{precioMxn(total)}</strong>
          </p>
          <Link href="/checkout" className={s.btnPrimario}>
            Continuar con la inscripción
          </Link>
          <Link href="/diplomados" className={s.enlaceInterno}>
            Seguir viendo diplomados
          </Link>
        </aside>
      </div>
    </div>
  );
}
