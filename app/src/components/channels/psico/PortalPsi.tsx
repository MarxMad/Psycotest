"use client";

import { useEffect, useRef } from "react";
import { menosMovimiento } from "@/lib/aparicion";
import s from "./portal-psi.module.css";

/**
 * Transición de firma: la Ψ crece con el scroll como una ventana y, a
 * través de ella, aparece la siguiente idea. Sustituye al papel rasgado de
 * la referencia por algo que solo esta marca puede tener.
 */
export function PortalPsi({ lineas }: { lineas: React.ReactNode[] }) {
  const zona = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = zona.current;
    if (!el) return;
    if (menosMovimiento()) {
      el.style.setProperty("--p", "1");
      return;
    }
    let cuadro = 0;
    const leer = () => {
      cuadro = 0;
      const r = el.getBoundingClientRect();
      const recorrido = el.offsetHeight - window.innerHeight;
      const p = Math.min(1, Math.max(0, -r.top / recorrido));
      el.style.setProperty("--p", p.toFixed(4));
    };
    const alBajar = () => {
      if (!cuadro) cuadro = requestAnimationFrame(leer);
    };
    leer();
    window.addEventListener("scroll", alBajar, { passive: true });
    window.addEventListener("resize", alBajar);
    return () => {
      window.removeEventListener("scroll", alBajar);
      window.removeEventListener("resize", alBajar);
      cancelAnimationFrame(cuadro);
    };
  }, []);

  return (
    <section ref={zona} className={s.portal} data-tono="oscuro" aria-label="Nuestro enfoque">
      <div className={s.fijo}>
        <p className={s.pista} aria-hidden>
          Lo que hay dentro
        </p>
        <div className={s.ventana}>
          <p className={s.frase}>
            {lineas.map((l, i) => (
              <span key={i} className={s.linea} style={{ ["--i" as string]: i, ["--n" as string]: lineas.length }}>
                {l}
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}
