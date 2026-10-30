"use client";

import dynamic from "next/dynamic";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { animate, stagger } from "animejs";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Building2,
  ChevronDown,
  KeyRound,
  Menu,
  MessageCircle,
  User,
  X,
} from "lucide-react";
import type { ChannelDef } from "@/lib/channels";
import type { ChannelPageContent } from "@/lib/channel-content";
import { evaluacion } from "@/lib/routes";
import { CONTACTO, mailto, tel, whatsapp } from "@/lib/contacto";
import { PRUEBAS } from "@/lib/pruebas-catalogo";
import { menosMovimiento, useAparicion } from "@/lib/aparicion";
import { Cotizador } from "./Cotizador";
import { RadarVivo } from "./RadarVivo";
import { SelloSociedad } from "./arte";
import { BARRAS, PRESENTACION } from "./psico/datos";
import type { Enfoque } from "./psico/EscenaConsultorio";
import s from "./PsicologiaLanding.module.css";

/*
 * Portada de Psicología Aplicada.
 *
 * Clara y cálida a propósito: quien llega va a confiarnos a sus candidatos.
 * La estructura sigue un recorrido de portafolio —escena, manifiesto,
 * saludo, obras con su ficha, archivo y cierre— pero cada parada responde
 * algo que la empresa necesita saber antes de escribirnos.
 */

const EscenaConsultorio = dynamic(() => import("./psico/EscenaConsultorio"), { ssr: false });

/** A quién le hablamos: la empresa que contrata o la persona que quiere conocerse. */
type Publico = Exclude<Enfoque, null>;

const NAV = [
  { label: "Instrumentos", href: "#instrumentos" },
  { label: "Cómo trabajamos", href: "#como-funciona" },
  { label: "Para personas", href: "#personas" },
  { label: "Cotizar", href: "#bateria" },
  { label: "Contacto", href: "#contacto" },
];

/** Lo que dice la portada según el público elegido. */
const PORTADA: Record<Publico, { titular: string; accion: string }> = {
  empresas: {
    titular: "Elige a tu próximo colaborador con evidencia, no con intuición.",
    accion: "Evaluar a mis candidatos",
  },
  personas: {
    titular: "Conócete con método: tu perfil psicológico, interpretado por un psicólogo.",
    accion: "Quiero evaluarme",
  },
};

const MANIFIESTO = [
  ["Evaluar", "personas", "con método"],
  ["Conocerte", "para decidir", "mejor"],
  ["Contratar", "con certeza,", "no a ciegas"],
];

const CIERRE = [
  ["Hablemos de", "tu próxima", "contratación"],
  ["O de tu", "siguiente", "paso"],
];

/** Para quien se evalúa a sí mismo. Se suma a los grupos editables desde el admin. */
const PARA_PERSONAS = {
  id: "personas",
  eyebrow: "Para personas",
  title: "Si la evaluación es para ti",
  items: [
    {
      title: "Conócete con método",
      text: "Respondes los mismos instrumentos que usan las empresas y recibes tu perfil interpretado por un psicólogo: cómo trabajas, qué te mueve y cómo decides.",
    },
    {
      title: "Decide tu siguiente paso",
      text: "Útil si estás por cambiar de empleo, buscas un ascenso o quieres orientar tu carrera con algo más que una corazonada.",
    },
    {
      title: "Tus resultados son tuyos",
      text: "Nadie más los ve. Recibes tu código, contestas desde donde estés y tu informe llega en 72 horas.",
    },
  ],
};

const RESPALDO = [
  { etiqueta: "Instrumentos en la batería", valor: "5" },
  { etiqueta: "Entrega del informe", valor: "72 h" },
  { etiqueta: "Aplicación", valor: "En línea" },
  { etiqueta: "Estudio socioeconómico", valor: "Con visita" },
  { etiqueta: "Resultados", valor: "Confidenciales" },
];

/* ------------------------------------------------------------ utilidades */

function useWebGL() {
  const [hay, setHay] = useState<boolean | null>(null);
  useEffect(() => {
    try {
      const c = document.createElement("canvas");
      setHay(Boolean(c.getContext("webgl2") || c.getContext("webgl")));
    } catch {
      setHay(false);
    }
  }, []);
  return hay;
}

/** ¿Pantalla de teléfono? Ahí el titular y el manifiesto se acomodan distinto. */
function useMovil() {
  const [movil, setMovil] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const cambiar = () => setMovil(mq.matches);
    cambiar();
    mq.addEventListener("change", cambiar);
    return () => mq.removeEventListener("change", cambiar);
  }, []);
  return movil;
}

