"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Instrument_Serif } from "next/font/google";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { escenaDe } from "@/lib/ceduct/escenas";
import { CATEGORIAS, categoriaPorSlug } from "@/lib/ceduct/config";
import { RUTAS } from "@/lib/ceduct/rutas";
import { MODALIDAD_LABEL, TIPO_LABEL, precio, type Programa } from "@/lib/ceduct/tipos";
import { BotonAgregar } from "../BotonesCompra";
import s from "../mk.module.css";
import e from "./escenarios.module.css";

/** La palabra que lleva el acento del titular, en serif cursiva. */
const acento = Instrument_Serif({ subsets: ["latin"], weight: "400", style: "italic", display: "swap" });

/**
 * Todo el catálogo en un solo lugar.
 *
 * Antes había tres secciones casi iguales (sectores, diplomados y
 * certificaciones destacadas) y se confundían. Ahora cada programa es una
 * escena: una foto real de ese trabajo a pantalla completa y su ficha encima.
 *
 * En escritorio la escena se queda fija y el scroll la va cambiando: primero
 * la foto se abre de tarjeta a pantalla completa y luego pasan los programas
 * uno por uno, con un índice abajo para saltar a cualquiera. En teléfono, o
 * con «menos movimiento», es un carrusel que se desliza de lado. El HTML del
 * servidor es el carrusel, así que sin JavaScript también se lee todo.
 *
 * Las fotos son de Pexels (licencia libre para uso comercial), una por
 * programa, en /public/ceduct/escenas.
 */


type Escena = Programa & { foto: string | null; sector: string; tono: string };

function ordenar(programas: Programa[]): Escena[] {
  const orden = CATEGORIAS.map((c) => c.slug);
  const certs = programas
    .filter((p) => p.tipo === "certificacion")
    .sort((a, b) => orden.indexOf(a.categoria) - orden.indexOf(b.categoria));
  const dips = programas.filter((p) => p.tipo === "diplomado");
  return [...certs, ...dips].map((p) => {
    const cat = categoriaPorSlug(p.categoria);
    return {
      ...p,
      foto: escenaDe(p) ?? p.imagen,
      sector: p.tipo === "diplomado" ? "Diplomado · 104 horas" : cat.nombre,
      tono: p.tipo === "diplomado" ? "#c9a54a" : cat.tono,
    };
  });
}

function Foto({ foto, alt, prioridad }: { foto: string | null; alt: string; prioridad?: boolean }) {
  if (!foto) return <span className={e.fotoVacia} aria-hidden />;
  // Las rutas de /escenas tienen dos tamaños; una imagen de la base, uno.
  const local = foto.startsWith("/ceduct/escenas/");
  return (
    <img
      className={e.foto}
      src={local ? `${foto}.webp` : foto}
      srcSet={local ? `${foto}-800.webp 800w, ${foto}.webp 1600w` : undefined}
      sizes="100vw"
      alt={alt}
      loading={prioridad ? "eager" : "lazy"}
      decoding="async"
    />
  );
}

