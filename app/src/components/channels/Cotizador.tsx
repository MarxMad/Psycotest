"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { animate } from "animejs";
import { ArrowRight, Check, Clock } from "lucide-react";
import {
  BATERIA_COMPLETA,
  PRUEBAS,
  cotizar,
  descuentoPorVolumen,
} from "@/lib/pruebas-catalogo";
import { whatsapp } from "@/lib/contacto";
import s from "./Cotizador.module.css";

const pesos = (centavos: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(centavos / 100);

function menosMovimiento() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Cotizador de evaluaciones.
 *
 * Quien llega buscando evaluar candidatos quiere saber dos cosas: qué pruebas
 * necesita y cuánto le cuesta. Antes las dos respuestas estaban detrás de una
 * llamada; aquí se arman en el momento y el precio se recalcula al tocar.
 */
export function Cotizador() {
  const [elegidas, setElegidas] = useState<string[]>(BATERIA_COMPLETA);
  const [candidatos, setCandidatos] = useState(5);
  const total = useRef<HTMLSpanElement>(null);
  const anterior = useRef<number | null>(null);

  const cuenta = useMemo(() => cotizar(elegidas, candidatos), [elegidas, candidatos]);
  const descuento = descuentoPorVolumen(candidatos);

  // El total cuenta hasta su nuevo valor en vez de saltar: se ve qué cambió.
  useEffect(() => {
    const nodo = total.current;
    if (!nodo) return;
    const desde = anterior.current;
    anterior.current = cuenta.total;

    if (desde === null || desde === cuenta.total || menosMovimiento()) {
      nodo.textContent = pesos(cuenta.total);
      return;
    }

    const objeto = { v: desde };
    const animacion = animate(objeto, {
      v: cuenta.total,
      duration: 480,
      ease: "out(3)",
      onUpdate: () => {
        nodo.textContent = pesos(Math.round(objeto.v));
      },
    });
    return () => {
      animacion.pause();
      nodo.textContent = pesos(cuenta.total);
    };
  }, [cuenta.total]);

  function alternar(id: string) {
    setElegidas((previas) =>
      previas.includes(id) ? previas.filter((x) => x !== id) : [...previas, id],
    );
  }

  const nada = elegidas.length === 0;
  const mensaje = nada
    ? "Hola, quiero cotizar evaluaciones de personal."
    : `Hola, quiero ${candidatos} ${candidatos === 1 ? "evaluación" : "evaluaciones"} con: ${PRUEBAS.filter(
        (p) => elegidas.includes(p.id),
      )
        .map((p) => p.nombre)
        .join(", ")}. Total estimado ${pesos(cuenta.total)}.`;

  return (
    <div className={s.caja} id="cotizador">
      <div className={s.panel}>
        <p className={s.titulo}>Arma tu evaluación</p>

        <fieldset className={s.grupo}>
          <legend className={s.leyenda}>
            Pruebas
            <button
              type="button"
              className={s.atajo}
              onClick={() =>
                setElegidas(elegidas.length === PRUEBAS.length ? [] : BATERIA_COMPLETA)
              }
            >
              {elegidas.length === PRUEBAS.length ? "Quitar todas" : "Batería completa"}
            </button>
          </legend>

          <div className={s.pruebas}>
            {PRUEBAS.map((p) => {
              const puesta = elegidas.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  className={s.prueba}
                  data-puesta={puesta}
                  aria-pressed={puesta}
                  onClick={() => alternar(p.id)}
                >
                  <span className={s.marca} aria-hidden>
                    {puesta && <Check size={13} strokeWidth={3} />}
                  </span>
                  <span className={s.pruebaTexto}>
                    <strong>{p.nombre}</strong>
                    <em>{p.etiqueta}</em>
                  </span>
                  <span className={s.pruebaPrecio}>{pesos(p.precio)}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className={s.grupo}>
          <legend className={s.leyenda}>
            Candidatos
            <span className={s.contador}>{candidatos}</span>
          </legend>
          <input
            className={s.rango}
            type="range"
            min={1}
            max={50}
            value={candidatos}
            onChange={(e) => setCandidatos(Number(e.target.value))}
            aria-label="Número de candidatos a evaluar"
          />
          <div className={s.tramos} aria-hidden>
            <span>1</span>
            <span>10</span>
            <span>25</span>
            <span>50</span>
          </div>
        </fieldset>
      </div>

      <aside className={s.resumen}>
        <p className={s.resumenEyebrow}>Tu cotización</p>

        <p className={s.totalLinea}>
          <span ref={total} className={s.total}>
            {pesos(cuenta.total)}
          </span>
          <span className={s.totalPie}>IVA no incluido</span>
        </p>

        {nada ? (
          <p className={s.vacio}>Elige al menos una prueba para ver el precio.</p>
        ) : (
          <ul className={s.desglose}>
            <li>
              <span>Por candidato</span>
              <strong>{pesos(cuenta.porCandidato)}</strong>
            </li>
            <li>
              <span>
                {candidatos} candidato{candidatos === 1 ? "" : "s"}
              </span>
              <strong>{pesos(cuenta.subtotal)}</strong>
            </li>
            {descuento > 0 && (
              <li className={s.ahorro}>
                <span>Descuento por volumen ({Math.round(descuento * 100)}%)</span>
                <strong>−{pesos(cuenta.descuento)}</strong>
              </li>
            )}
            <li className={s.tiempo}>
              <span>
                <Clock size={13} aria-hidden /> Tiempo por candidato
              </span>
              <strong>~{cuenta.minutos} min</strong>
            </li>
          </ul>
        )}

        <a
          className={s.comprar}
          href={whatsapp(mensaje)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Comprar estas evaluaciones
          <ArrowRight size={16} aria-hidden />
        </a>
        <p className={s.letraChica}>
          Te mandamos los códigos de acceso en cuanto se confirma el pago. El informe interpretado
          por un psicólogo llega en 72 horas.
        </p>
      </aside>
    </div>
  );
}
