"use client";

import { useEffect, useRef, useState } from "react";
import { animate, createTimeline, stagger, svg } from "animejs";
import {
  CANDIDATOS,
  PUESTO,
  RadarBateria,
  ajuste,
  mayorBrecha,
  poligono,
  punto,
} from "./arte/RadarBateria";
import { menosMovimiento } from "@/lib/aparicion";
import s from "./RadarVivo.module.css";

/** Escribe el perfil de la persona en el SVG: polígono y vértices. */
function pintarPerfil(nodo: HTMLElement, valores: readonly number[]) {
  const perfil = nodo.querySelector<SVGPolygonElement>('[data-perfil="persona"]');
  perfil?.setAttribute("points", poligono(valores));

  nodo.querySelectorAll<SVGCircleElement>("[data-vertice]").forEach((v) => {
    const i = Number(v.dataset.eje);
    const [x, y] = punto(i, valores[i]);
    v.setAttribute("cx", String(x));
    v.setAttribute("cy", String(y));
  });
}

/** Coloca el segmento de la brecha sobre su eje y resalta esa etiqueta. */
function pintarBrecha(nodo: HTMLElement, valores: readonly number[], eje: number) {
  const linea = nodo.querySelector<SVGLineElement>("[data-brecha]");
  if (linea) {
    const [x1, y1] = punto(eje, valores[eje]);
    const [x2, y2] = punto(eje, PUESTO[eje]);
    linea.setAttribute("x1", String(x1));
    linea.setAttribute("y1", String(y1));
    linea.setAttribute("x2", String(x2));
    linea.setAttribute("y2", String(y2));
  }
  nodo.querySelectorAll<SVGTextElement>("[data-etiqueta]").forEach((t) => {
    t.setAttribute("data-foco", Number(t.dataset.eje) === eje ? "si" : "no");
  });
}

/**
 * El radar, vivo: se dibuja solo y cambia de candidato.
 *
 * Verlo trazarse —primero la rejilla, luego lo que el puesto exige y encima lo
 * que la persona ofrece— es el orden en que se lee una batería. Y poder cambiar
 * de candidato con el mismo puesto de fondo enseña lo único que de verdad
 * importa: no el pentágono bonito, sino cuánto se separa del otro y en qué eje.
 */
