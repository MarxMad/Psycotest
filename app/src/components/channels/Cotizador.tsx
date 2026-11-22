"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { animate } from "animejs";
import { ArrowRight, Check, Clock, Lock, Minus, Plus } from "lucide-react";
import {
  BATERIA_COMPLETA,
  HORAS_ENTREGA,
  HORAS_PARA_CONTESTAR,
  MAX_POR_PRUEBA,
  PRUEBAS,
  TRAMOS,
  conIva,
  cantidadValida,
  cotizarPorPrueba,
  type Cantidades,
} from "@/lib/pruebas-catalogo";
import { whatsapp } from "@/lib/contacto";
import { menosMovimiento } from "@/lib/aparicion";
import s from "./Cotizador.module.css";

// Con centavos solo cuando los hay: el total tiene que coincidir con lo que
// cobra Stripe, no redondeado.
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
  // Cuántos códigos de cada prueba. Cada código abre una sola prueba para
  // una persona. En una evaluación personal es 0 o 1.
  const [cantidades, setCantidades] = useState<Cantidades>(() =>
    Object.fromEntries(BATERIA_COMPLETA.map((id) => [id, 1])),
  );
  const bateriaPuesta = BATERIA_COMPLETA.every((id) => (cantidades[id] ?? 0) > 0);
  const total = useRef<HTMLSpanElement>(null);
  const anterior = useRef<number | null>(null);

  // Lo que se paga en línea, precio final. Lo que no está digitalizado
  // (Estilos Gerenciales, socioeconómico) va en `aparte` y se coordina.
  const cuenta = useMemo(() => cotizarPorPrueba(cantidades), [cantidades]);
  const minutos = PRUEBAS.reduce((n, p) => n + ((cantidades[p.id] ?? 0) > 0 ? p.minutos : 0), 0);
  const [pagando, setPagando] = useState(false);
  const [datos, setDatos] = useState({ nombre: "", email: "", empresa: "" });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sePuedePagar = cuenta.renglones.length > 0 && cuenta.total > 0;

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
          cantidades: Object.fromEntries(cuenta.renglones.map((r) => [r.prueba.id, r.cantidad])),
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

    // Un pulso corto además del conteo: el ojo encuentra qué cambió.
    animate(nodo, { scale: [1.05, 1], duration: 420, ease: "out(3)" });

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

  function fijar(id: string, valor: number, nodo?: HTMLElement | null) {
    const tope = personal ? 1 : MAX_POR_PRUEBA;
    const v = Math.min(tope, cantidadValida(valor));
    setCantidades((previas) => ({ ...previas, [id]: v }));
    // El número rebota al cambiar: confirma el toque antes de que el precio
    // termine de contar.
    if (!nodo || menosMovimiento()) return;
    animate(nodo, { scale: [1, 1.25, 1], duration: 380, ease: "out(3)" });
  }

  function alternarBateria() {
    setCantidades((previas) =>
      bateriaPuesta
        ? {}
        : {
            ...previas,
            ...Object.fromEntries(BATERIA_COMPLETA.map((id) => [id, Math.max(1, previas[id] ?? 0)])),
          },
    );
  }

  const elegidas = PRUEBAS.filter((p) => (cantidades[p.id] ?? 0) > 0);
  const nada = elegidas.length === 0;
  const mensaje = nada
    ? personal
      ? "Hola, quiero hacer una evaluación psicológica para mí."
      : "Hola, quiero cotizar evaluaciones de personal."
    : `Hola, ${personal ? "quiero evaluarme con" : "quiero"}: ${elegidas
        .map((p) => (personal ? p.nombre : `${cantidades[p.id]} × ${p.nombre}`))
        .join(", ")}. Total estimado ${pesos(cuenta.total)}${
        cuenta.aparte.length
          ? `, más ${cuenta.aparte.map((a) => a.prueba.nombre).join(", ")} por cotizar`
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
              onClick={alternarBateria}
            >
              {bateriaPuesta ? "Quitar todas" : personal ? "Batería completa" : "Una de cada"}
            </button>
          </legend>

          <p className={s.notaPrecios}>
            {personal
              ? "Precio final por prueba."
              : `Elige cuántas aplicaciones de cada prueba necesitas: cada una es un código. Precio final por código; desde ${TRAMOS[2].desde} códigos de una misma prueba hay descuento.`}
          </p>

          <div className={s.pruebas}>
            {PRUEBAS.map((p) => {
              const n = cantidades[p.id] ?? 0;
              const puesta = n > 0;
              const precio = p.precio == null ? "Por cotizar" : pesos(conIva(p.precio));
              if (personal) {
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={s.prueba}
                    data-puesta={puesta}
                    aria-pressed={puesta}
                    onClick={(e) =>
                      fijar(p.id, puesta ? 0 : 1, e.currentTarget.querySelector<HTMLElement>("[data-marca]"))
                    }
                  >
                    <span className={s.marca} data-marca aria-hidden>
                      {puesta && <Check size={13} strokeWidth={3} />}
                    </span>
                    <span className={s.pruebaTexto}>
                      <strong>{p.nombre}</strong>
                      <em>{p.etiqueta}</em>
                    </span>
                    <span className={s.pruebaPrecio}>{precio}</span>
                  </button>
                );
              }
              return (
                <div key={p.id} className={`${s.prueba} ${s.pruebaCantidad}`} data-puesta={puesta}>
                  <span className={s.pruebaTexto}>
                    <strong>{p.nombre}</strong>
                    <em>
                      {p.etiqueta} · {precio}
                      {p.precio != null ? " c/u" : ""}
                    </em>
                  </span>
                  <span className={s.selector} role="group" aria-label={`Cantidad de ${p.nombre}`}>
                    <button
                      type="button"
                      className={s.paso}
                      onClick={(e) =>
                        fijar(p.id, n - 1, e.currentTarget.parentElement?.querySelector<HTMLElement>("input"))
                      }
                      disabled={n === 0}
                      aria-label={`Una menos de ${p.nombre}`}
                    >
                      <Minus size={14} strokeWidth={2.6} />
                    </button>
                    <input
                      className={s.cantidad}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={MAX_POR_PRUEBA}
                      value={n}
                      onChange={(e) => fijar(p.id, Number(e.target.value))}
                      onFocus={(e) => e.currentTarget.select()}
                      aria-label={`Códigos de ${p.nombre}`}
                    />
                    <button
                      type="button"
                      className={s.paso}
                      onClick={(e) =>
                        fijar(p.id, n + 1, e.currentTarget.parentElement?.querySelector<HTMLElement>("input"))
                      }
                      disabled={n >= MAX_POR_PRUEBA}
                      aria-label={`Una más de ${p.nombre}`}
                    >
                      <Plus size={14} strokeWidth={2.6} />
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        </fieldset>
      </div>

      <aside className={s.resumen}>
        <p className={s.resumenEyebrow}>Tu cotización</p>

        <p className={s.totalLinea}>
          {!sePuedePagar && cuenta.aparte.length ? (
            <span className={s.total}>Por cotizar</span>
          ) : (
            <span ref={total} className={s.total}>
              {pesos(cuenta.total)}
            </span>
          )}
          <span className={s.totalPie}>
            {cuenta.aparte.length
              ? "Precio final · más lo que se cotiza aparte"
              : personal
                ? "Precio final"
                : `Precio final · ${cuenta.codigos} código${cuenta.codigos === 1 ? "" : "s"}`}
          </span>
        </p>

        {nada ? (
          <p className={s.vacio}>
            Elige al menos una prueba para ver el precio.
          </p>
        ) : (
          <ul className={s.desglose}>
            {cuenta.renglones.map((r) => (
              <li key={r.prueba.id}>
                <span>
                  {personal ? r.prueba.nombre : `${r.cantidad} × ${r.prueba.nombre}`}
                  {r.descuento > 0 && (
                    <em className={s.ahorroNota}>
                      {" "}
                      · {Math.round((1 - r.unitario / r.lista) * 100)}% menos
                    </em>
                  )}
                </span>
                <strong>{pesos(r.importe)}</strong>
              </li>
            ))}
            {cuenta.descuento > 0 && (
              <li className={s.ahorro}>
                <span>Ahorras por volumen</span>
                <strong>−{pesos(cuenta.descuento)}</strong>
              </li>
            )}
            {cuenta.aparte.map(({ prueba: p, cantidad }) => (
              <li key={p.id}>
                <span>
                  {personal ? p.nombre : `${cantidad} × ${p.nombre}`}
                </span>
                <strong>
                  {p.precio == null
                    ? "Se cotiza aparte"
                    : `${pesos(conIva(p.precio))}${personal ? "" : " c/u"} · aparte`}
                </strong>
              </li>
            ))}
            <li className={s.tiempo}>
              <span>
                <Clock size={13} aria-hidden /> Tiempo para responder
              </span>
              <strong>
                {personal ? `~${minutos} min` : `${HORAS_PARA_CONTESTAR} h por código`}
              </strong>
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
              {enviando ? "Abriendo el pago…" : `Pagar ${pesos(cuenta.total)}`}
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
              ? `Cotizar ${cuenta.aparte.map((a) => a.prueba.nombre).join(" y ")} por WhatsApp`
              : "¿Dudas? Escríbenos por WhatsApp"
            : personal
              ? "Quiero evaluarme"
              : "Cotizar por WhatsApp"}
          {!sePuedePagar && <ArrowRight size={16} aria-hidden />}
        </a>
        <p className={s.letraChica}>
          {personal
            ? `Te mandamos tu código en cuanto se confirma el pago. Al activarlo tienes ${HORAS_PARA_CONTESTAR} horas para contestar. Tu informe, firmado por un psicólogo, llega en ${HORAS_ENTREGA} horas y solo lo ves tú.`
            : `Te mandamos un código por cada prueba en cuanto se confirma el pago, y quedan en tu panel. Cada candidato tiene ${HORAS_PARA_CONTESTAR} horas para contestar desde que activa su código. El informe, firmado por un psicólogo en formato profesional, llega en ${HORAS_ENTREGA} horas.`}
        </p>
      </aside>
    </div>
  );
}