/** ¿Está el nodo (o cerca de estarlo) en pantalla? Para pausar los lienzos. */
function useEnPantalla(ref: RefObject<HTMLElement | null>, margen = "200px") {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const nodo = ref.current;
    if (!nodo || !("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: margen });
    io.observe(nodo);
    return () => io.disconnect();
  }, [ref, margen]);
  return visible;
}

/* --------------------------------------------------------------- piezas */

/** Pastilla amarilla que acompaña al cursor sobre las zonas que la piden. */
function PildoraCursor({ raiz }: { raiz: RefObject<HTMLElement | null> }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const zona = raiz.current;
    const p = ref.current;
    if (!zona || !p) return;
    const mover = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const destino = (e.target as HTMLElement).closest<HTMLElement>("[data-pildora]");
      if (!destino) {
        p.dataset.on = "no";
        return;
      }
      if (p.textContent !== destino.dataset.pildora) p.textContent = destino.dataset.pildora ?? "";
      p.dataset.on = "si";
      p.style.transform = `translate3d(${e.clientX + 16}px, ${e.clientY + 14}px, 0)`;
    };
    const salir = () => {
      p.dataset.on = "no";
    };
    zona.addEventListener("pointermove", mover);
    zona.addEventListener("pointerleave", salir);
    return () => {
      zona.removeEventListener("pointermove", mover);
      zona.removeEventListener("pointerleave", salir);
    };
  }, [raiz]);
  return <div ref={ref} className={s.pildoraCursor} data-on="no" aria-hidden />;
}

/** Pantalla de entrada: breve, y solo la primera vez en la sesión. */
function Cargador({ listo }: { listo: boolean }) {
  const [fase, setFase] = useState<"visible" | "saliendo" | "fuera">("visible");
  const cifra = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let visto = false;
    try {
      visto = sessionStorage.getItem("psico-portada") === "1";
      sessionStorage.setItem("psico-portada", "1");
    } catch {
      /* sin almacenamiento: se muestra igual */
    }
    if (visto || menosMovimiento()) setFase("fuera");
  }, []);

  useEffect(() => {
    if (fase !== "visible") return;
    const contador = { v: 0 };
    const anim = animate(contador, {
      v: 100,
      duration: 1500,
      ease: "inOut(2)",
      onUpdate: () => {
        if (cifra.current) cifra.current.textContent = String(Math.round(contador.v)).padStart(2, "0");
      },
    });
    // Nunca más de 3 s: si la escena tarda, la página ya se puede leer.
    const tope = window.setTimeout(() => setFase("saliendo"), 3000);
    return () => {
      anim.pause();
      window.clearTimeout(tope);
    };
  }, [fase]);

  useEffect(() => {
    if (!listo || fase !== "visible") return;
    const t = window.setTimeout(() => setFase("saliendo"), 1300);
    return () => window.clearTimeout(t);
  }, [listo, fase]);

  useEffect(() => {
    if (fase !== "saliendo") return;
    const t = window.setTimeout(() => setFase("fuera"), 700);
    return () => window.clearTimeout(t);
  }, [fase]);

  if (fase === "fuera") return null;
  return (
    <div className={s.cargador} data-fase={fase} aria-hidden>
      <div className={s.cargadorFila}>
        <span>Psicología Aplicada</span>
        <span className={s.cargadorDescriptor}>Evaluación psicológica · Selección de personal</span>
        <span className={s.cargadorCifra}>
          <span ref={cifra}>00</span>%
        </span>
      </div>
      <span className={s.cargadorPildora}>Preparando — el aula</span>
    </div>
  );
}

