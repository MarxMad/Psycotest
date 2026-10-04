"use client";

import { useEffect, useRef, type RefObject } from "react";
import { animate, stagger } from "animejs";

/** Quien pidió menos movimiento ve la página quieta: nada se oculta ni se anima. */
export function menosMovimiento() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

type Opciones = {
  /** Desplazamiento inicial en píxeles. */
  y?: number;
  retraso?: number;
  duracion?: number;
  /** Entra al montar en vez de esperar a que el scroll lo alcance (portada). */
  inmediato?: boolean;
};

/**
 * Aparición de un bloque, movida por anime.js.
 *
 * El nodo se oculta desde el efecto y no desde el marcado: así, sin JS o con
 * el motor de animación caído, la página se ve entera igual. Es la misma
 * razón por la que el observador se desconecta en cuanto dispara —una sola
 * entrada por bloque, nada que recalcular en cada scroll.
 */
export function useAparicion<T extends HTMLElement>(
  opciones: Opciones = {},
): RefObject<T | null> {
  const ref = useRef<T>(null);
  const { y = 22, retraso = 0, duracion = 680, inmediato = false } = opciones;

  useEffect(() => {
    const nodo = ref.current;
    if (!nodo || menosMovimiento()) return;

    const entrar = () =>
      animate(nodo, {
        opacity: [0, 1],
        translateY: [y, 0],
        duration: duracion,
        delay: retraso,
        ease: "out(3)",
      });

    if (inmediato || !("IntersectionObserver" in window)) {
      nodo.style.opacity = "0";
      entrar();
      return;
    }

    nodo.style.opacity = "0";
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting) return;
        observador.disconnect();
        entrar();
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observador.observe(nodo);
    return () => observador.disconnect();
  }, [y, retraso, duracion, inmediato]);

  return ref;
}

/**
 * Lo mismo, pero para una lista: los hijos entran escalonados.
 *
 * Se escalona el contenedor y no cada tarjeta por separado porque lo que se
 * lee es la fila completa; que entren en orden cuenta de dónde a dónde va.
 */
export function useAparicionLista<T extends HTMLElement>(opciones: {
  selector?: string;
  y?: number;
  separacion?: number;
  retraso?: number;
  inmediato?: boolean;
} = {}): RefObject<T | null> {
  const ref = useRef<T>(null);
  const { selector, y = 20, separacion = 90, retraso = 0, inmediato = false } = opciones;

  useEffect(() => {
    const nodo = ref.current;
    if (!nodo || menosMovimiento()) return;

    const hijos = selector
      ? Array.from(nodo.querySelectorAll<HTMLElement>(selector))
      : (Array.from(nodo.children) as HTMLElement[]);
    if (!hijos.length) return;

    const entrar = () => {
      animate(hijos, {
        opacity: [0, 1],
        translateY: [y, 0],
        duration: 640,
        delay: stagger(separacion, { start: retraso }),
        ease: "out(3)",
      });
    };

    hijos.forEach((h) => {
      h.style.opacity = "0";
    });

    if (inmediato || !("IntersectionObserver" in window)) {
      entrar();
      return;
    }

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting) return;
        observador.disconnect();
        entrar();
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    observador.observe(nodo);
    return () => observador.disconnect();
  }, [selector, y, separacion, retraso, inmediato]);

  return ref;
}
