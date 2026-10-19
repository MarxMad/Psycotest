"use client";

import { useEffect, useRef } from "react";
import { animate } from "animejs";
import { menosMovimiento } from "@/lib/aparicion";
import s from "./CintaTemas.module.css";

/**
 * Cinta de temas en movimiento continuo.
 *
 * Dice de un vistazo el tamaño del catálogo sin obligar a leer veinte títulos.
 * La lista se imprime dos veces y se desplaza media vuelta: al terminar el
 * ciclo el segundo juego está exactamente donde empezó el primero, así que el
 * salto no se ve. Quien pidió menos movimiento la ve quieta, como una lista.
 */
export function CintaTemas({
  temas,
  etiqueta = "Temas",
}: {
  temas: string[];
  etiqueta?: string;
}) {
  const pista = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const nodo = pista.current;
    if (!nodo || menosMovimiento() || !temas.length) return;

    const animacion = animate(nodo, {
      translateX: ["0%", "-50%"],
      duration: Math.max(18000, temas.length * 2200),
      ease: "linear",
      loop: true,
    });

    // Se detiene al pasar el cursor: si algo interesa, se puede leer.
    const parar = () => animacion.pause();
    const seguir = () => animacion.play();
    nodo.addEventListener("pointerenter", parar);
    nodo.addEventListener("pointerleave", seguir);

    return () => {
      nodo.removeEventListener("pointerenter", parar);
      nodo.removeEventListener("pointerleave", seguir);
      animacion.revert();
    };
  }, [temas.length]);

  if (!temas.length) return null;

  return (
    <section className={s.cinta} aria-label={etiqueta}>
      <div className={s.pista} ref={pista}>
        {[0, 1].map((vuelta) => (
          <ul key={vuelta} className={s.lista} aria-hidden={vuelta === 1}>
            {temas.map((tema) => (
              <li key={tema}>
                <span className={s.punto} aria-hidden />
                {tema}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </section>
  );
}
