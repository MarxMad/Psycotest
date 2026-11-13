"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { animate } from "animejs";
import { ArrowRight, Check, Clock, Lock } from "lucide-react";
import {
  BATERIA_COMPLETA,
  MAX_CANDIDATOS_EN_LINEA,
  PRUEBAS,
  TASA_IVA,
  cotizarEnLinea,
  descuentoPorVolumen,
} from "@/lib/pruebas-catalogo";
import { whatsapp } from "@/lib/contacto";
import { menosMovimiento } from "@/lib/aparicion";
import s from "./Cotizador.module.css";

// Con centavos solo cuando los hay: el total con IVA tiene que coincidir con
// lo que cobra Stripe, no redondeado.
const pesos = (centavos: number) => {
  const decimales = centavos % 100 === 0 ? 0 : 2;
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(centavos / 100);
};

/**
 * Cotizador de evaluaciones.
 *
 * Quien llega buscando evaluar candidatos quiere saber dos cosas: qué pruebas
 * necesita y cuánto le cuesta. Antes las dos respuestas estaban detrás de una
 * llamada; aquí se arman en el momento y el precio se recalcula al tocar.
 */
/**
 * `persona`: alguien que quiere evaluarse a sí mismo. Es una sola evaluación,
 * así que desaparece el control de candidatos y cambia el lenguaje.
 */
