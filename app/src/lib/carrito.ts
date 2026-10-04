"use client";

/**
 * Carrito de diplomados.
 *
 * Vive en el navegador: quien compra no necesita cuenta para armar su
 * selección, sólo para pagarla. Se guarda por si cierra la pestaña.
 */

import { useCallback, useEffect, useState } from "react";

const CLAVE = "ceduct_carrito";
const EVENTO = "ceduct:carrito";

export type ItemCarrito = {
  slug: string;
  titulo: string;
  precioMxn: number;
  imagen: string | null;
  horas: number;
};

function leer(): ItemCarrito[] {
  if (typeof window === "undefined") return [];
  try {
    const crudo = window.localStorage.getItem(CLAVE);
    const datos = crudo ? JSON.parse(crudo) : [];
    return Array.isArray(datos) ? datos : [];
  } catch {
    // Almacenamiento bloqueado o dato corrupto: se empieza de cero.
    return [];
  }
}

function guardar(items: ItemCarrito[]) {
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(items));
  } catch {
    // Sin almacenamiento el carrito sólo dura la sesión; no es motivo de error.
  }
  window.dispatchEvent(new CustomEvent(EVENTO));
}

export function useCarrito() {
  const [items, setItems] = useState<ItemCarrito[]>([]);
  const [listo, setListo] = useState(false);

  const sincronizar = useCallback(() => setItems(leer()), []);

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

  const vaciar = useCallback(() => guardar([]), []);

  const total = items.reduce((suma, x) => suma + x.precioMxn, 0);
  const incluye = useCallback((slug: string) => items.some((x) => x.slug === slug), [items]);

  return { items, total, listo, agregar, quitar, vaciar, incluye };
}
