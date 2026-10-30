"use client";

import { useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { ArrowUpRight, Mail, Menu, MessageCircle, Phone, X } from "lucide-react";
import type { ChannelDef } from "@/lib/channels";
import { CONTACTO, mailto, tel, whatsapp } from "@/lib/contacto";
import { menosMovimiento } from "@/lib/aparicion";
import { MarcaIge, Nube } from "./Arte";
import m from "./Marco.module.css";

/*
 * El marco de IGE: cabecera flotante y pie con cielo.
 *
 * Lo usan la portada y las fichas de curso. Fuera de la portada, las anclas
 * del menú se resuelven contra ella (`base`), así que «Método» desde una
 * ficha lleva a la portada y baja a esa sección.
 */

export const DIAGNOSTICO = whatsapp("Hola, me interesa un diagnóstico organizacional.");

export function navIge(base = "") {
  return [
    { label: "Servicios", href: `${base}#servicios` },
    { label: "Método", href: `${base}#metodo` },
    { label: "Formatos", href: `${base}#capacitacion` },
    { label: "Cursos", href: `${base}#academia` },
    { label: "Contacto", href: `${base}#contacto` },
  ];
}

/** Un solo `requestAnimationFrame` por cuadro para lo que depende del scroll. */
export function useScroll(alMover: () => void) {
  const ref = useRef(alMover);
  ref.current = alMover;

  useEffect(() => {
    let pendiente = 0;
    const tick = () => {
      pendiente = 0;
      ref.current();
    };
    const pedir = () => {
      if (!pendiente) pendiente = requestAnimationFrame(tick);
    };
    tick();
    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir);
    return () => {
      cancelAnimationFrame(pendiente);
      window.removeEventListener("scroll", pedir);
      window.removeEventListener("resize", pedir);
    };
  }, []);
}

/** Desplazamiento suave; quien pidió menos movimiento conserva el nativo. */
export function Suave() {
  useEffect(() => {
    if (menosMovimiento()) return;
    const lenis = new Lenis({ autoRaf: true, anchors: { offset: -72 }, lerp: 0.11 });
    return () => lenis.destroy();
  }, []);
  return null;
}

export function Cabecera({ base = "" }: { base?: string }) {
  const [bajo, setBajo] = useState(false);
  const [abierto, setAbierto] = useState(false);
  useScroll(() => setBajo(window.scrollY > 48));

  return (
    <header className={m.cabecera} data-bajo={bajo} data-abierto={abierto}>
      <div className={m.cabeceraCaja}>
        <a
          href={base || "#inicio"}
          className={m.marca}
          onClick={() => setAbierto(false)}
          aria-label="Ingeniería de Grupos Efectivos, inicio"
        >
          <MarcaIge className={m.marcaSvg} />
          <span className={m.marcaTexto}>Ingeniería de Grupos Efectivos</span>
        </a>
        <nav className={m.nav} aria-label="Principal" id="menu-ige">
          {navIge(base).map((n) => (
            <a key={n.href} href={n.href} onClick={() => setAbierto(false)}>
              {n.label}
            </a>
          ))}
        </nav>
        <div className={m.cabeceraAcciones}>
          <a className={m.botonDurazno} href={DIAGNOSTICO} target="_blank" rel="noopener noreferrer">
            Agendar diagnóstico
          </a>
          <a className={m.botonCrema} href={`${base}#academia`}>
            Ver cursos
          </a>
        </div>
        <button
          type="button"
          className={m.botonMenu}
          aria-expanded={abierto}
          aria-controls="menu-ige"
          onClick={() => setAbierto((a) => !a)}
        >
          {abierto ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
          <span className={m.oculto}>{abierto ? "Cerrar menú" : "Abrir menú"}</span>
        </button>
      </div>
    </header>
  );
}

export function Pie({ channel, base = "" }: { channel: ChannelDef; base?: string }) {
  return (
    <footer className={m.pie}>
      <div className={m.pieRejilla}>
        <div>
          <p className={m.pieTitulo}>Navegación</p>
          <ul>
            {navIge(base).map((n) => (
              <li key={n.href}>
                <a href={n.href}>{n.label}</a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className={m.pieTitulo}>Contacto</p>
          <ul>
            <li>
              <a href={whatsapp("Hola")} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={14} aria-hidden /> WhatsApp
              </a>
            </li>
            <li>
              <a href={mailto("Contacto")}>
                <Mail size={14} aria-hidden /> {CONTACTO.email}
              </a>
            </li>
            <li>
              <a href={tel()}>
                <Phone size={14} aria-hidden /> {CONTACTO.phoneDisplay}
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className={m.pieTitulo}>Plataforma</p>
          <ul>
            <li>
              <a href="/mi-cuenta/en-vivo">
                Clases en vivo <ArrowUpRight size={13} aria-hidden />
              </a>
            </li>
            <li>
              <a href="/mi-cuenta">
                Mi cuenta <ArrowUpRight size={13} aria-hidden />
              </a>
            </li>
            <li>
              <a href="/legal">Aviso legal</a>
            </li>
          </ul>
        </div>
      </div>
      <div className={m.pieCielo}>
        <span className={`${m.nube} ${m.nubeI}`}>
          <Nube tono="lila" />
        </span>
        <span className={`${m.nube} ${m.nubeJ}`}>
          <Nube tono="durazno" />
        </span>
        <span className={`${m.nube} ${m.nubeK}`}>
          <Nube tono="lila" />
        </span>
        <p className={m.pieFirma}>
          {channel.legalName}, S.C. © {new Date().getFullYear()}
        </p>
        <MarcaIge className={m.pieMarca} tinta="#1f2a3d" titulo={channel.name} />
      </div>
    </footer>
  );
}
