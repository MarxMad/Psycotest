"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Sello } from "../Ornamentos";
import h from "./hero-escritorio.module.css";

/*
 * La portada como una escena en tres tiempos, guiada por el scroll:
 *
 *   1. El escritorio: sobre el papel en blanco de la foto se va imprimiendo
 *      el certificado (nombre, estándar, firmas). Es el de la instructora de
 *      la tercera escena, marcado como espécimen.
 *   2. El sello baja y se estampa; un destello de luz cruza el papel.
 *   3. Desde el sello se abre un círculo que revela la segunda escena: la
 *      persona ya certificada, en su trabajo.
 *
 * El JS sólo mide cuánto se ha recorrido (--p, de 0 a 1) y dónde quedó el
 * sello en pantalla; cada fase se calcula en CSS a partir de --p. Sin
 * movimiento (o antes de hidratar) se muestra un cuadro fijo: impreso y
 * sellado.
 */

const FOTO = "/ceduct/hero/escritorio.webp";
const FOTO_MOVIL = "/ceduct/hero/escritorio-movil.webp";
// La instructora ya certificada (EC0217.01, el mismo del papel), con su
// certificado enmarcado en la pared.
const ESCENA_FINAL = "/ceduct/hero/final.webp";
const ESCENA_FINAL_MOVIL = "/ceduct/hero/final-movil.webp";

type Modo = "fijo" | "escena";

/** Lo impreso sobre el papel de la foto: sólo tinta, el papel es el de la imagen. */
function Impreso() {
  return (
    <div className={h.impreso} aria-hidden>
      <p className={h.impCabeza}>
        <span>Sistema Nacional de Competencias</span>
        <span>
          <b>Espécimen</b> · Folio 0217-2026-00418
        </span>
      </p>
      <p className={h.impTitulo}>Certificado de Competencia Laboral</p>
      <p className={h.impOtorga}>que acredita a</p>
      <p className={h.impNombre}>
        <span>Mariana Torres Aguilar</span>
      </p>
      <p className={h.impTexto}>como persona competente en el Estándar de Competencia</p>
      <p className={h.impEstandar}>
        <strong>EC0217.01</strong>
        <span>Impartición de cursos de formación del capital humano de manera presencial grupal</span>
      </p>
      <div className={h.impPie}>
        <div className={h.impFirma}>
          <svg viewBox="0 0 120 30">
            <path
              pathLength={1}
              d="M8 20 C 10 6, 22 4, 18 16 C 14 26, 6 24, 14 18 C 22 12, 30 22, 34 18 C 38 14, 36 10, 40 12 C 44 16, 42 22, 48 20 C 54 18, 56 8, 60 10 C 64 13, 60 22, 66 22 C 74 22, 80 12, 88 14 C 96 16, 104 18, 114 13"
            />
          </svg>
          <span>Evaluador certificado</span>
        </div>
        <div className={h.impHueco} />
        <div className={h.impFirma}>
          <svg viewBox="0 0 120 30">
            <path
              pathLength={1}
              d="M10 24 L 22 6 C 26 2, 28 10, 24 16 C 20 22, 30 20, 36 14 C 40 10, 42 18, 46 18 C 52 18, 52 10, 58 12 C 62 14, 60 20, 66 19 C 72 18, 74 12, 80 13 M 84 22 C 92 8, 100 10, 98 16 C 96 22, 108 18, 116 12"
            />
          </svg>
          <span>Entidad de certificación</span>
        </div>
      </div>
    </div>
  );
}

export function HeroEscritorio({ texto, datos }: { texto: ReactNode; datos: ReactNode }) {
  const pista = useRef<HTMLDivElement>(null);
  const escena = useRef<HTMLDivElement>(null);
  const sello = useRef<HTMLDivElement>(null);
  const [modo, setModo] = useState<Modo>("fijo");

  useEffect(() => {
    const calma = window.matchMedia("(prefers-reduced-motion: reduce)");
    const decidir = () => setModo(calma.matches ? "fijo" : "escena");
    decidir();
    calma.addEventListener("change", decidir);
    return () => calma.removeEventListener("change", decidir);
  }, []);

  useEffect(() => {
    if (modo !== "escena") return;
    const nodo = pista.current;
    const caja = escena.current;
    if (!nodo || !caja) return;
    let cuadro = 0;
    const medir = () => {
      cuadro = 0;
      const r = nodo.getBoundingClientRect();
      const recorrido = r.height - window.innerHeight;
      const p = recorrido > 0 ? Math.min(1, Math.max(0, -r.top / recorrido)) : 0;
      caja.style.setProperty("--p", p.toFixed(4));
      // El círculo de la tercera escena nace donde quedó el sello.
      const s = sello.current?.getBoundingClientRect();
      if (s) {
        caja.style.setProperty("--sx", `${(s.left + s.width / 2).toFixed(1)}px`);
        caja.style.setProperty("--sy", `${(s.top + s.height / 2).toFixed(1)}px`);
      }
    };
    const pedir = () => {
      if (!cuadro) cuadro = requestAnimationFrame(medir);
    };
    medir();
    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir);
    return () => {
      cancelAnimationFrame(cuadro);
      window.removeEventListener("scroll", pedir);
      window.removeEventListener("resize", pedir);
    };
  }, [modo]);

  return (
    <section className={h.hero} data-modo={modo} aria-labelledby="hero-titulo">
      <div ref={pista} className={h.pista}>
        <div ref={escena} className={h.escena}>
          {/* El lienzo tiene la proporción de la foto y la cubre: todo lo de
              adentro se coloca en % de la imagen y no se desalinea. */}
          <div className={h.lienzo}>
            <picture>
              <source media="(max-width: 700px)" srcSet={FOTO_MOVIL} />
              <img src={FOTO} alt="" className={h.foto} fetchPriority="high" />
            </picture>
            <div className={h.papel}>
              <Impreso />
              <div ref={sello} className={h.sello}>
                <Sello />
              </div>
            </div>
            {/* El destello sólo pasa por el papel visible de la foto (máscara
                sacada de la imagen): no cruza la pluma ni el sello de latón. */}
            <div className={h.destello} aria-hidden />
          </div>

          <div className={h.sombraTexto} aria-hidden />
          <div className={h.texto}>{texto}</div>

          <div className={h.final} aria-hidden={modo !== "escena"}>
            <picture>
              <source media="(max-width: 700px)" srcSet={ESCENA_FINAL_MOVIL} />
              <img src={ESCENA_FINAL} alt="" className={h.finalFoto} loading="lazy" />
            </picture>
            <p className={h.finalFrase}>
              Lo que ya sabías hacer,
              <em> ahora con validez oficial.</em>
            </p>
          </div>

          <p className={h.aviso} aria-hidden>
            Desliza
          </p>
        </div>
      </div>
      {datos}
    </section>
  );
}