export function RadarVivo({ className }: { className?: string }) {
  const caja = useRef<HTMLDivElement>(null);
  const cifra = useRef<HTMLSpanElement>(null);
  const [activo, setActivo] = useState(0);
  const anterior = useRef(0);

  const candidato = CANDIDATOS[activo];
  const brecha = mayorBrecha(candidato.valores);
  const nivel = ajuste(candidato.valores);

  // Entrada: el radar se traza la primera vez que entra en pantalla.
  useEffect(() => {
    const nodo = caja.current;
    if (!nodo) return;

    const partes = nodo.querySelectorAll<SVGElement>(
      "[data-anillo], [data-radio], [data-perfil], [data-vertice], [data-etiqueta], [data-brecha], [data-leyenda]",
    );
    if (!partes.length) return;

    // El marcado que llega del servidor trae el primer candidato: sólo falta
    // decir qué etiqueta va resaltada.
    const inicial = CANDIDATOS[0].valores;
    pintarBrecha(nodo, inicial, mayorBrecha(inicial).eje);

    // Sin JS o sin ganas de movimiento, el radar se ve entero desde el inicio.
    if (menosMovimiento() || !("IntersectionObserver" in window)) return;

    partes.forEach((n) => {
      n.style.opacity = "0";
    });

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting) return;
        observador.disconnect();

        const linea = createTimeline({ defaults: { ease: "out(3)" } });

        linea
          .add(nodo.querySelectorAll("[data-anillo], [data-radio]"), {
            opacity: [0, 0.16],
            scale: [0.86, 1],
            duration: 460,
            delay: stagger(42),
          })
          .add(
            svg.createDrawable(nodo.querySelectorAll("[data-perfil='puesto']")),
            { draw: ["0 0", "0 1"], opacity: [0, 1], duration: 700 },
            "-=260",
          )
          // El perfil de la persona va punteado y `createDrawable` usa el mismo
          // stroke-dasharray, así que se le borraría la línea discontinua que
          // lo distingue del puesto. Entra con escala, no trazándose.
          .add(
            nodo.querySelectorAll("[data-perfil='persona']"),
            { opacity: [0, 1], scale: [0.9, 1], duration: 480 },
            "-=360",
          )
          .add(
            nodo.querySelectorAll("[data-vertice]"),
            { opacity: [0, 1], scale: [0, 1], duration: 340, delay: stagger(50) },
            "-=360",
          )
          .add(
            nodo.querySelectorAll("[data-etiqueta]"),
            { opacity: [0, 0.72], duration: 360, delay: stagger(45) },
            "-=480",
          )
          // La brecha entra al final: es la conclusión, no el punto de partida.
          .add(
            svg.createDrawable(nodo.querySelectorAll("[data-brecha]")),
            { draw: ["0 0", "0 1"], opacity: [0, 0.85], duration: 520 },
            "-=120",
          )
          .add(nodo.querySelectorAll("[data-leyenda]"), { opacity: [0, 1], duration: 340 }, "-=320");
      },
      { rootMargin: "0px 0px -15% 0px" },
    );

    observador.observe(nodo);
    return () => observador.disconnect();
  }, []);

  // Cambio de candidato: el perfil se deforma de uno a otro.
  useEffect(() => {
    const nodo = caja.current;
    if (!nodo) return;

    const desde = CANDIDATOS[anterior.current].valores;
    const hasta = CANDIDATOS[activo].valores;
    const ejeDestino = mayorBrecha(hasta).eje;
    const primerPintado = anterior.current === activo;
    anterior.current = activo;

    if (primerPintado) return;

    if (menosMovimiento()) {
      pintarPerfil(nodo, hasta);
      pintarBrecha(nodo, hasta, ejeDestino);
      if (cifra.current) cifra.current.textContent = `${ajuste(hasta)}%`;
      return;
    }

    const linea = nodo.querySelector<SVGLineElement>("[data-brecha]");
    // La brecha vieja se apaga antes de saltar de eje; vuelve al terminar.
    if (linea) linea.style.opacity = "0";

    // Un objeto con un campo por eje: anime.js interpola números sueltos igual
    // que estilos, y cada cuadro se vuelve a escribir el polígono.
    const paso = { v0: desde[0], v1: desde[1], v2: desde[2], v3: desde[3], v4: desde[4] };
    const animacion = animate(paso, {
      v0: hasta[0],
      v1: hasta[1],
      v2: hasta[2],
      v3: hasta[3],
      v4: hasta[4],
      duration: 620,
      ease: "out(3)",
      onUpdate: () => {
        const valores = [paso.v0, paso.v1, paso.v2, paso.v3, paso.v4];
        pintarPerfil(nodo, valores);
        pintarBrecha(nodo, valores, ejeDestino);
      },
      onComplete: () => {
        pintarPerfil(nodo, hasta);
        pintarBrecha(nodo, hasta, ejeDestino);
      },
    });

    const reaparece = linea
      ? animate(linea, { opacity: [0, 0.85], duration: 420, delay: 260, ease: "out(3)" })
      : null;

    // El ajuste cuenta hasta su nuevo valor: se ve cuánto se movió.
    const cuenta = { v: ajuste(desde) };
    const contador = cifra.current
      ? animate(cuenta, {
          v: ajuste(hasta),
          duration: 620,
          ease: "out(3)",
          onUpdate: () => {
            if (cifra.current) cifra.current.textContent = `${Math.round(cuenta.v)}%`;
          },
        })
      : null;

    return () => {
      animacion.pause();
      reaparece?.pause();
      contador?.pause();
      if (linea) linea.style.opacity = "";
      pintarPerfil(nodo, hasta);
      pintarBrecha(nodo, hasta, ejeDestino);
      if (cifra.current) cifra.current.textContent = `${ajuste(hasta)}%`;
    };
  }, [activo]);

  return (
    <div className={`${s.caja} ${className ?? ""}`}>
      <div className={s.marco} ref={caja}>
        <span className={s.halo} aria-hidden />
        <RadarBateria className={s.svg} />
      </div>

      <div className={s.mandos} role="group" aria-label="Candidatos de ejemplo">
        {CANDIDATOS.map((c, i) => (
          <button
            key={c.id}
            type="button"
            className={s.mando}
            data-activo={i === activo}
            aria-pressed={i === activo}
            onClick={() => setActivo(i)}
          >
            {c.nombre}
          </button>
        ))}
      </div>

      {/* La cifra se escribe cuadro a cuadro mientras cuenta; si viviera dentro
          de la región viva, un lector de pantalla recitaría cada paso. Lo que
          se anuncia es el resultado, una sola vez. */}
      <p className={s.lectura} aria-hidden>
        <span className={s.lecturaCifra}>
          <span ref={cifra}>{nivel}%</span>
          <em>de ajuste al puesto</em>
        </span>
        <span className={s.lecturaBrecha}>
          Mayor brecha: <strong>{brecha.nombre}</strong>
        </span>
      </p>

      <p className={s.voz} aria-live="polite">
        {candidato.nombre}: {nivel}% de ajuste al puesto. Mayor brecha:{" "}
        {brecha.nombre}.
      </p>

      <p className={s.nota}>
        Ejemplo con tres candidatos a la misma vacante. Datos ilustrativos.
      </p>
    </div>
  );
}
