"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ArrowRight, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { useCarrito } from "@/lib/carrito";
import { RUTAS } from "@/lib/ceduct/rutas";
import { Emblema } from "./Iconos";
import s from "./mk.module.css";

type Enlace = { label: string; href: string; activo: (ruta: string, tipo: string | null) => boolean };

const ENLACES: Enlace[] = [
  {
    label: "Diplomados",
    href: RUTAS.catalogo({ tipo: "diplomado" }),
    activo: (r, t) => r.startsWith("/diplomados") && t === "diplomado",
  },
  {
    label: "Certificaciones",
    href: RUTAS.catalogo({ tipo: "certificacion" }),
    activo: (r, t) => r.startsWith("/diplomados") && t === "certificacion",
  },
  { label: "Empresas", href: RUTAS.empresas, activo: () => false },
  { label: "Nosotros", href: RUTAS.nosotros, activo: (r) => r === RUTAS.nosotros },
];

function ContadorCarrito() {
  const { items, listo } = useCarrito();
  const n = listo ? items.length : 0;
  const [pulso, setPulso] = useState(false);
  const previo = useRef(n);

  useEffect(() => {
    if (n > previo.current) {
      setPulso(true);
      const t = setTimeout(() => setPulso(false), 520);
      previo.current = n;
      return () => clearTimeout(t);
    }
    previo.current = n;
  }, [n]);

  return (
    <Link
      href={RUTAS.carrito}
      className={s.iconoBtn}
      aria-label={n > 0 ? `Carrito, ${n} ${n === 1 ? "programa" : "programas"}` : "Carrito vacío"}
    >
      <ShoppingBag size={20} aria-hidden />
      {n > 0 && (
        <span className={s.badge} data-pulso={pulso} aria-hidden>
          {n}
        </span>
      )}
    </Link>
  );
}

function Buscador({ id, autoFocus }: { id: string; autoFocus?: boolean }) {
  const params = useSearchParams();
  return (
    <form action="/diplomados" method="get" role="search" className={s.navBuscar}>
      <label htmlFor={id} className={s.visualmenteOculto}>
        Buscar diplomados y certificaciones
      </label>
      <Search size={17} aria-hidden />
      <input
        id={id}
        name="q"
        type="search"
        placeholder="Buscar cursos, estándares…"
        defaultValue={params.get("q") ?? ""}
        autoComplete="off"
        autoFocus={autoFocus}
      />
    </form>
  );
}

export function Navbar({ conSesion }: { conSesion: boolean }) {
  const ruta = usePathname() || "";
  const params = useSearchParams();
  const tipo = params.get("tipo");
  const [abierto, setAbierto] = useState(false);
  const [scroll, setScroll] = useState(false);

  useEffect(() => {
    const alMover = () => setScroll(window.scrollY > 8);
    alMover();
    window.addEventListener("scroll", alMover, { passive: true });
    return () => window.removeEventListener("scroll", alMover);
  }, []);

  // Cambiar de página cierra el menú móvil.
  useEffect(() => setAbierto(false), [ruta, tipo]);

  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("keydown", alTeclear);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", alTeclear);
      document.body.style.overflow = "";
    };
  }, [abierto]);

  const cuenta = conSesion
    ? { href: RUTAS.misCursos, label: "Mis cursos" }
    : { href: RUTAS.acceso, label: "Iniciar sesión" };

  return (
    <>
      <header className={s.nav} data-scroll={scroll || abierto}>
        <div className={`${s.contenedor} ${s.navInterior}`}>
          <Link href={RUTAS.inicio()} className={s.marca} aria-label="CEDUCT, inicio">
            <Emblema className={s.marcaIcono} />
            <span className={s.marcaTexto}>
              <strong>CEDUCT</strong>
              <small>Competencias laborales</small>
            </span>
          </Link>

          <nav aria-label="Principal" className={s.navPrincipal}>
            <ul className={s.navLinks}>
              {ENLACES.map((e) => (
                <li key={e.label}>
                  <Link
                    href={e.href}
                    className={s.navLink}
                    aria-current={e.activo(ruta, tipo) ? "page" : undefined}
                  >
                    {e.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <Buscador id="buscar-nav" />

          <div className={s.navAcciones}>
            <Link href={cuenta.href} className={s.iconoBtn} aria-label={cuenta.label}>
              <UserRound size={20} aria-hidden />
              <span className={s.ocultarTablet}>{conSesion ? "Mis cursos" : "Entrar"}</span>
            </Link>
            <ContadorCarrito />
            <button
              type="button"
              className={`${s.iconoBtn} ${s.menuBtn}`}
              aria-expanded={abierto}
              aria-controls="menu-movil"
              aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
              onClick={() => setAbierto((v) => !v)}
            >
              {abierto ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
            </button>
          </div>
        </div>
      </header>

      <div id="menu-movil" className={s.menuMovil} data-abierto={abierto} hidden={!abierto}>
        {abierto && <Buscador id="buscar-movil" />}
        <nav aria-label="Menú móvil">
          <ul>
            <li>
              <Link href={RUTAS.catalogo()}>
                Todo el catálogo <ArrowRight size={20} aria-hidden />
              </Link>
            </li>
            {ENLACES.map((e) => (
              <li key={e.label}>
                <Link href={e.href}>
                  {e.label} <ArrowRight size={20} aria-hidden />
                </Link>
              </li>
            ))}
            <li>
              <Link href={RUTAS.contacto}>
                Contacto <ArrowRight size={20} aria-hidden />
              </Link>
            </li>
            <li>
              <Link href={cuenta.href}>
                {cuenta.label} <ArrowRight size={20} aria-hidden />
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
}