export function Cotizador({
  modo = "empresa",
}: {
  modo?: "empresa" | "persona";
}) {
  const personal = modo === "persona";
  const [elegidas, setElegidas] = useState<string[]>(BATERIA_COMPLETA);
  const bateriaPuesta = BATERIA_COMPLETA.every((id) => elegidas.includes(id));
  const [cuantos, setCandidatos] = useState(5);
  const candidatos = personal ? 1 : cuantos;
  const total = useRef<HTMLSpanElement>(null);
  const anterior = useRef<number | null>(null);

  // Lo que se paga en línea, ya con IVA. Lo que no está digitalizado
  // (Estilos Gerenciales, socioeconómico) va en `aparte` y se coordina.
  const cuenta = useMemo(
    () => cotizarEnLinea(elegidas, candidatos),
    [elegidas, candidatos],
  );
  const [pagando, setPagando] = useState(false);
  const [datos, setDatos] = useState({ nombre: "", email: "", empresa: "" });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sePuedePagar = cuenta.ids.length > 0 && cuenta.totalConIva > 0;

  async function pagar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (datos.nombre.trim().length < 3) return setError("Escribe tu nombre completo.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email.trim()))
      return setError("Revisa tu correo: ahí te llegan los códigos.");
    setEnviando(true);
    try {
      const r = await fetch("/api/psicologia/compra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pruebas: cuenta.ids,
          candidatos,
          modo,
          nombre: datos.nombre.trim(),
          email: datos.email.trim(),
          empresa: datos.empresa.trim(),
        }),
      });
      const d = (await r.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!r.ok || !d.url) throw new Error(d.error ?? "No se pudo abrir el pago. Intenta de nuevo.");
      window.location.href = d.url;
    } catch (err) {
      setError((err as Error).message);
      setEnviando(false);
    }
  }
  const descuento = descuentoPorVolumen(candidatos);

  // El total cuenta hasta su nuevo valor en vez de saltar: se ve qué cambió.
  useEffect(() => {
    const nodo = total.current;
    if (!nodo) return;
    const desde = anterior.current;
    anterior.current = cuenta.totalConIva;

    if (desde === null || desde === cuenta.totalConIva || menosMovimiento()) {
      nodo.textContent = pesos(cuenta.totalConIva);
      return;
    }

    // Un pulso corto además del conteo: el ojo encuentra qué cambió.
    animate(nodo, { scale: [1.05, 1], duration: 420, ease: "out(3)" });

    const objeto = { v: desde };
    const animacion = animate(objeto, {
      v: cuenta.totalConIva,
      duration: 480,
      ease: "out(3)",
      onUpdate: () => {
        nodo.textContent = pesos(Math.round(objeto.v));
      },
    });
    return () => {
      animacion.pause();
      nodo.textContent = pesos(cuenta.totalConIva);
    };
  }, [cuenta.totalConIva]);

  function alternar(id: string, casilla?: HTMLElement | null) {
    setElegidas((previas) =>
      previas.includes(id) ? previas.filter((x) => x !== id) : [...previas, id],
    );

    // La casilla rebota al tocarla: confirma el toque antes de que el precio
    // termine de contar.
    if (!casilla || menosMovimiento()) return;
    animate(casilla, { scale: [1, 1.3, 1], duration: 420, ease: "out(3)" });
  }

  const nada = elegidas.length === 0;
  const mensaje = nada
    ? personal
      ? "Hola, quiero hacer una evaluación psicológica para mí."
      : "Hola, quiero cotizar evaluaciones de personal."
    : `Hola, ${
        personal
          ? "quiero evaluarme"
          : `quiero ${candidatos} ${candidatos === 1 ? "evaluación" : "evaluaciones"}`
      } con: ${PRUEBAS.filter((p) => elegidas.includes(p.id))
        .map((p) => p.nombre)
        .join(", ")}. Total estimado ${pesos(cuenta.totalConIva)} con IVA${
        cuenta.aparte.length
          ? `, más ${cuenta.aparte.map((p) => p.nombre).join(", ")} por cotizar`
          : ""
      }.`;

  return (
    <div className={s.caja} id="cotizador">
      <div className={s.panel}>
        <p className={s.titulo}>
          {personal ? "Arma tu evaluación personal" : "Arma tu evaluación"}
        </p>

        <fieldset className={s.grupo}>
          <legend className={s.leyenda}>
            Pruebas
            <button
              type="button"
              className={s.atajo}
              onClick={() => setElegidas(bateriaPuesta ? [] : BATERIA_COMPLETA)}
            >
              {bateriaPuesta ? "Quitar todas" : "Batería completa"}
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
                  onClick={(e) =>
                    alternar(
                      p.id,
                      e.currentTarget.querySelector<HTMLElement>(
                        "[data-marca]",
                      ),
                    )
                  }
                >
                  <span className={s.marca} data-marca aria-hidden>
                    {puesta && <Check size={13} strokeWidth={3} />}
                  </span>
                  <span className={s.pruebaTexto}>
                    <strong>{p.nombre}</strong>
                    <em>{p.etiqueta}</em>
                  </span>
                  <span className={s.pruebaPrecio}>
                    {p.precio == null ? "Por cotizar" : pesos(p.precio)}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {!personal && (
          <fieldset className={s.grupo}>
            <legend className={s.leyenda}>
              Candidatos
              <span className={s.contador}>{candidatos}</span>
            </legend>
            <input
              className={s.rango}
              type="range"
              min={1}
              max={MAX_CANDIDATOS_EN_LINEA}
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
        )}
      </div>

      <aside className={s.resumen}>
        <p className={s.resumenEyebrow}>Tu cotización</p>

        <p className={s.totalLinea}>
          {!sePuedePagar && cuenta.aparte.length ? (
            <span className={s.total}>Por cotizar</span>
          ) : (
            <span ref={total} className={s.total}>
              {pesos(cuenta.totalConIva)}
            </span>
          )}
          <span className={s.totalPie}>
            {cuenta.aparte.length
              ? "IVA incluido · más lo que se cotiza aparte"
              : "IVA incluido"}
          </span>
        </p>

        {nada ? (
          <p className={s.vacio}>
            Elige al menos una prueba para ver el precio.
          </p>
        ) : (
          <ul className={s.desglose}>
            {!personal && (
              <>
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
              </>
            )}
            {descuento > 0 && (
              <li className={s.ahorro}>
                <span>
                  Descuento por volumen ({Math.round(descuento * 100)}%)
                </span>
                <strong>−{pesos(cuenta.descuento)}</strong>
              </li>
            )}
            {sePuedePagar && (
              <li>
                <span>IVA ({Math.round(TASA_IVA * 100)}%)</span>
                <strong>{pesos(cuenta.iva)}</strong>
              </li>
            )}
            {cuenta.aparte.map((p) => (
              <li key={p.id}>
                <span>{p.nombre}</span>
                <strong>Se cotiza aparte</strong>
              </li>
            ))}
            <li className={s.tiempo}>
              <span>
                <Clock size={13} aria-hidden />{" "}
                {personal ? "Tiempo para responder" : "Tiempo por candidato"}
              </span>
              <strong>~{cuenta.minutos} min</strong>
            </li>
          </ul>
        )}

        {sePuedePagar && !pagando && (
          <button type="button" className={s.comprar} onClick={() => setPagando(true)}>
            {personal ? "Pagar mi evaluación" : "Pagar en línea"}
            <ArrowRight size={16} aria-hidden />
          </button>
        )}

        {sePuedePagar && pagando && (
          <form className={s.pago} onSubmit={pagar} noValidate>
            <label className={s.campo}>
              <span>Nombre completo</span>
              <input
                value={datos.nombre}
                onChange={(e) => setDatos((d) => ({ ...d, nombre: e.target.value }))}
                autoComplete="name"
                required
                autoFocus
              />
            </label>
            <label className={s.campo}>
              <span>Correo (ahí llegan {personal ? "tu código" : "los códigos"})</span>
              <input
                type="email"
                inputMode="email"
                value={datos.email}
                onChange={(e) => setDatos((d) => ({ ...d, email: e.target.value }))}
                autoComplete="email"
                required
              />
            </label>
            {!personal && (
              <label className={s.campo}>
                <span>Empresa (opcional)</span>
                <input
                  value={datos.empresa}
                  onChange={(e) => setDatos((d) => ({ ...d, empresa: e.target.value }))}
                  autoComplete="organization"
                />
              </label>
            )}
            {error && (
              <p className={s.error} role="alert">
                {error}
              </p>
            )}
            <button type="submit" className={s.comprar} disabled={enviando}>
              {enviando ? "Abriendo el pago…" : `Pagar ${pesos(cuenta.totalConIva)}`}
              {!enviando && <ArrowRight size={16} aria-hidden />}
            </button>
            <p className={s.seguro}>
              <Lock size={12} aria-hidden /> Pago seguro con Stripe: tarjeta, OXXO o transferencia SPEI.
            </p>
          </form>
        )}

        <a
          className={sePuedePagar ? s.contactar : s.comprar}
          href={whatsapp(mensaje)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {sePuedePagar
            ? cuenta.aparte.length
              ? `Cotizar ${cuenta.aparte.map((p) => p.nombre).join(" y ")} por WhatsApp`
              : "¿Dudas? Escríbenos por WhatsApp"
            : personal
              ? "Quiero evaluarme"
              : "Cotizar por WhatsApp"}
          {!sePuedePagar && <ArrowRight size={16} aria-hidden />}
        </a>
        <p className={s.letraChica}>
          {personal
            ? "Te mandamos tu código en cuanto se confirma el pago; respondes desde donde estés. Tu informe, interpretado por un psicólogo, llega en 72 horas y solo lo ves tú."
            : "Te mandamos los códigos de acceso en cuanto se confirma el pago. El informe interpretado por un psicólogo llega en 72 horas."}
        </p>
      </aside>
    </div>
  );
}
