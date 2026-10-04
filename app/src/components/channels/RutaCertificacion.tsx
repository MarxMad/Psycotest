"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { animate, stagger } from "animejs";
import { ArrowRight } from "lucide-react";
import s from "./RutaCertificacion.module.css";

/**
 * Las tres etapas del camino a la certificación.
 *
 * Es el esquema que usa CEDUCT para explicarlo: primero reconoces lo que ya
 * sabes, luego cursas, y al final te certificas. Cada etapa se abre sola al
 * tocarla, así que la página cuenta el proceso completo sin obligar a
 * desplazarse por tres bloques iguales.
 */
const ETAPAS = [
  {
    id: "uno",
    ordinal: "uno",
    titulo: "Reconoce lo que ya sabes",
    resumen: "Antes de estudiar nada, ponemos en claro qué sabes hacer y cuánto de eso ya vale.",
    pasos: [
      { titulo: "Valida tus conocimientos", texto: "Vemos qué dominas de verdad, no qué cursos tomaste." },
      { titulo: "Capitaliza tu experiencia", texto: "Los años de oficio cuentan como evidencia, no se tiran." },
      { titulo: "Ubica tu dominio", texto: "Identificamos el estándar de competencia que te corresponde." },
    ],
  },
  {
    id: "dos",
    ordinal: "dos",
    titulo: "Cursa el programa",
    resumen: "El diplomado cubre lo que te falta para el estándar, ni más ni menos.",
    pasos: [
      { titulo: "Ingresa a los módulos", texto: "Solo los que te corresponden según tu diagnóstico." },
      { titulo: "Participa", texto: "Clases en vivo, pizarra y trabajo con el grupo." },
      { titulo: "Practica", texto: "Ejercicios con los productos que luego serán tu evidencia." },
      { titulo: "Recibe tu constancia", texto: "Al cerrar el programa, con horas y contenido detallados." },
    ],
  },
  {
    id: "tres",
    ordinal: "tres",
    titulo: "Certifícate",
    resumen: "La parte que da validez oficial: un evaluador acreditado dictamina tu competencia.",
    pasos: [
      { titulo: "Solicita tu evaluación", texto: "Se abre tu expediente y se agenda con el evaluador." },
      { titulo: "Acredita tu competencia", texto: "Presentas evidencias y desempeños conforme al estándar." },
      { titulo: "Obtén tu certificado", texto: "Se emite y se registra ante CONOCER. No caduca." },
    ],
  },
] as const;

/** Lo que se lleva quien termina. El motivo, no el trámite. */
const LOGROS = [
  "Mejores ingresos",
  "Reconocimiento nacional",
  "Satisfacción por lo que haces",
  "Constancia",
  "Certificado",
];

function menosMovimiento() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function RutaCertificacion() {
  const [activa, setActiva] = useState(0);
  const lista = useRef<HTMLOListElement>(null);
  const seccion = useRef<HTMLElement>(null);
  const [dentro, setDentro] = useState(false);

  useEffect(() => {
    const nodo = seccion.current;
    if (!nodo) return;
    if (!("IntersectionObserver" in window)) {
      setDentro(true);
      return;
    }
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting) return;
        setDentro(true);
        observador.disconnect();
      },
      { rootMargin: "0px 0px -15% 0px" },
    );
    observador.observe(nodo);
    return () => observador.disconnect();
  }, []);

  // Los pasos de la etapa entran escalonados cada vez que se cambia de etapa.
  const animarPasos = useCallback(() => {
    const nodos = lista.current?.querySelectorAll<HTMLElement>("[data-paso]");
    if (!nodos?.length) return;
    if (menosMovimiento()) {
      nodos.forEach((n) => {
        n.style.opacity = "1";
        n.style.transform = "none";
      });
      return;
    }
    animate(Array.from(nodos), {
      opacity: [0, 1],
      translateY: [14, 0],
      duration: 480,
      delay: stagger(70),
      ease: "out(3)",
    });
  }, []);

  useEffect(() => {
    if (!dentro) return;
    animarPasos();
  }, [activa, dentro, animarPasos]);

  const etapa = ETAPAS[activa];

  return (
    <section ref={seccion} className={s.ruta} id="ruta" data-en={dentro ? "si" : "no"}>
      <div className={s.interior}>
        <header className={s.encabezado}>
          <p className={s.eyebrow}>El camino completo</p>
          <h2 className={s.titulo}>
            Y tú… <em>¿para qué eres bueno?</em>
          </h2>
          <p className={s.entrada}>
            Lo que ya sabes hacer tiene nombre oficial y se puede acreditar. Son tres etapas y
            ninguna empieza de cero: la primera es reconocer lo que traes.
          </p>
        </header>

        {/* Las tres etapas: se elige una y el detalle se arma debajo. */}
        <div className={s.etapas} role="tablist" aria-label="Etapas del proceso">
          {ETAPAS.map((e, i) => {
            const activo = i === activa;
            return (
              <button
                key={e.id}
                type="button"
                role="tab"
                aria-selected={activo}
                aria-controls="ruta-detalle"
                className={s.etapa}
                data-activa={activo}
                style={{ ["--i" as string]: i }}
                onClick={() => setActiva(i)}
              >
                <span className={s.ordinal} aria-hidden>
                  {e.ordinal}
                </span>
                <span className={s.etapaTexto}>
                  <strong>{e.titulo}</strong>
                  <span>{e.resumen}</span>
                </span>
                <span className={s.etapaBarra} aria-hidden />
              </button>
            );
          })}
        </div>

        <div className={s.detalle} id="ruta-detalle" role="tabpanel">
          <ol className={s.pasos} ref={lista}>
            {etapa.pasos.map((p, i) => (
              <li key={p.titulo} className={s.paso} data-paso>
                <span className={s.pasoNum} aria-hidden>
                  {i + 1}
                </span>
                <div>
                  <strong>{p.titulo}</strong>
                  <p>{p.texto}</p>
                </div>
              </li>
            ))}
          </ol>

          <aside className={s.logros}>
            <p className={s.logrosTitulo}>Certifícate y obtén</p>
            <ul>
              {LOGROS.map((l, i) => (
                <li key={l} style={{ ["--i" as string]: i }}>
                  {l}
                </li>
              ))}
            </ul>
            <a className={s.logrosCta} href="#diplomados">
              Elegir mi estándar
              <ArrowRight size={16} aria-hidden />
            </a>
          </aside>
        </div>

        <p className={s.arranque}>
          <span>Para empezar:</span> elige el estándar · regístrate · entra al programa.
        </p>
      </div>
    </section>
  );
}