function Ficha({ p, n, total }: { p: Escena; n: number; total: number }) {
  return (
    <>
      <div className={e.fichaChips}>
        <span className={`${s.chip} ${p.tipo === "certificacion" ? s.chipNaranja : ""}`}>{TIPO_LABEL[p.tipo]}</span>
        {p.estandarClave && <span className={`${s.chip} ${s.chipOscuro}`}>{p.estandarClave}</span>}
        <span className={e.fichaCuenta}>
          {String(n + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
      </div>
      <p className={e.fichaSector} style={{ "--tono": p.tono } as React.CSSProperties}>
        {p.sector}
      </p>
      <h3 className={e.fichaTitulo}>
        <Link href={RUTAS.programa(p.slug)}>{p.titulo}</Link>
      </h3>
      {(p.subtitulo || p.descripcion) && <p className={e.fichaTexto}>{p.subtitulo || p.descripcion}</p>}
      <ul className={e.fichaDatos}>
        <li>{MODALIDAD_LABEL[p.modalidad]}</li>
        <li>{p.duracion}</li>
      </ul>
      <div className={e.fichaPie}>
        <p className={e.fichaPrecio}>
          <strong>{precio(p.precioMxn)}</strong>
          {p.precioMxn > 0 && <small>MXN · IVA incluido</small>}
        </p>
        <div className={e.fichaAcciones}>
          <Link href={RUTAS.programa(p.slug)} className={e.fichaDetalle}>
            Ver detalle <ArrowUpRight size={15} aria-hidden />
          </Link>
          <BotonAgregar programa={p} compacto />
        </div>
      </div>
    </>
  );
}

/* --------------------------------------------------------- escenario fijo */

/** Cuánto scroll ocupa cada tramo, en alturas de ventana. */
const APERTURA = 0.9;
const PASO = 0.62;

function Escenario({ escenas }: { escenas: Escena[] }) {
  const caja = useRef<HTMLDivElement>(null);
  const [apertura, setApertura] = useState(0);
  const [activa, setActiva] = useState(0);
  const [avance, setAvance] = useState(0);
  const n = escenas.length;

  useEffect(() => {
    let cuadro = 0;
    const medir = () => {
      cuadro = 0;
      const nodo = caja.current;
      if (!nodo) return;
      const vh = window.innerHeight;
      const recorrido = -nodo.getBoundingClientRect().top;
      const a = Math.min(1, Math.max(0, recorrido / (APERTURA * vh)));
      const resto = (recorrido - APERTURA * vh) / (PASO * vh);
      setApertura(a);
      setActiva(Math.min(n - 1, Math.max(0, Math.floor(resto))));
      setAvance(Math.min(1, Math.max(0, (resto + 1) / n)));
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
  }, [n]);

  const irA = useCallback((i: number) => {
    const nodo = caja.current;
    if (!nodo) return;
    const vh = window.innerHeight;
    const inicio = nodo.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: inicio + APERTURA * vh + (i + 0.2) * PASO * vh, behavior: "smooth" });
  }, []);

  // Con el foco en el índice, las flechas mueven de escena.
  const teclas = (ev: React.KeyboardEvent) => {
    if (ev.key === "ArrowRight" || ev.key === "ArrowDown") {
      ev.preventDefault();
      irA(Math.min(n - 1, activa + 1));
    } else if (ev.key === "ArrowLeft" || ev.key === "ArrowUp") {
      ev.preventDefault();
      irA(Math.max(0, activa - 1));
    }
  };

  const abierta = apertura > 0.98;

  return (
    <div
      ref={caja}
      className={e.recorrido}
      style={{ height: `${100 + (APERTURA + n * PASO) * 100}vh` }}
    >
      <div
        className={e.escenario}
        style={{ "--apertura": apertura } as React.CSSProperties}
        data-abierta={abierta}
      >
        <header className={e.intro} aria-hidden={abierta}>
          <p className={s.eyebrow}>Todo el catálogo</p>
          <h2 id="escenas-titulo" className={e.introTitulo}>
            Certifica lo que haces <em className={acento.className}>todos los días.</em>
          </h2>
          <p className={e.introTexto}>
            {escenas.filter((x) => x.tipo === "certificacion").length} certificaciones SEP-CONOCER y{" "}
            {escenas.filter((x) => x.tipo === "diplomado").length} diplomados. Baja para recorrerlos.
          </p>
        </header>

        <div className={e.ventana}>
          {escenas.map((p, i) => (
            <div
              key={p.id}
              className={e.capa}
              data-estado={i === activa ? "activa" : i < activa ? "antes" : "despues"}
              aria-hidden={i !== activa}
            >
              <Foto foto={p.foto} alt="" prioridad={i === 0} />
            </div>
          ))}
          <span className={e.velo} aria-hidden />

          {/* La clave del estándar, gigante y hueca, detrás de la ficha. */}
          {escenas.map((p, i) => (
            <span
              key={p.id}
              className={e.clave}
              data-estado={i === activa ? "activa" : i < activa ? "antes" : "despues"}
              aria-hidden
            >
              {p.estandarClave?.replace(/\..*$/, "") ?? "Diplomado"}
            </span>
          ))}

          <div className={e.fichas}>
            {escenas.map((p, i) => (
              <article
                key={p.id}
                className={e.ficha}
                data-estado={i === activa ? "activa" : i < activa ? "antes" : "despues"}
                aria-hidden={i !== activa}
                inert={i !== activa || !abierta ? true : undefined}
              >
                <Ficha p={p} n={i} total={n} />
              </article>
            ))}
          </div>
        </div>

        <nav className={e.indice} aria-label="Programas del catálogo" onKeyDown={teclas}>
          <span className={e.indiceBarra} aria-hidden>
            <span style={{ transform: `scaleX(${avance})` }} />
          </span>
          <ol>
            {escenas.map((p, i) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => irA(i)}
                  aria-current={i === activa ? "true" : undefined}
                  style={{ "--tono": p.tono } as React.CSSProperties}
                  title={p.titulo}
                >
                  {p.estandarClave?.replace(/\..*$/, "") ?? p.titulo.replace(/^(El|La|Los|Las) /, "")}
                </button>
              </li>
            ))}
          </ol>
          <Link href={RUTAS.catalogo()} className={e.indiceTodo}>
            Ver catálogo <ArrowRight size={15} aria-hidden />
          </Link>
        </nav>
      </div>
    </div>
  );
}

