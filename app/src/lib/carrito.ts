"use client";

/**
 * Carrito de diplomados y certificaciones.
 *
 * Vive en el navegador: quien compra no necesita cuenta para armar su
 * selección, sólo para pagarla. Se guarda en localStorage por si cierra la
 * pestaña, y se sincroniza entre pestañas y entre componentes (el contador
 * del navbar se entera al instante).
 *
 * El cupón también se recuerda, pero sólo como texto: su validez y el
 * descuento real los decide el servidor al crear el pedido.
 */

import { useCallback, useEffect, useState } from "react";

const CLAVE = "ceduct_carrito";
const CLAVE_CUPON = "ceduct_cupon";
const EVENTO = "ceduct:carrito";

export type ItemCarrito = {
  slug: string;
  titulo: string;
  /** Centavos MXN, IVA incluido. */
  precioMxn: number;
  imagen: string | null;
  horas: number;
  tipo?: "diplomado" | "certificacion";
  categoria?: string;
  modalidad?: "online" | "presencial" | "mixta";
  /** Programa del catálogo de ejemplo: no se puede cobrar. */
  demo?: boolean;
};

export type CuponAplicado = {
  code: string;
  type: "percentage" | "fixed";
  /** Porcentaje (10 = 10%) o centavos, según `type`. */
  value: number;
};

function leer(): ItemCarrito[] {
  if (typeof window === "undefined") return [];
  try {
    const crudo = window.localStorage.getItem(CLAVE);
    const datos = crudo ? JSON.parse(crudo) : [];
    return Array.isArray(datos)
      ? datos.filter((x) => x && typeof x.slug === "string" && typeof x.precioMxn === "number")
      : [];
  } catch {
    // Almacenamiento bloqueado o dato corrupto: se empieza de cero.
    return [];
  }
}

function leerCupon(): CuponAplicado | null {
  if (typeof window === "undefined") return null;
  try {
    const crudo = window.localStorage.getItem(CLAVE_CUPON);
    const c = crudo ? JSON.parse(crudo) : null;
    return c && typeof c.code === "string" ? c : null;
  } catch {
    return null;
  }
}

function avisar() {
  window.dispatchEvent(new CustomEvent(EVENTO));
}

function guardar(items: ItemCarrito[]) {
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(items));
  } catch {
    // Sin almacenamiento el carrito sólo dura la sesión; no es motivo de error.
  }
  avisar();
}

function guardarCupon(cupon: CuponAplicado | null) {
  try {
    if (cupon) window.localStorage.setItem(CLAVE_CUPON, JSON.stringify(cupon));
    else window.localStorage.removeItem(CLAVE_CUPON);
  } catch {
    /* igual que arriba */
  }
  avisar();
}

export function useCarrito() {
  const [items, setItems] = useState<ItemCarrito[]>([]);
  const [cupon, setCupon] = useState<CuponAplicado | null>(null);
  const [listo, setListo] = useState(false);

  const sincronizar = useCallback(() => {
    setItems(leer());
    setCupon(leerCupon());
  }, []);

  useEffect(() => {
    sincronizar();
    setListo(true);
    window.addEventListener(EVENTO, sincronizar);
    // Otra pestaña puede cambiarlo
    window.addEventListener("storage", sincronizar);
    return () => {
      window.removeEventListener(EVENTO, sincronizar);
      window.removeEventListener("storage", sincronizar);
    };
  }, [sincronizar]);

  const agregar = useCallback((item: ItemCarrito) => {
    const actual = leer();
    if (actual.some((x) => x.slug === item.slug)) return false;
    guardar([...actual, item]);
    return true;
  }, []);

  const quitar = useCallback((slug: string) => {
    guardar(leer().filter((x) => x.slug !== slug));
  }, []);

  const vaciar = useCallback(() => {
    guardar([]);
    guardarCupon(null);
  }, []);

  const aplicarCupon = useCallback((c: CuponAplicado | null) => guardarCupon(c), []);

  const total = items.reduce((suma, x) => suma + x.precioMxn, 0);
  const incluye = useCallback((slug: string) => items.some((x) => x.slug === slug), [items]);

  return { items, total, listo, agregar, quitar, vaciar, incluye, cupon, aplicarCupon };
}