/** Encabezado mínimo; cambia de tinta sobre las secciones oscuras. */
function Cabecera() {
  const [oscuro, setOscuro] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [bajo, setBajo] = useState(false);

  // Lejos de la portada, la cabecera toma un fondo translúcido para no
  // montarse sobre el texto.
  useEffect(() => {
    const revisar = () => setBajo(window.scrollY > window.innerHeight * 0.85);
    revisar();
    window.addEventListener("scroll", revisar, { passive: true });
    return () => window.removeEventListener("scroll", revisar);
  }, []);

  // Observa una franja delgada en lo alto de la ventana: si una sección
  // oscura la cruza, la cabecera cambia a tinta clara.
  useEffect(() => {
    const oscuras = document.querySelectorAll<HTMLElement>('[data-tono="oscuro"]');
    if (!oscuras.length || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) setOscuro(e.isIntersecting);
      },
      { rootMargin: "-30px 0px -94% 0px" },
    );
    oscuras.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  return (
    <header className={s.cabecera} data-tono={oscuro ? "oscuro" : "claro"} data-abierto={abierto} data-bajo={bajo}>
      <a href="#acceso" className={s.marca} onClick={() => setAbierto(false)}>
        Psicología Aplicada
      </a>
      <span className={s.descriptor}>Evaluación psicológica · Selección de personal</span>
      <nav className={s.nav} aria-label="Principal" id="menu-psico">
        {NAV.map((n) => (
          <a key={n.href} href={n.href} onClick={() => setAbierto(false)}>
            {n.label}
          </a>
        ))}
      </nav>
      <a className={s.pildoraCodigo} href={evaluacion.acceso}>
        <KeyRound size={13} aria-hidden />
        Tengo un código
      </a>
      <button
        type="button"
        className={s.botonMenu}
        aria-expanded={abierto}
        aria-controls="menu-psico"
        onClick={() => setAbierto((a) => !a)}
      >
        {abierto ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
        <span className={s.oculto}>{abierto ? "Cerrar menú" : "Abrir menú"}</span>
      </button>
    </header>
  );
}

/**
 * Titular gigante que alterna frases: las líneas suben y se esconden tras su
 * máscara, cambia el texto y entran de nuevo.
 */
function TitularGigante({ frases }: { frases: string[][] }) {
  const caja = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const visible = useEnPantalla(caja, "0px");
  const entro = useRef(false);
  const movil = useMovil();

  // En el teléfono cada renglón crece hasta llenar el ancho: centrado y a un
  // solo tamaño, el titular se perdía en medio de la pantalla.
  useLayoutEffect(() => {
    const nodo = caja.current;
    if (!nodo) return;
    const mascaras = Array.from(nodo.querySelectorAll<HTMLElement>("[data-mascara]"));
    if (!movil) {
      mascaras.forEach((m) => (m.style.fontSize = ""));
      return;
    }
    const medir = () => {
      // Primero todos a su tamaño base: si no, los renglones grandes de la
      // frase anterior ensanchan la caja y la medida se retroalimenta.
      mascaras.forEach((m) => (m.style.fontSize = ""));
      const ancho = nodo.clientWidth;
      mascaras.forEach((m) => {
        const linea = m.firstElementChild as HTMLElement | null;
        if (!linea?.offsetWidth) return;
        const base = parseFloat(getComputedStyle(m).fontSize);
        m.style.fontSize = `${Math.min((base * ancho * 0.97) / linea.offsetWidth, base * 2.6)}px`;
      });
    };
    medir();
    document.fonts?.ready.then(medir);
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, [i, movil]);

  // Entrada la primera vez que se ve.
  useEffect(() => {
    const nodo = caja.current;
    if (!nodo || !visible || entro.current || menosMovimiento()) return;
    entro.current = true;
    animate(nodo.querySelectorAll("[data-linea]"), {
      translateY: ["105%", "0%"],
      duration: 900,
      delay: stagger(90),
      ease: "out(4)",
    });
  }, [visible]);

  // Alterna mientras esté a la vista.
  useEffect(() => {
    const nodo = caja.current;
    if (!nodo || !visible || frases.length < 2 || menosMovimiento()) return;
    const intervalo = window.setInterval(() => {
      animate(nodo.querySelectorAll("[data-linea]"), {
        translateY: ["0%", "-105%"],
        duration: 520,
        delay: stagger(60),
        ease: "in(3)",
        onComplete: () => {
          setI((n) => (n + 1) % frases.length);
          requestAnimationFrame(() => {
            animate(nodo.querySelectorAll("[data-linea]"), {
              translateY: ["105%", "0%"],
              duration: 760,
              delay: stagger(70),
              ease: "out(4)",
            });
          });
        },
      });
    }, 4200);
    return () => window.clearInterval(intervalo);
  }, [visible, frases.length]);

  return (
    <div ref={caja} className={s.titular}>
      <h2 className={s.oculto}>{frases.map((f) => f.join(" ")).join(". ")}</h2>
      <p className={s.titularLineas} aria-hidden>
        {frases[i].map((linea, k) => (
          <span key={k} className={s.mascara} data-mascara>
            <span className={s.linea} data-linea>
              {linea}
            </span>
          </span>
        ))}
      </p>
    </div>
  );
}

/** Pista horizontal: arrastre con inercia en escritorio, scroll nativo en táctil. */
function Carrusel({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  const pista = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = pista.current;
    if (!el) return;
    let arrastrando = false;
    let movido = false;
    let x0 = 0;
    let scroll0 = 0;
    let ultimoX = 0;
    let ultimoT = 0;
    let velocidad = 0;
    let inercia = 0;

    const abajo = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      cancelAnimationFrame(inercia);
      arrastrando = true;
      movido = false;
      x0 = ultimoX = e.clientX;
      ultimoT = performance.now();
      scroll0 = el.scrollLeft;
      velocidad = 0;
      el.dataset.arrastre = "si";
      e.preventDefault();
    };
    const mover = (e: PointerEvent) => {
      if (!arrastrando) return;
      const dx = e.clientX - x0;
      if (Math.abs(dx) > 4) movido = true;
      el.scrollLeft = scroll0 - dx;
      const ahora = performance.now();
      velocidad = (e.clientX - ultimoX) / Math.max(1, ahora - ultimoT);
      ultimoX = e.clientX;
      ultimoT = ahora;
    };
    const arriba = () => {
      if (!arrastrando) return;
      arrastrando = false;
      let v = velocidad * 16;
      const paso = () => {
        el.scrollLeft -= v;
        v *= 0.93;
        if (Math.abs(v) > 0.4) inercia = requestAnimationFrame(paso);
        else delete el.dataset.arrastre;
      };
      inercia = requestAnimationFrame(paso);
    };
    const clic = (e: MouseEvent) => {
      if (movido) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    el.addEventListener("pointerdown", abajo);
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", arriba);
    el.addEventListener("click", clic, true);
    return () => {
      cancelAnimationFrame(inercia);
      el.removeEventListener("pointerdown", abajo);
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", arriba);
      el.removeEventListener("click", clic, true);
    };
  }, []);

  return (
    <div ref={pista} className={s.pista} role="region" aria-label={etiqueta} tabIndex={0} data-pildora="Arrastra">
      {children}
    </div>
  );
}

/* ------------------------------------------------------------ secciones */

/** Interruptor de público. Se repite en la portada y en el cotizador. */
function Interruptor({
  publico,
  onCambiar,
  etiqueta,
}: {
  publico: Publico | null;
  onCambiar: (p: Publico) => void;
  etiqueta: string;
}) {
  return (
    <div className={s.interruptor} role="group" aria-label={etiqueta}>
      <button type="button" aria-pressed={publico === "empresas"} onClick={() => onCambiar("empresas")}>
        <Building2 size={14} aria-hidden /> Para tu empresa
      </button>
      <button type="button" aria-pressed={publico === "personas"} onClick={() => onCambiar("personas")}>
        <User size={14} aria-hidden /> Para ti
      </button>
    </div>
  );
}

function Portada({
  content,
  publico,
  onCambiar,
  onListo,
}: {
  content: ChannelPageContent;
  publico: Publico | null;
  onCambiar: (p: Publico) => void;
  onListo: () => void;
}) {
  const zona = useRef<HTMLElement>(null);
  const webgl = useWebGL();
  const visible = useEnPantalla(zona, "0px");
  const [ligera, setLigera] = useState(false);
  const [estatica, setEstatica] = useState(false);
  const texto = useAparicion<HTMLDivElement>({ inmediato: true, y: 18, retraso: 300 });

  useEffect(() => {
    setLigera(window.matchMedia("(max-width: 760px)").matches || (navigator.hardwareConcurrency ?? 8) <= 4);
    setEstatica(menosMovimiento());
  }, []);

  useEffect(() => {
    if (webgl === false) onListo();
  }, [webgl, onListo]);

  return (
    <section id="acceso" ref={zona} className={s.portada} aria-label="Inicio">
      <div className={s.escena}>
        {webgl ? (
          <EscenaConsultorio
            activa={visible}
            ligera={ligera}
            quieta={estatica}
            enfoque={publico}
            onElegir={onCambiar}
            claseRotulo={s.rotulo}
            onListo={onListo}
          />
        ) : webgl === false ? (
          <div className={s.escenaRespaldo} aria-hidden>
            Ψ
          </div>
        ) : null}
      </div>

      <a className={s.pildoraGirada} href={evaluacion.acceso} data-oculta={publico ? "" : undefined}>
        Entra <span aria-hidden>—</span> con tu código
      </a>

      <div className={s.portadaTexto} ref={texto}>
        <Interruptor publico={publico} onCambiar={onCambiar} etiqueta="¿Para quién es la evaluación?" />
        <h1 key={publico ?? "ambos"} className={s.portadaTitular}>
          {publico ? PORTADA[publico].titular : content.hero.headline}
        </h1>
        <div className={s.portadaAcciones}>
          {publico && (
            <a href="#bateria" className={s.portadaAccion}>
              {PORTADA[publico].accion} <ArrowRight size={15} aria-hidden />
            </a>
          )}
          <a href="#manifiesto" className={s.desliza}>
            <ArrowDown size={13} aria-hidden /> Desliza
          </a>
        </div>
      </div>

      <p className={s.portadaPie}>
        Selección de personal
        <br />
        Evaluación individual
        <br />
        Informe en 72 h
      </p>
    </section>
  );
}

function Manifiesto() {
  return (
    <section id="manifiesto" className={s.manifiesto}>
      <div className={s.esquinas}>
        <p>
          Para empresas que contratan
          <br />
          y personas que quieren conocerse
        </p>
        <span className={s.asterisco} aria-hidden>
          *
        </span>
        <p className={s.derecha}>
          Instrumentos interpretados
          <br />
          por psicólogos
          <br />
          <span className={s.tenue}>Respaldo: Sociedad de Psicología Aplicada A.C.</span>
        </p>
      </div>

      <TitularGigante frases={MANIFIESTO} />

      {/* Sólo en el teléfono: la cinta de instrumentos y tres datos llenan lo que en escritorio es aire. */}
      <div className={s.cinta} aria-hidden>
        <div className={s.cintaPista}>
          {[0, 1].map((vuelta) => (
            <span key={vuelta} className={s.cintaLista}>
              {PRUEBAS.map((p) => (
                <span key={p.id}>
                  {p.nombre}
                  <span className={s.cintaAsterisco}>*</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <dl className={s.manifiestoDatos}>
        {RESPALDO.slice(0, 3).map((r) => (
          <div key={r.etiqueta}>
            <dt>{r.etiqueta}</dt>
            <dd>{r.valor}</dd>
          </div>
        ))}
      </dl>

      <p className={s.nota}>En línea, desde donde estés · Informe en 72 h</p>
    </section>
  );
}

function Saludo({ content, onCambiar }: { content: ChannelPageContent; onCambiar: (p: Publico) => void }) {
  const izquierda = useAparicion<HTMLDivElement>({ y: 26 });
  const derecha = useAparicion<HTMLDivElement>({ y: 26, retraso: 140 });

  return (
    <section id="hola" className={s.saludo}>
      <div ref={izquierda} className={s.saludoTexto}>
        <p className={s.saludoGrande}>
          <em>Hola,</em>
          <br />
          {content.hero.lead}
        </p>
        <div className={s.saludoNota}>
          <span className={s.asterisco} aria-hidden>
            *
          </span>
          <div>
            <p>
              Somos un equipo de psicólogos dedicado a la evaluación y el desarrollo organizacional. Aplicamos
              instrumentos que se leen juntos y te entregamos una recomendación por escrito que se puede explicar.
            </p>
            <p>
              Atendemos a empresas que necesitan elegir bien y a personas que quieren conocerse para decidir su
              siguiente paso. Si traes un código, entra directo.
            </p>
          </div>
        </div>
      </div>

      <div ref={derecha} className={s.puertas}>
        <a href="#bateria" className={s.puerta} data-tono="verde" onClick={() => onCambiar("empresas")}>
          <span className={s.puertaEtiqueta}>
            <Building2 size={14} aria-hidden /> Para tu empresa
          </span>
          <strong>Necesito evaluar candidatos</strong>
          <span className={s.puertaTexto}>
            Eliges los instrumentos, te damos los códigos y recibes el informe interpretado en 72 horas.
          </span>
          <span className={s.puertaAccion}>
            Armar mi evaluación <ArrowRight size={16} aria-hidden />
          </span>
        </a>
        <a href="#bateria" className={s.puerta} data-tono="lavanda" onClick={() => onCambiar("personas")}>
          <span className={s.puertaEtiqueta}>
            <User size={14} aria-hidden /> Para ti
          </span>
          <strong>Quiero conocerme</strong>
          <span className={s.puertaTexto}>
            Tu perfil psicológico completo, interpretado por un psicólogo, para decidir tu siguiente paso.
          </span>
          <span className={s.puertaAccion}>
            Armar mi evaluación personal <ArrowRight size={16} aria-hidden />
          </span>
        </a>
        <a href={evaluacion.acceso} className={s.puerta} data-tono="amarillo">
          <span className={s.puertaEtiqueta}>
            <KeyRound size={14} aria-hidden /> Traigo un código
          </span>
          <strong>Vengo a presentar mi evaluación</strong>
          <span className={s.puertaTexto}>Entras con el código que te enviaron. Sin cuenta, y puedes pausar y retomar.</span>
          <span className={s.puertaAccion}>
            Entrar con mi código <ArrowRight size={16} aria-hidden />
          </span>
        </a>
      </div>
    </section>
  );
}

function Instrumento({ prueba, n }: { prueba: (typeof PRUEBAS)[number]; n: number }) {
  const p = PRESENTACION[prueba.id];
  const ficha = useAparicion<HTMLDivElement>({ y: 20 });
  if (!p) return null;
  const numero = String(n).padStart(2, "0");

  return (
    <article className={s.obra} aria-labelledby={`obra-${prueba.id}`}>
      <Carrusel etiqueta={`${prueba.nombre}: vistas`}>
        <div className={s.diapo} style={{ background: p.fondo, color: p.tinta }}>
          <div className={s.diapoCabeza}>
            <span>{numero} — Instrumento</span>
            <span>~{prueba.minutos} min</span>
          </div>
          <svg className={s.diapoArte} viewBox="0 0 200 200" aria-hidden>
            <circle cx="140" cy="70" r="58" fill="currentColor" opacity="0.08" />
            <circle cx="140" cy="70" r="34" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.35" />
            <circle cx="92" cy="128" r="22" fill="currentColor" opacity="0.12" />
            <path d="M40 170 Q100 110 170 160" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.4" />
          </svg>
          <p className={s.diapoNombre}>{prueba.nombre}</p>
          <p className={s.diapoEtiqueta}>{prueba.etiqueta}</p>
        </div>

        <div className={s.diapo} style={{ background: `color-mix(in srgb, ${p.fondo} 55%, #fbf8f2)` }}>
          <div className={s.telefono} style={{ color: p.tinta }}>
            <div className={s.telefonoBarra}>
              <span>Psicología Aplicada</span>
              <span>12 / 40</span>
            </div>
            <div className={s.telefonoProgreso}>
              <span style={{ width: "30%", background: p.tinta }} />
            </div>
            <p className={s.telefonoInstruccion}>{p.muestra.instruccion}</p>
            <ul className={s.telefonoOpciones}>
              {p.muestra.opciones.map((o, i) => (
                <li key={o} style={i === 0 ? { borderColor: p.tinta, background: p.fondo } : undefined}>
                  {o}
                </li>
              ))}
            </ul>
            <span className={s.telefonoBoton} style={{ background: p.tinta }}>
              Siguiente
            </span>
          </div>
          <p className={s.diapoPie} style={{ color: p.tinta }}>
            Así se responde · ejemplo ilustrativo
          </p>
        </div>

        <div className={s.diapo} style={{ background: p.tinta }}>
          <div className={s.hoja}>
            <p className={s.hojaMarca}>Informe · {prueba.nombre}</p>
            <p className={s.hojaTitulo}>Candidato de ejemplo</p>
            <ul className={s.hojaBarras}>
              {p.ejes.map((eje, i) => (
                <li key={eje}>
                  <span>{eje}</span>
                  <span className={s.hojaBarra}>
                    <span style={{ width: `${BARRAS[i] * 100}%`, background: p.tinta }} />
                  </span>
                </li>
              ))}
            </ul>
            <span className={s.hojaRenglon} />
            <span className={s.hojaRenglon} style={{ width: "86%" }} />
            <span className={s.hojaRenglon} style={{ width: "64%" }} />
            <p className={s.hojaFirma}>Interpretó: psicólogo responsable</p>
          </div>
          <p className={s.diapoPie} style={{ color: "#f5f2ec" }}>
            Lo que recibes
          </p>
        </div>
      </Carrusel>

      <div className={s.ficha} ref={ficha}>
        <span className={s.fichaNum}>{n}</span>
        <h3 id={`obra-${prueba.id}`} className={s.fichaNombre}>
          {prueba.nombre} <span>{prueba.etiqueta}</span>
        </h3>
        <span>~{prueba.minutos} min</span>
        <span>
          <span className={s.tenue}>Para</span>
          <br />
          {p.para}
        </span>
        <span>
          <span className={s.tenue}>Entrega</span>
          <br />
          {p.entrega}
        </span>
        <a className={s.fichaEnlace} href="#bateria">
          {prueba.precio == null ? "Cotizar" : "Agregar a mi evaluación"} <ArrowUpRight size={13} aria-hidden />
        </a>
      </div>
    </article>
  );
}

function Instrumentos() {
  const cabeza = useAparicion<HTMLDivElement>({ y: 20 });
  return (
    <section id="instrumentos" className={s.instrumentos}>
      <div className={s.seccionCabeza} ref={cabeza}>
        <h2>
          Instrumentos <span className={s.cuenta}>({PRUEBAS.length})</span>
        </h2>
        <p>
          Cada uno responde una pregunta distinta sobre la persona, sea un candidato o tú mismo. Arrastra para ver
          qué se contesta y qué se recibe.
        </p>
      </div>
      {PRUEBAS.map((p, i) => (
        <Instrumento key={p.id} prueba={p} n={i + 1} />
      ))}
    </section>
  );
}

function Brecha() {
  const texto = useAparicion<HTMLDivElement>({ y: 24 });
  const obra = useAparicion<HTMLDivElement>({ y: 24, retraso: 120 });
  return (
    <section id="brecha" className={s.brecha}>
      <div ref={texto}>
        <p className={s.eyebrow}>Por qué se leen juntos</p>
        <h2 className={s.brechaTitulo}>Un instrumento solo no decide nada</h2>
        <p>
          Lo que importa es la distancia entre lo que el puesto exige y lo que la persona ofrece. Esa brecha es la que
          interpretamos, y la que te dice dónde va a necesitar apoyo desde el primer mes.
        </p>
        <p>Cambia de candidato y mira cómo se mueve el perfil contra el mismo puesto.</p>
      </div>
      <div ref={obra} className={s.brechaObra}>
        <RadarVivo />
      </div>
    </section>
  );
}

function ComoTrabajamos({ content }: { content: ChannelPageContent }) {
  const [abierto, setAbierto] = useState<string | null>(null);
  const cabeza = useAparicion<HTMLDivElement>({ y: 20 });
  let n = 0;

  return (
    <section id="como-funciona" className={s.archivo}>
      <div className={s.seccionCabeza} ref={cabeza}>
        <h2>Cómo trabajamos</h2>
        <p>Servicios para empresas, el proceso, lo que se verifica en campo y lo que ofrecemos a personas. Toca una fila para leerla completa.</p>
      </div>

      {[...content.sections, PARA_PERSONAS].map((sec) => (
        <div key={sec.id} id={sec.id} className={s.grupo}>
          <div className={s.grupoCabeza}>
            <span>{sec.eyebrow ?? sec.title}</span>
            <span className={s.tenue}>{sec.title}</span>
          </div>
          <ul className={s.filas}>
            {(sec.items ?? []).map((item) => {
              n += 1;
              const clave = `${sec.id}-${item.title}`;
              const esta = abierto === clave;
              return (
                <li key={clave} className={s.fila} data-abierta={esta}>
                  <button
                    type="button"
                    className={s.filaBoton}
                    aria-expanded={esta}
                    onClick={() => setAbierto(esta ? null : clave)}
                    data-pildora={esta ? "Cerrar" : "Leer más"}
                  >
                    <span className={s.filaNum}>{n}</span>
                    <span className={s.filaTitulo}>{item.title}</span>
                    <span className={s.filaSeccion}>{sec.eyebrow}</span>
                    <ChevronDown size={16} className={s.filaChevron} aria-hidden />
                  </button>
                  <div className={s.filaCuerpo} hidden={!esta}>
                    <p>{item.text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}

function Cotizar({ publico, onCambiar }: { publico: Publico | null; onCambiar: (p: Publico) => void }) {
  const cabeza = useAparicion<HTMLDivElement>({ y: 20 });
  const personal = publico === "personas";
  return (
    <section id="bateria" className={s.cotizar}>
      <div className={s.seccionCabeza} ref={cabeza}>
        <div>
          <h2>{personal ? "Arma tu evaluación personal" : "Arma tu evaluación"}</h2>
          <Interruptor publico={publico ?? "empresas"} onCambiar={onCambiar} etiqueta="¿Para quién es la evaluación?" />
        </div>
        <p>
          {personal
            ? "Marca los instrumentos que quieres responder y el precio se arma solo. Respondes en línea y tu informe llega en 72 horas."
            : "Marca los instrumentos que necesitas, dinos a cuántas personas evalúas y el precio se arma solo. El estudio socioeconómico se cotiza aparte."}
        </p>
      </div>
      <Cotizador modo={personal ? "persona" : "empresa"} />
    </section>
  );
}

/** Bloque de barro en línea, como los del aula: gira despacio entre palabras. */
function BloqueEnLinea({ color }: { color: string }) {
  return <span className={s.enLinea} style={{ background: color }} aria-hidden />;
}

function Nosotros() {
  const intro = useAparicion<HTMLParagraphElement>({ y: 18 });
  const lineas = useRef<HTMLDivElement>(null);
  const pie = useAparicion<HTMLDivElement>({ y: 24 });
  const visible = useEnPantalla(lineas, "-15% 0px");

  useEffect(() => {
    const nodo = lineas.current;
    if (!nodo || !visible || menosMovimiento() || nodo.dataset.entro) return;
    nodo.dataset.entro = "1";
    animate(nodo.querySelectorAll("[data-linea]"), {
      translateY: ["105%", "0%"],
      duration: 900,
      delay: stagger(110),
      ease: "out(4)",
    });
  }, [visible]);

  return (
    <section id="nosotros" className={s.nosotros} data-tono="oscuro">
      <p className={s.nosotrosIntro} ref={intro}>
        Detrás de cada informe hay un psicólogo que lo interpreta, lo firma y te lo puede explicar.
      </p>

      <div className={s.nosotrosCuerpo}>
        <p className={s.nosotrosAparte}>Más allá de un puntaje: leemos a la persona completa.</p>
        <div className={s.nosotrosLineas} ref={lineas}>
          <h2 className={s.oculto}>Evaluamos con método. Interpretamos con criterio. Cuidamos cada dato.</h2>
          <p aria-hidden>
            {[
              <>
                Evaluamos <BloqueEnLinea color="#bba8da" />
              </>,
              <>con método.</>,
              <>Interpretamos</>,
              <>
                con <BloqueEnLinea color="#f2d64b" /> criterio.
              </>,
              <>
                Cuidamos <BloqueEnLinea color="#f2b7a0" />
              </>,
              <>cada dato.</>,
            ].map((linea, i) => (
              <span key={i} className={s.mascara}>
                <span className={s.linea} data-linea>
                  {linea}
                </span>
              </span>
            ))}
          </p>
        </div>
      </div>

      <div className={s.nosotrosPie} ref={pie}>
        <div className={s.sello}>
          <SelloSociedad className={s.selloArte} />
          <p>
            <strong>Sociedad de Psicología Aplicada A.C.</strong>
            <br />
            Instrumentos y criterios de interpretación respaldados.
          </p>
        </div>
        <dl className={s.respaldo}>
          <div className={s.respaldoCabeza}>
            <dt>Lo que respalda cada evaluación</dt>
            <dd>({RESPALDO.length})</dd>
          </div>
          {RESPALDO.map((r) => (
            <div key={r.etiqueta}>
              <dt>{r.etiqueta}</dt>
              <dd>{r.valor}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function Cierre({ channel }: { channel: ChannelDef }) {
  return (
    <section id="contacto" className={s.cierre}>
      <TitularGigante frases={CIERRE} />

      <div className={s.cierreAcciones}>
        <a
          className={s.botonPrincipal}
          href={whatsapp("Hola, me interesa una evaluación psicológica.")}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle size={17} aria-hidden />
          Escribir por WhatsApp
        </a>
        <a className={s.botonSecundario} href={mailto("Solicito una evaluación de personal")}>
          {CONTACTO.email}
        </a>
        <a className={s.botonSecundario} href={tel()}>
          {CONTACTO.phoneDisplay}
        </a>
      </div>
      <p className={s.nota}>
        ¿Ya traes un código? <a href={evaluacion.acceso}>Entra directo a tu evaluación</a>
      </p>

      <footer className={s.pie}>
        <span>{channel.legalName}</span>
        <span className={s.pieEnlaces}>
          <a href={whatsapp("Hola")} target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>
          <span aria-hidden>•</span>
          <a href={mailto("Contacto")}>{CONTACTO.email}</a>
          <span aria-hidden>•</span>
          <a href={tel()}>{CONTACTO.phoneDisplay}</a>
        </span>
        <span>© {new Date().getFullYear()}</span>
      </footer>

    </section>
  );
}

/* ---------------------------------------------------------------- página */

export function PsicologiaLanding({ channel, content }: { channel: ChannelDef; content: ChannelPageContent }) {
  const raiz = useRef<HTMLDivElement>(null);
  const [escenaLista, setEscenaLista] = useState(false);
  // Sin elegir, la portada habla a los dos y la cámara muestra el cuarto entero.
  const [publico, setPublico] = useState<Publico | null>(null);
  const alListo = useRef(() => setEscenaLista(true)).current;

  // Desplazamiento suave; quien pidió menos movimiento conserva el nativo.
  useEffect(() => {
    if (menosMovimiento()) return;
    const lenis = new Lenis({ autoRaf: true, anchors: { offset: -64 }, lerp: 0.11 });
    return () => lenis.destroy();
  }, []);

  return (
    <div className={s.pagina} ref={raiz}>
      <Cargador listo={escenaLista} />
      <Cabecera />
      <PildoraCursor raiz={raiz} />
      <Portada content={content} publico={publico} onCambiar={setPublico} onListo={alListo} />
      <Manifiesto />
      <Saludo content={content} onCambiar={setPublico} />
      <Instrumentos />
      <Brecha />
      <ComoTrabajamos content={content} />
      <Cotizar publico={publico} onCambiar={setPublico} />
      <Nosotros />
      <Cierre channel={channel} />
    </div>
  );
}
