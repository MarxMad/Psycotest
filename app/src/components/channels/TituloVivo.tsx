"use client";

import { useEffect, useRef } from "react";
import { animate, stagger, text } from "animejs";

/**
 * El titular de la portada, palabra por palabra.
 *
 * Se parte con `splitText`, que respeta el salto de línea y deja el texto
 * accesible: el lector de pantalla sigue leyendo la frase entera, no letras
 * sueltas. Si no hay JS o se pidió menos movimiento, se ve tal cual.
 */
export function TituloVivo({ texto, className }: { texto: string; className?: string }) {
  const titulo = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const nodo = titulo.current;
    if (!nodo) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const partido = text.split(nodo, { words: true, chars: false });
    animate(partido.words, {
      opacity: [0, 1],
      translateY: ["0.6em", 0],
      duration: 760,
      delay: stagger(55),
      ease: "out(3)",
    });

    return () => {
      partido.revert();
    };
  }, [texto]);

  return (
    <h1 ref={titulo} className={className}>
      {texto}
    </h1>
  );
}