/* ---------------------------------------------------- carrusel de respaldo */

function Carrusel({ escenas }: { escenas: Escena[] }) {
  const pista = useRef<HTMLOListElement>(null);
  const mover = (dir: 1 | -1) => {
    const nodo = pista.current;
    if (!nodo) return;
    const paso = (nodo.firstElementChild as HTMLElement | null)?.offsetWidth ?? nodo.clientWidth;
    nodo.scrollBy({ left: dir * (paso + 16), behavior: "smooth" });
  };

  return (
    <div className={e.carrusel}>
      <div className={`${s.contenedor} ${e.carruselCabeza}`}>
        <div>
          <p className={s.eyebrow}>Todo el catálogo</p>
          <h2 id="escenas-titulo" className={e.introTitulo}>
            Certifica lo que haces <em className={acento.className}>todos los días.</em>
          </h2>
        </div>
        <div className={e.carruselFlechas}>
          <button type="button" onClick={() => mover(-1)} aria-label="Anterior">
            <ArrowLeft size={18} />
          </button>
          <button type="button" onClick={() => mover(1)} aria-label="Siguiente">
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
      <ol ref={pista} className={e.carruselPista} aria-label="Programas del catálogo">
        {escenas.map((p, i) => (
          <li key={p.id} className={e.carruselTarjeta}>
            <div className={e.carruselFoto}>
              <Foto foto={p.foto} alt="" />
            </div>
            <article className={e.carruselFicha}>
              <Ficha p={p} n={i} total={escenas.length} />
            </article>
          </li>
        ))}
      </ol>
      <div className={s.contenedor}>
        <Link href={RUTAS.catalogo()} className={`${s.btn} ${s.btnSecundario}`}>
          Ver el catálogo completo <ArrowRight size={16} aria-hidden />
        </Link>
      </div>
    </div>
  );
}

export function Escenarios({ programas }: { programas: Programa[] }) {
  const escenas = useMemo(() => ordenar(programas), [programas]);
  const [fijo, setFijo] = useState(false);

  useEffect(() => {
    const ancho = window.matchMedia("(min-width: 900px) and (min-height: 600px)");
    const calma = window.matchMedia("(prefers-reduced-motion: reduce)");
    const decidir = () => setFijo(ancho.matches && !calma.matches);
    decidir();
    ancho.addEventListener("change", decidir);
    calma.addEventListener("change", decidir);
    return () => {
      ancho.removeEventListener("change", decidir);
      calma.removeEventListener("change", decidir);
    };
  }, []);

  if (escenas.length === 0) return null;

  return (
    <section id="catalogo" className={e.seccion} aria-labelledby="escenas-titulo">
      {fijo ? <Escenario escenas={escenas} /> : <Carrusel escenas={escenas} />}
    </section>
  );
}
