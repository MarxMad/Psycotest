"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { animate } from "animejs";

/** Aparición al entrar en pantalla. Respeta quien pidió menos movimiento. */
export function Revelar({ children, retraso = 0 }: { children: ReactNode; retraso?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const nodo = ref.current;
    if (!nodo) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      nodo.style.opacity = "1";
      return;
    }

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting) return;
        animate(nodo, {
          opacity: [0, 1],
          translateY: [22, 0],
          duration: 620,
          delay: retraso,
          ease: "out(3)",
        });
        observador.disconnect();
      },
      { rootMargin: "-8% 0px" },
    );

    observador.observe(nodo);
    return () => observador.disconnect();
  }, [retraso]);

  return (
    <div ref={ref} style={{ opacity: 0 }}>
      {children}
    </div>
  );
}
