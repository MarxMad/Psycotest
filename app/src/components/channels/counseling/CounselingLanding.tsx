"use client";

/* eslint-disable @next/next/no-img-element */

import dynamic from "next/dynamic";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  Copy,
  FileCheck2,
  Gavel,
  MessageCircle,
  Phone,
  Scale,
  ScrollText,
} from "lucide-react";
import type { ChannelPageContent } from "@/lib/channel-content";
import { channelPublicUrl, type ChannelId } from "@/lib/channels";
import { CONTACTO, mailto, tel, whatsapp } from "@/lib/contacto";
import { menosMovimiento, useAparicion, useAparicionLista } from "@/lib/aparicion";
import { Suave } from "../ige/Marco";
import type { EstadoPortada } from "./Piramide3D";
import s from "./counseling.module.css";

const Piramide3D = dynamic(() => import("./Piramide3D"), { ssr: false });

/*
 * counseling.mx — la práctica de Martín Hernández.
 *
 * La portada es una sola transformación: el nombre gigante con el triángulo
 * del logo en 3D entre las dos palabras; al bajar, el triángulo crece al
 * centro, se abre en sus tres franjas y deja ver la frase de la práctica
 * mientras la noche se vuelve papel. Lo demás se cuenta con scroll: frases
 * que se encienden palabra por palabra, tiras de fotos que corren, una cita
 * sobre video que se desliza en dos sentidos.
 */

const OFICIOS = ["Consultor", "Valuador", "Certificador"] as const;

const FOTOS: Record<(typeof OFICIOS)[number], string[]> = {
  Consultor: [
    "/psico/media/equipo.webp",
    "/ceduct/escenas/formador-que-inspira-800.webp",
    "/ceduct/escenas/ec0217-800.webp",
    "/psico/media/acuerdo.webp",
    "/ceduct/escenas/coach-en-accion-800.webp",
  ],
  Valuador: [
    "/psico/media/expediente.webp",
    "/psico/media/candidata.webp",
    "/psico/media/reflexion.webp",
    "/psico/media/entrevista.webp",
    "/ceduct/escenas/ec0204-800.webp",
  ],
  Certificador: [
    "/ceduct/escenas/ec0105-800.webp",
    "/ceduct/escenas/ec0336-800.webp",
    "/ceduct/escenas/ec0366-800.webp",
    "/ceduct/escenas/ec0045-800.webp",
    "/ceduct/escenas/ec0722-800.webp",
  ],
};

const TONO_OFICIO = ["oro", "cielo", "azul"] as const;

const ENTREGABLES = [
  {
    icono: Scale,
    titulo: "Dictamen de valuación",
    texto: "Un número defendible frente a terceros, con la metodología a la vista y los criterios escritos.",
  },
  {
    icono: ScrollText,
    titulo: "Informe de diagnóstico",
    texto: "Qué se atora en la organización, dónde y con qué prioridad. Sin adjetivos que no se puedan sostener.",
  },
  {
    icono: FileCheck2,
    titulo: "Certificado de competencia",
    texto: "Acreditación oficial contra estándar reconocido, con la CLAVE a nombre de la persona.",
  },
  {
    icono: Gavel,
    titulo: "Propuesta de alcance cerrado",
    texto: "Objetivos, duración y costo definidos antes de empezar. Lo que se firma es lo que se cobra.",
  },
] as const;

/** Organizado por lo que la persona necesita; la marca aparece como respuesta. */
const NECESIDADES: {
  necesidad: string;
  acento: string;
  marca: string;
  que: string;
  canal: ChannelId | null;
  tono: string;
}[] = [
  {
    necesidad: "Quiero certificar lo que",
    acento: "ya sé hacer",
    marca: "CEDUCT",
    que: "Certificaciones SEP-CONOCER con validez oficial y diplomados de 104 horas.",
    canal: "ceduct",
    tono: "#c9a227",
  },
  {
    necesidad: "Necesito evaluar a",
    acento: "quién contrato",
    marca: "Psicología Aplicada",
    que: "Pruebas psicométricas en línea, estudio socioeconómico e informe de un psicólogo en 24 h.",
    canal: "psicologia",
    tono: "#d8342a",
  },
  {
    necesidad: "Quiero que mi equipo",
    acento: "trabaje mejor",
    marca: "Ingeniería de Grupos Efectivos",
    que: "Cursos en línea y en vivo, talleres y consultoría para equipos de trabajo.",
    canal: "ige",
    tono: "#5fa0c8",
  },
  {
    necesidad: "Necesito un dictamen o un",
    acento: "diagnóstico",
    marca: "Martín Hernández",
    que: "Valuación con dictamen técnico y diagnóstico organizacional, de alcance cerrado.",
    canal: null,
    tono: "#d4a24c",
  },
];

