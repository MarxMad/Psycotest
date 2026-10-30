"use client";

import { useEffect } from "react";
import s from "../mk.module.css";

/**
 * Una luz que sigue al cursor dentro de cada tarjeta. Un solo oyente para
 * toda la página: sólo escribe la posición en la tarjeta que está debajo, y
 * el CSS se encarga del resto. En pantallas táctiles no hace nada.
 */
export function Luz() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover)").matches) return;
    const selector = `.${s.tarjetaInteractiva}`;
    const mover = (e: PointerEvent) => {
      const tarjeta = (e.target as Element | null)?.closest<HTMLElement>(selector);
      if (!tarjeta) return;
      const r = tarjeta.getBoundingClientRect();
      tarjeta.style.setProperty("--mx", `${e.clientX - r.left}px`);
      tarjeta.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    document.addEventListener("pointermove", mover, { passive: true });
    return () => document.removeEventListener("pointermove", mover);
  }, []);
  return null;
}
