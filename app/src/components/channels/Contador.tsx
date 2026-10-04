"use client";

import { Fragment, useEffect, useRef, useState, type HTMLAttributes } from "react";
import s from "./Contador.module.css";

/** Un valor que empieza por dígito se cuenta; cualquier otro se revela letra a letra. */
const CUENTA = /^(\d[\d.,]*)(.*)$/s;

const salida = (t: number) => 1 - (1 - t) ** 4;

function menosMovimiento() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Una cifra que se arma sola al entrar en pantalla: los números suben desde
 * cero y las palabras caen letra por letra.
 *
 * El texto final se renderiza en el servidor, así que el valor correcto está
 * en el HTML aunque el navegador nunca llegue a animarlo.
 */
export function Contador({
  valor,
  duracion = 1400,
  retraso = 0,
  className,
  ...resto
}: {
  valor: string;
  /** Milisegundos que tarda la cuenta. */
  duracion?: number;
  /** Espera antes de arrancar, para escalonar varias cifras. */
  retraso?: number;
} & HTMLAttributes<HTMLSpanElement>) {
  const raiz = useRef<HTMLSpanElement>(null);
  const digitos = useRef<HTMLSpanElement>(null);
  const [visto, setVisto] = useState(false);

  const partes = valor.match(CUENTA);
  const meta = partes ? Number(partes[1].replace(/[.,]/g, "")) : null;
  const miles = partes ? /[.,]/.test(partes[1]) : false;
  const cola = partes ? partes[2] : "";

  useEffect(() => {
    const nodo = raiz.current;
    if (!nodo) return;
    if (!("IntersectionObserver" in window)) {
      setVisto(true);
      return;
    }
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting) return;
        setVisto(true);
        observador.disconnect();
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    observador.observe(nodo);
    return () => observador.disconnect();
  }, []);

  // El valor final ya está pintado: se pone a cero en cuanto sabemos que sí habrá cuenta.
  useEffect(() => {
    if (meta === null || menosMovimiento()) return;
    const nodo = digitos.current;
    if (nodo) nodo.textContent = "0";
  }, [meta]);

  useEffect(() => {
    if (!visto || meta === null) return;
    const nodo = digitos.current;
    if (!nodo) return;

    const escribir = (v: number) => {
      nodo.textContent = miles ? v.toLocaleString("es-MX") : String(v);
    };

    if (menosMovimiento()) {
      escribir(meta);
      return;
    }

    let cuadro = 0;
    let inicio = 0;
    const paso = (t: number) => {
      if (!inicio) inicio = t;
      const avance = Math.min(1, (t - inicio) / duracion);
      escribir(Math.round(meta * salida(avance)));
      if (avance < 1) cuadro = requestAnimationFrame(paso);
    };

    const espera = window.setTimeout(() => {
      cuadro = requestAnimationFrame(paso);
    }, retraso);

    return () => {
      window.clearTimeout(espera);
      cancelAnimationFrame(cuadro);
    };
  }, [visto, meta, miles, duracion, retraso]);

  if (meta !== null) {
    return (
      <span
        {...resto}
        ref={raiz}
        className={`${s.valor} ${className ?? ""}`}
        aria-label={valor}
      >
        <span ref={digitos} aria-hidden>
          {partes![1]}
        </span>
        {cola && <span aria-hidden>{cola}</span>}
      </span>
    );
  }

  // Se parte por palabras para que un valor largo salte de línea donde debe,
  // y no en medio de "002-10".
  let letra = -1;
  return (
    <span
      {...resto}
      ref={raiz}
      className={`${s.valor} ${s.letras} ${visto ? s.listo : ""} ${className ?? ""}`}
      aria-label={valor}
      style={{ "--r": `${retraso}ms`, ...resto.style } as React.CSSProperties}
    >
      {valor.split(" ").map((palabra, p, todas) => (
        // El valor es fijo: la posición basta como clave.
        <Fragment key={p}>
          <span className={s.palabra} aria-hidden>
            {Array.from(palabra).map((c, i) => {
              letra += 1;
              return (
                <span
                  key={i}
                  className={s.letra}
                  style={{ ["--i"]: letra } as React.CSSProperties}
                >
                  {c}
                </span>
              );
            })}
          </span>
          {/* Un espacio de verdad: así el valor se copia y se lee entero. */}
          {p < todas.length - 1 && (
            <span className={s.espacio} aria-hidden>
              {" "}
            </span>
          )}
        </Fragment>
      ))}
    </span>
  );
}