const AGENDAR = whatsapp("Hola Martín, me gustaría agendar una conversación.");

const lim = (x: number) => Math.min(1, Math.max(0, x));

/**
 * Progreso del scroll dentro de un bloque, escrito como `--q` en el propio
 * nodo. «fijo»: bloque alto con su contenido pegado (0 al entrar, 1 al salir
 * del tramo fijo). «paso»: de que asoma abajo a que se va arriba.
 */
function useProgreso<T extends HTMLElement>(
  modo: "fijo" | "paso" | "llega",
  alCambiar?: (q: number) => void,
) {
  const ref = useRef<T>(null);
  const aviso = useRef(alCambiar);
  aviso.current = alCambiar;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cuadro = 0;
    const leer = () => {
      cuadro = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // «llega»: 0 al asomar, 1 cuando ya se ve entero (para el pie).
      const q =
        modo === "fijo"
          ? lim(-r.top / Math.max(1, el.offsetHeight - vh))
          : modo === "llega"
            ? lim((vh - r.top) / Math.max(1, Math.min(el.offsetHeight, vh)))
            : lim((vh - r.top) / (el.offsetHeight + vh));
      el.style.setProperty("--q", q.toFixed(4));
      aviso.current?.(q);
    };
    const pedir = () => {
      if (!cuadro) cuadro = requestAnimationFrame(leer);
    };
    leer();
    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir);
    return () => {
      cancelAnimationFrame(cuadro);
      window.removeEventListener("scroll", pedir);
      window.removeEventListener("resize", pedir);
    };
  }, [modo]);

  return ref;
}

/** El triángulo plano, para el encabezado, el pie y mientras carga la escena 3D. */
export function Triangulo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 104" aria-hidden>
      <clipPath id="tri-counseling">
        <path d="M60 0 L120 104 H0 Z" />
      </clipPath>
      <g clipPath="url(#tri-counseling)">
        <rect y="0" width="120" height="33" fill="#d4a24c" />
        <rect y="40" width="120" height="25" fill="#5fa0c8" />
        <rect y="72" width="120" height="32" fill="#2b86b3" />
      </g>
    </svg>
  );
}

/** Letras que suben al cargar, una tras otra. */
function Letras({ texto, desde = 0 }: { texto: string; desde?: number }) {
  return (
    <span className={s.letras} aria-label={texto}>
      {Array.from(texto).map((l, i) => (
        <span key={i} aria-hidden style={{ ["--i" as string]: desde + i }}>
          {l}
        </span>
      ))}
    </span>
  );
}

// ------------------------------------------------------------------ cabecera

function Cabecera({ claro }: { claro: boolean }) {
  return (
    <header className={s.cabecera} data-claro={claro}>
      <a href="#inicio" className={s.marca} aria-label="Martín Hernández, inicio">
        <Triangulo className={s.marcaTri} />
        <span>
          Martín <b>Hernández</b>
        </span>
      </a>
      <nav className={s.nav} aria-label="Principal">
        <a href="#oficios">Oficios</a>
        <a href="#resolver">Qué resuelvo</a>
        <a href="#metodo">Método</a>
        <a href="#contacto">Contacto</a>
      </nav>
      <a className={s.cabeceraCta} href={AGENDAR} target="_blank" rel="noopener noreferrer">
        Agendar <ArrowUpRight size={15} aria-hidden />
      </a>
    </header>
  );
}

// ------------------------------------------------------------------ portada

