"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import s from "./mk.module.css";

/**
 * Aparición suave al entrar en pantalla.
 *
 * El HTML del servidor sale visible: sólo se oculta en el navegador lo que
 * aún no está a la vista, así que sin JavaScript (o con «menos movimiento»)
 * todo se lee igual.
 */
export function Revelar({
  children,
  retraso = 0,
  como: Etiqueta = "div",
  className,
}: {
  children: ReactNode;
  retraso?: number;
  como?: ElementType;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [estado, setEstado] = useState<"inicial" | "oculto" | "visible">("inicial");

  useEffect(() => {
    const nodo = ref.current;
    if (!nodo) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const caja = nodo.getBoundingClientRect();
    if (caja.top < window.innerHeight * 0.92) return; // ya está a la vista

    setEstado("oculto");
    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setEstado("visible");
        obs.disconnect();
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    obs.observe(nodo);
    return () => obs.disconnect();
  }, []);

  return (
    <Etiqueta
      ref={ref}
      className={`${s.revelar} ${className ?? ""}`}
      data-estado={estado}
      style={{ "--retraso": `${retraso}ms` } as React.CSSProperties}
    >
      {children}
    </Etiqueta>
  );
}