function Frase({ texto }: { texto: string }) {
  // «valor» va en píldora de oro y la última palabra en azul: la tesis.
  const palabras = texto.trim().split(/\s+/);
  return (
    <>
      {palabras.map((p, i) => {
        const ultima = i === palabras.length - 1;
        const clase = /^valor/i.test(p) ? s.pildoraOro : ultima ? s.tintaAzul : undefined;
        return (
          <Fragment key={i}>
            {clase ? <span className={clase}>{p}</span> : p}
            {ultima ? "" : " "}
          </Fragment>
        );
      })}
    </>
  );
}

function Portada({ content }: { content: ChannelPageContent }) {
  const estado = useRef<EstadoPortada>({ a: 0, b: 0, c: 0, mx: 0, my: 0 });
  const hueco = useRef<HTMLSpanElement>(null);
  const [activo, setActivo] = useState(true);
  const [listo, setListo] = useState(false);
  const [quieto, setQuieto] = useState(false);

  const zona = useProgreso<HTMLElement>("fijo", (q) => {
    const a = lim(q / 0.5);
    const b = lim((q - 0.4) / 0.4);
    const c = lim((q - 0.78) / 0.22);
    estado.current.a = a;
    estado.current.b = b;
    estado.current.c = c;
    const el = zona.current;
    if (el) {
      el.style.setProperty("--a", a.toFixed(4));
      el.style.setProperty("--b", b.toFixed(4));
      el.style.setProperty("--c", c.toFixed(4));
    }
    if (el) el.dataset.oscuro = c > 0.55 ? "false" : "true";
  });

  useEffect(() => {
    setQuieto(menosMovimiento());
    const el = zona.current;
    if (!el) return;
    const vista = new IntersectionObserver(([e]) => setActivo(e.isIntersecting));
    vista.observe(el);
    const mover = (e: PointerEvent) => {
      estado.current.mx = (e.clientX / window.innerWidth) * 2 - 1;
      estado.current.my = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", mover, { passive: true });
    return () => {
      vista.disconnect();
      window.removeEventListener("pointermove", mover);
    };
  }, [zona]);

  return (
    <section ref={zona} id="inicio" className={s.portada} data-oscuro="true" aria-label="Martín Hernández">
      <div className={s.portadaFija}>
        <video
          className={s.portadaVideo}
          src="/media/hero-bg.mp4"
          poster="/media/hero-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden
        />
        <div className={s.portadaVelo} aria-hidden />
        <div className={s.cortina} aria-hidden />

        <p className={s.revelado}>
          <span className={s.reveladoEyebrow}>Consultoría · Valuación · Certificación</span>
          <Frase texto={content.hero.headline} />
        </p>

        <div className={s.lienzo} aria-hidden>
          <Piramide3D estado={estado} hueco={hueco} activo={activo} quieto={quieto} alListo={() => setListo(true)} />
        </div>

        <div className={s.portadaTexto}>
          <p className={s.portadaOficios}>
            {OFICIOS.map((o, i) => (
              <span key={o} style={{ ["--i" as string]: i }}>
                {o}
              </span>
            ))}
          </p>

          <h1 className={s.nombre}>
            <span className={s.nombreA}>
              <Letras texto="Martín" />
              <span ref={hueco} className={s.hueco} data-listo={listo}>
                <Triangulo className={s.huecoTri} />
              </span>
            </span>
            <span className={s.nombreB}>
              <Letras texto="Hernández" desde={4} />
            </span>
          </h1>

          <div className={s.portadaPie}>
            <p className={s.portadaLead}>
              Consultoría organizacional, valuación con dictamen técnico y certificación de competencias laborales,
              para organizaciones públicas y privadas.
            </p>
            <div className={s.portadaAcciones}>
              <a className={s.botonOro} href={AGENDAR} target="_blank" rel="noopener noreferrer">
                {content.hero.primaryCta?.label ?? "Agendar una conversación"} <ArrowUpRight size={16} aria-hidden />
              </a>
              <span className={s.desliza} aria-hidden>
                <ArrowDown size={14} /> Desliza
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ manifiesto

/** Frases que se resaltan dentro del texto de la portada. */
const RESALTES: { frase: string; clase: "pildoraOro" | "tintaAzul" | "pildoraCielo" }[] = [
  { frase: "su gente", clase: "pildoraOro" },
  { frase: "su patrimonio", clase: "tintaAzul" },
  { frase: "lo que saben hacer", clase: "pildoraCielo" },
];

/** Divide el texto en palabras, agrupando las frases resaltadas. */
function trozos(texto: string) {
  const out: { t: string; clase?: string }[] = [];
  let resto = texto;
  while (resto.length) {
    let mejor: { i: number; r: (typeof RESALTES)[number] } | null = null;
    for (const r of RESALTES) {
      const i = resto.toLowerCase().indexOf(r.frase);
      if (i >= 0 && (!mejor || i < mejor.i)) mejor = { i, r };
    }
    const antes = mejor ? resto.slice(0, mejor.i) : resto;
    antes.split(/\s+/).filter(Boolean).forEach((t) => out.push({ t }));
    if (!mejor) break;
    out.push({ t: resto.slice(mejor.i, mejor.i + mejor.r.frase.length), clase: s[mejor.r.clase] });
    resto = resto.slice(mejor.i + mejor.r.frase.length);
  }
  return out;
}

function Manifiesto({ texto }: { texto: string }) {
  const zona = useProgreso<HTMLElement>("paso");
  const piezas = trozos(texto);
  return (
    <section ref={zona} className={s.manifiesto} style={{ ["--n" as string]: piezas.length }}>
      <span className={`${s.flota} ${s.flotaA}`} aria-hidden>
        <Triangulo />
      </span>
      <span className={`${s.flota} ${s.flotaB}`} aria-hidden>
        <Triangulo />
      </span>
      <span className={`${s.esfera} ${s.esferaA}`} aria-hidden />
      <span className={`${s.esfera} ${s.esferaB}`} aria-hidden />
      <p className={s.manifiestoTexto}>
        {piezas.map((p, i) => (
          <Fragment key={i}>
            <span className={`${s.palabra} ${p.clase ?? ""}`} style={{ ["--i" as string]: i }}>
              {p.t}
            </span>{" "}
          </Fragment>
        ))}
      </p>
    </section>
  );
}

// ------------------------------------------------------------------ oficios

function Oficio({
  titulo,
  texto,
  indice,
}: {
  titulo: (typeof OFICIOS)[number];
  texto: string;
  indice: number;
}) {
  const zona = useProgreso<HTMLDivElement>("paso");
  const cabeza = useAparicion<HTMLDivElement>({ y: 30 });
  return (
    <div ref={zona} className={s.oficio} data-tono={TONO_OFICIO[indice]}>
      <div ref={cabeza} className={s.oficioCabeza}>
        <span className={s.oficioNumero}>0{indice + 1}</span>
        <h3>{titulo}</h3>
        <p>{texto}</p>
      </div>
      <div className={s.tira} aria-hidden>
        {FOTOS[titulo].map((src, i) => (
          <figure key={src} className={s.tiraFoto} style={{ ["--i" as string]: i }}>
            <img src={src} alt="" loading="lazy" />
          </figure>
        ))}
      </div>
    </div>
  );
}

function Oficios({ content }: { content: ChannelPageContent }) {
  const sec = content.sections.find((x) => x.id === "credenciales");
  const cabeza = useAparicion<HTMLDivElement>({ y: 26 });
  const items = sec?.items ?? [];
  return (
    <section id="oficios" className={s.oficios}>
      <div ref={cabeza} className={s.seccionCabeza}>
        <p className={s.eyebrow}>{sec?.eyebrow ?? "Perfil"}</p>
        <h2 className={s.titulo}>
          Ayudo a organizaciones a <span className={s.tintaOro}>decidir mejor</span> en tres frentes:
        </h2>
        {sec?.body && <p className={s.cuerpo}>{sec.body}</p>}
      </div>
      {OFICIOS.map((o, i) => (
        <Oficio key={o} titulo={o} indice={i} texto={items.find((x) => x.title === o)?.text ?? ""} />
      ))}
    </section>
  );
}

// ------------------------------------------------------------------ cita sobre video

function CitaVideo() {
  const zona = useProgreso<HTMLElement>("fijo");
  return (
    <section ref={zona} className={s.cita} data-oscuro="true" aria-label="Por qué trabajar conmigo">
      <div className={s.citaFija}>
        <video
          className={s.citaVideo}
          src="/psico/media/sesion.mp4"
          poster="/psico/media/sesion.webp"
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          aria-hidden
        />
        <div className={s.citaVelo} aria-hidden />
        <div className={s.citaUno}>
          <p className={s.citaLineaA}>Decidir bien</p>
          <p className={s.citaLineaB}>toma tiempo</p>
          <p className={s.citaSub}>y trabajar conmigo te lo ahorra.</p>
        </div>
        <div className={s.citaDos}>
          <p className={s.citaPre}>Las organizaciones trabajan conmigo por mi</p>
          <p className={s.citaGrande}>
            criterio <span>+</span> método
          </p>
          <ul>
            <li>
              <Check size={16} aria-hidden /> Primero el diagnóstico, después la propuesta.
            </li>
            <li>
              <Check size={16} aria-hidden /> Todo queda por escrito, con la metodología a la vista.
            </li>
            <li>
              <Check size={16} aria-hidden /> Alcance, duración y costo cerrados antes de empezar.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ qué resuelvo

function Resolver() {
  const cabeza = useAparicion<HTMLDivElement>({ y: 26 });
  const lista = useAparicionLista<HTMLUListElement>({ separacion: 110 });
  return (
    <section id="resolver" className={s.resolver}>
      <div ref={cabeza} className={s.seccionCabeza}>
        <p className={s.eyebrow}>Qué resuelvo</p>
        <h2 className={s.titulo}>¿Qué necesitas resolver?</h2>
      </div>
      <ul ref={lista} className={s.resolverLista}>
        {NECESIDADES.map((n) => {
          const href = n.canal ? channelPublicUrl(n.canal) : AGENDAR;
          const fuera = !n.canal || href.startsWith("http");
          return (
            <li key={n.acento}>
              <a
                href={href}
                className={s.necesidad}
                style={{ ["--tono" as string]: n.tono }}
                {...(fuera ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                <span className={s.necesidadFrase}>
                  {n.necesidad} <em>{n.acento}</em>
                </span>
                <span className={s.necesidadDetalle}>
                  <strong>{n.marca}</strong>
                  <span>{n.que}</span>
                </span>
                <span className={s.necesidadIr} aria-hidden>
                  <ArrowUpRight size={22} />
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ------------------------------------------------------------------ método

function Metodo({ content }: { content: ChannelPageContent }) {
  const sec = content.sections.find((x) => x.id === "metodo");
  const lista = useAparicionLista<HTMLOListElement>({ separacion: 90 });
  if (!sec) return null;
  return (
    <section id="metodo" className={s.metodo}>
      <div className={s.metodoFijo}>
        <p className={s.eyebrow}>{sec.eyebrow}</p>
        <h2 className={s.titulo}>{sec.title}</h2>
        {sec.body && <p className={s.cuerpo}>{sec.body}</p>}
      </div>
      <ol ref={lista} className={s.reglas}>
        {(sec.items ?? []).map((r, i) => (
          <li key={r.title}>
            <span className={s.reglaNumero}>{String(i + 1).padStart(2, "0")}</span>
            <span>
              <strong>{r.title}</strong>
              <span>{r.text}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

// ------------------------------------------------------------------ entregables

function Entregables() {
  const cabeza = useAparicion<HTMLDivElement>({ y: 26 });
  const lista = useAparicionLista<HTMLDivElement>({ separacion: 90 });
  return (
    <section className={s.entregables} data-oscuro="true">
      <div ref={cabeza} className={s.seccionCabeza}>
        <p className={s.eyebrow}>Qué entrego</p>
        <h2 className={s.titulo}>
          Todo queda <span className={s.tintaOro}>por escrito</span>.
        </h2>
      </div>
      <div ref={lista} className={s.entregablesRejilla}>
        {ENTREGABLES.map(({ icono: Icono, titulo, texto }) => (
          <article key={titulo} className={s.entregable}>
            <span className={s.entregableIcono}>
              <Icono size={22} aria-hidden />
            </span>
            <h3>{titulo}</h3>
            <p>{texto}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ contacto

function Contacto({ content }: { content: ChannelPageContent }) {
  const sec = content.sections.find((x) => x.id === "contacto");
  const caja = useAparicion<HTMLDivElement>({ y: 30 });
  const [copiado, setCopiado] = useState(false);
  const copiar = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(CONTACTO.email);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      window.location.href = mailto("Quiero agendar una conversación");
    }
  }, []);

  return (
    <section id="contacto" className={s.contacto}>
      <div ref={caja} className={s.contactoCaja}>
        <div className={s.contactoArriba}>
          <p className={s.eyebrow}>{sec?.eyebrow ?? "Contacto"}</p>
          <h2 className={s.contactoTitulo}>{sec?.title ?? "La primera conversación no cuesta"}</h2>
          {sec?.body && <p className={s.cuerpo}>{sec.body}</p>}
          <div className={s.contactoBotones}>
            <a className={s.botonTinta} href={AGENDAR} target="_blank" rel="noopener noreferrer">
              <MessageCircle size={17} aria-hidden /> Escribir por WhatsApp
            </a>
            <a className={s.botonLinea} href={tel()}>
              <Phone size={16} aria-hidden /> {CONTACTO.phoneDisplay}
            </a>
          </div>
        </div>
        <div className={s.contactoCorreo}>
          <a href={mailto("Quiero agendar una conversación")}>{CONTACTO.email}</a>
          <button type="button" onClick={copiar} className={s.copiar}>
            {copiado ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}
            {copiado ? "Copiado" : "Copiar correo"}
          </button>
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ pie

function Pie() {
  const zona = useProgreso<HTMLElement>("llega");
  const anio = new Date().getFullYear();
  return (
    <footer ref={zona} className={s.pie} data-oscuro="true">
      <div className={s.pieFila}>
        <p>Consultor · Valuador · Certificador</p>
        <nav aria-label="Pie">
          <a href="#oficios">Oficios</a>
          <a href="#resolver">Qué resuelvo</a>
          <a href="#metodo">Método</a>
          <a href="#contacto">Contacto</a>
          <a href="/legal">Aviso legal</a>
        </nav>
      </div>
      <p className={s.pieNombre} aria-label="Martín Hernández">
        <span>Martín</span>
        <Triangulo className={s.pieTri} />
        <span>Hernández</span>
      </p>
      <p className={s.pieLegal}>© {anio} Martín Hernández González · Organizaciones públicas y privadas</p>
    </footer>
  );
}

// ------------------------------------------------------------------ página

export function CounselingLanding({ content }: { content: ChannelPageContent }) {
  const [oscuro, setOscuro] = useState(true);

  // La cabecera se pinta según lo que tiene debajo: en claro sobre las
  // secciones de noche (portada, cita, entregables y pie), en tinta sobre el papel.
  useEffect(() => {
    let cuadro = 0;
    const leer = () => {
      cuadro = 0;
      const y = 36;
      const bajo = Array.from(document.querySelectorAll<HTMLElement>("[data-oscuro]")).some((el) => {
        const r = el.getBoundingClientRect();
        return el.dataset.oscuro === "true" && r.top <= y && r.bottom >= y;
      });
      setOscuro(bajo);
    };
    const pedir = () => {
      if (!cuadro) cuadro = requestAnimationFrame(leer);
    };
    leer();
    window.addEventListener("scroll", pedir, { passive: true });
    return () => {
      cancelAnimationFrame(cuadro);
      window.removeEventListener("scroll", pedir);
    };
  }, []);

  return (
    <div className={s.pagina}>
      <Suave />
      <div className={s.halo} aria-hidden />
      <Cabecera claro={!oscuro} />
      <main>
        <Portada content={content} />
        <Manifiesto texto={content.hero.lead} />
        <Oficios content={content} />
        <CitaVideo />
        <Resolver />
        <Metodo content={content} />
        <Entregables />
        <Contacto content={content} />
      </main>
      <Pie />
    </div>
  );
}
