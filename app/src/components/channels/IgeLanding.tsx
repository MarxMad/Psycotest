"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as EventoPuntero } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Compass,
  MessageCircle,
  Mic,
  Presentation,
  Scale,
  Users,
} from "lucide-react";
import type { ChannelDef } from "@/lib/channels";
import type { ChannelPageContent, ChannelSection } from "@/lib/channel-content";
import { whatsapp } from "@/lib/contacto";
import { menosMovimiento, useAparicion } from "@/lib/aparicion";
import { CintaTemas } from "./CintaTemas";
import { RejillaCursos, type CursoVista } from "./RejillaCursos";
import { VideoAcademia, type Pieza } from "./VideoAcademia";
import {
  ArteFormato,
  ArteServicio,
  EscenaMetodo,
  MarcaIge,
  Nube,
  type FormatoArte,
  type ServicioArte,
} from "./ige/Arte";
import { Cabecera, Pie, Suave, useScroll } from "./ige/Marco";
import m from "./ige/Marco.module.css";
import s from "./IgeLanding.module.css";

/*
 * Portada de Ingeniería de Grupos Efectivos.
 *
 * Clara, editorial y con aire: la flecha del logo cruza el cielo de la
 * portada y los seis puntos —el grupo— reaparecen en cada ilustración hasta
 * quedar en la formación del logo al final del método. El recorrido va de lo
 * que hacemos a cómo lo hacemos, en qué formato, con qué respaldo y, al
 * final, el catálogo y el contacto.
 *
 * Los textos que se editan desde /admin/canales siguen mandando: portada,
 * consultoría, formatos, método, especialidades y contacto salen de
 * `content`. Lo fijo aquí es la puesta en escena.
 */

type Servicio = {
  id: string;
  nombre: string;
  etiqueta: string;
  frase: string;
  para: string;
  arte: ServicioArte;
  fondo: string;
  tinte: string;
  mensaje: string;
};

/** Las tres primeras toman su texto de la sección «consultoria» del admin. */
const SERVICIOS: Servicio[] = [
  {
    id: "diagnostico",
    nombre: "Diagnóstico organizacional",
    etiqueta: "Consultoría",
    frase: "Clima, comunicación, carga y estructura, con instrumentos y entrevistas por nivel. Informe con prioridades.",
    para: "Para direcciones que necesitan saber dónde se traba el equipo antes de invertir en él.",
    arte: "diagnostico",
    fondo: "linear-gradient(160deg, #e3e1fb 0%, #f3eefa 55%, #fbf6ef 100%)",
    tinte: "#c9c6f3",
    mensaje: "Hola, me interesa un diagnóstico organizacional.",
  },
  {
    id: "directivo",
    nombre: "Coaching empresarial",
    etiqueta: "Mandos y direcciones",
    frase: "Acompañamiento a mandos y equipos directivos para sostener el resultado sin desgastar a la gente.",
    para: "Para equipos directivos que crecieron más rápido que su forma de decidir.",
    arte: "directivo",
    fondo: "linear-gradient(160deg, #fbdcc8 0%, #fbeee2 55%, #fbf6ef 100%)",
    tinte: "#f4c4a6",
    mensaje: "Hola, me interesa coaching empresarial para mi equipo directivo.",
  },
  {
    id: "personal",
    nombre: "Coaching personal",
    etiqueta: "Uno a uno",
    frase: "Trabajo uno a uno para profesionales en transición: nuevo puesto o nuevo tramo de control.",
    para: "Para quien acaba de recibir un equipo y quiere llegar con método, no con prisa.",
    arte: "personal",
    fondo: "linear-gradient(160deg, #cdeee0 0%, #e8f6ef 55%, #fbf6ef 100%)",
    tinte: "#b4e2cf",
    mensaje: "Hola, me interesa un proceso de coaching personal.",
  },
  {
    id: "taller",
    nombre: "Cursos y talleres",
    etiqueta: "Capacitación",
    frase: "En tus instalaciones o en línea, con tu gente y con tus casos. El equipo sale con acuerdos escritos, no con apuntes.",
    para: "Para áreas que necesitan una competencia concreta y no un temario genérico.",
    arte: "taller",
    fondo: "linear-gradient(160deg, #d6e6f7 0%, #ecf2f8 55%, #fbf6ef 100%)",
    tinte: "#bcd5ef",
    mensaje: "Hola, me interesa un curso o taller para mi equipo.",
  },
  {
    id: "conferencia",
    nombre: "Conferencias",
    etiqueta: "Eventos",
    frase: "Una sesión que mueve al grupo: para arrancar el año, cerrar una etapa o romper una inercia.",
    para: "Para convenciones, arranques de año y cierres de proyecto.",
    arte: "conferencia",
    fondo: "linear-gradient(160deg, #f6d9e4 0%, #f9ecef 55%, #fbf6ef 100%)",
    tinte: "#efc0d2",
    mensaje: "Hola, me interesa una conferencia para un evento.",
  },
];

const FORMATOS: { arte: FormatoArte; Icono: typeof Users; fondo: string }[] = [
  { arte: "privado", Icono: Users, fondo: "linear-gradient(170deg, #cfcdf6, #e6e4fb)" },
  { arte: "programa", Icono: Presentation, fondo: "linear-gradient(170deg, #c3ead9, #e1f4ea)" },
  { arte: "publico", Icono: CalendarDays, fondo: "linear-gradient(170deg, #f6cdb4, #fae4d5)" },
  { arte: "conferencia", Icono: Mic, fondo: "linear-gradient(170deg, #cfe0f3, #e6eff8)" },
];

const ICONO_ESPECIALIDAD = [BriefcaseBusiness, Compass, Scale];

const VIDEO_PRINCIPAL: Pieza = {
  id: "presentacion",
  titulo: "Así se trabaja una sesión",
  pie: "Grupo completo, casos propios y acuerdos por escrito al cerrar.",
  poster: "/media/hero-poster.jpg",
  archivo: "/media/hero-bg.mp4",
};

/**
 * Los huecos sin `youtube` ni `archivo` se dibujan igual, marcados como
 * «próximamente»: basta pegar el id de YouTube aquí para publicarlos.
 */
const VIDEOS: Pieza[] = [
  { id: "testimonio", titulo: "Lo que dicen los equipos", pie: "Testimonio de un grupo al terminar el programa.", poster: "/ige/download-1.jpg" },
  { id: "muestra", titulo: "Clase muestra", pie: "Quince minutos de un curso grabado, abiertos.", poster: "/ige/serv2.png" },
  { id: "consultoria", titulo: "Cómo diagnosticamos", pie: "El recorrido de un diagnóstico organizacional.", poster: "/ige/download.jpg" },
];

/** Atajos al final de la academia: cada uno abre WhatsApp con el mensaje escrito. */
const PEDIDOS = [
  { titulo: "Un diagnóstico de clima y comunicación", tipo: "Consultoría", mensaje: "Hola, me interesa un diagnóstico de clima y comunicación." },
  { titulo: "Un taller privado para mi área", tipo: "Capacitación", mensaje: "Hola, quiero un taller privado para mi área." },
  { titulo: "Acompañamiento para mi equipo directivo", tipo: "Coaching", mensaje: "Hola, me interesa acompañamiento para mi equipo directivo." },
  { titulo: "Una conferencia para nuestro evento", tipo: "Conferencia", mensaje: "Hola, quiero una conferencia para nuestro evento." },
  { titulo: "Un curso que no está en el catálogo", tipo: "A la medida", mensaje: "Hola, necesito un curso que no está en el catálogo." },
];

/* ------------------------------------------------------------ utilidades */

/** Parte el titular en dos renglones parejos: uno a la izquierda y otro a la derecha. */
function partirTitular(texto: string): [string, string] {
  const palabras = texto.trim().split(/\s+/);
  if (palabras.length < 3) return [texto, ""];
  const corte = Math.ceil(palabras.length / 2);
  return [palabras.slice(0, corte).join(" "), palabras.slice(corte).join(" ")];
}

/** Primera oración: la portada sólo carga una idea. */
function primeraOracion(texto: string) {
  const m = texto.match(/^[^.]+\./);
  return m ? m[0] : texto;
}

/* ------------------------------------------------------------------ telón */

/**
 * Entrada de la marca: la retícula se traza, el cuadro del logo se llena y
 * la flecha sale por la esquina. Va sólo con CSS para que, sin JS, el telón
 * igual se levante; un clic lo salta.
 */
function Telon() {
  const [fuera, setFuera] = useState(false);

  return (
    <div className={s.telon} data-fuera={fuera} onClick={() => setFuera(true)} aria-hidden>
      <span className={`${s.telonLinea} ${s.telonH1}`} />
      <span className={`${s.telonLinea} ${s.telonH2}`} />
      <span className={`${s.telonLinea} ${s.telonV1}`} />
      <span className={`${s.telonLinea} ${s.telonV2}`} />
      <div className={s.telonCelda} />
      <span className={`${s.telonRotulo} ${s.telonRotuloA}`}>Ingeniería de</span>
      <span className={`${s.telonRotulo} ${s.telonRotuloB}`}>Grupos Efectivos</span>
      <MarcaIge className={s.telonMarca} tinta="#1f2a3d" />
    </div>
  );
}

/* ---------------------------------------------------------------- portada */

/** La flecha del logo atravesando el cielo entre los dos renglones del titular. */
function Vuelo() {
  return (
    <svg viewBox="0 0 900 600" className={s.vuelo} aria-hidden>
      <defs>
        <linearGradient id="estela-ige" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#fff6ea" stopOpacity="0" />
          <stop offset="0.55" stopColor="#ffe7d4" stopOpacity="0.85" />
          <stop offset="1" stopColor="#d8322c" stopOpacity="0.95" />
        </linearGradient>
        <filter id="halo-ige" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>
      <path d="M40 600 L640 120" stroke="url(#estela-ige)" strokeWidth="46" strokeLinecap="round" opacity="0.5" filter="url(#halo-ige)" />
      <path d="M40 600 L640 120" stroke="url(#estela-ige)" strokeWidth="9" strokeLinecap="round" className={s.vueloTrazo} />
      <g className={s.vueloPunta}>
        <polygon points="700,72 618,104 664,152" fill="#d8322c" />
      </g>
    </svg>
  );
}

function Portada({ content }: { content: ChannelPageContent }) {
  const raiz = useRef<HTMLElement>(null);
  const [l1, l2] = partirTitular(content.hero.headline);

  // Las nubes se quedan atrás al bajar: tres velocidades, un solo dato.
  useScroll(() => {
    const nodo = raiz.current;
    if (!nodo || menosMovimiento()) return;
    const y = Math.min(window.scrollY, window.innerHeight * 1.2);
    nodo.style.setProperty("--y", String(y));
  });

  return (
    <section className={s.portada} id="inicio" ref={raiz} aria-label="Inicio">
      <div className={s.cielo} aria-hidden />
      <span className={`${s.nube} ${s.nubeA}`}>
        <Nube tono="lila" />
      </span>
      <span className={`${s.nube} ${s.nubeB}`}>
        <Nube tono="durazno" />
      </span>
      <span className={`${s.nube} ${s.nubeC}`}>
        <Nube tono="lila" />
      </span>
      <span className={`${s.nube} ${s.nubeD}`}>
        <Nube tono="durazno" />
      </span>
      <Vuelo />

      <p className={s.pildora}>{content.hero.brand}</p>
      <h1 className={s.titular}>
        <span className={s.titularA}>{l1}</span>
        {l2 && <span className={s.titularB}>{l2}</span>}
      </h1>

      <div className={s.portadaPie}>
        <p className={s.portadaSector}>
          Capacitación · Consultoría · Coaching
          <span>Sector público e iniciativa privada</span>
        </p>
        <div className={s.portadaAccion}>
          <p>{primeraOracion(content.hero.lead)}</p>
          <a className={m.botonTinta} href={content.hero.primaryCta?.href ?? "#contacto"}>
            {content.hero.primaryCta?.label ?? "Solicitar una propuesta"}
          </a>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- servicios */

function Servicios({ consultoria }: { consultoria?: ChannelSection }) {
  const [i, setI] = useState(0);
  const inicio = useRef<number | null>(null);
  const cabecera = useAparicion<HTMLDivElement>({ y: 22 });

  // Las tres de consultoría se escriben en el admin; el resto es fijo.
  const servicios = SERVICIOS.map((sv, k) => {
    const item = consultoria?.items?.[k];
    return k < 3 && item ? { ...sv, nombre: item.title, frase: item.text } : sv;
  });

  const ir = (n: number) => setI((n + servicios.length) % servicios.length);

  const bajar = (e: EventoPuntero) => {
    inicio.current = e.clientX;
  };
  const subir = (e: EventoPuntero) => {
    if (inicio.current === null) return;
    const dx = e.clientX - inicio.current;
    inicio.current = null;
    if (Math.abs(dx) > 50) ir(i + (dx < 0 ? 1 : -1));
  };

  return (
    <section className={s.servicios} id="servicios" aria-roledescription="carrusel" aria-label="Servicios">
      <div className={s.serviciosCabecera} ref={cabecera}>
        <p className={s.eyebrow}>{consultoria?.eyebrow ?? "Lo que hacemos"}</p>
        <h2 className={s.tituloCentro}>{consultoria?.title ?? "Antes de capacitar, medimos"}</h2>
        {consultoria?.body && <p className={s.cuerpoCentro}>{consultoria.body}</p>}
      </div>

      <div className={s.pestanas} role="tablist" aria-label="Elegir servicio">
        {servicios.map((sv, k) => (
          <button
            key={sv.id}
            type="button"
            role="tab"
            aria-selected={k === i}
            className={s.pestana}
            onClick={() => setI(k)}
          >
            {sv.nombre}
          </button>
        ))}
      </div>

      <div className={s.carrusel} onPointerDown={bajar} onPointerUp={subir} onPointerCancel={() => (inicio.current = null)}>
        <div className={s.pista} style={{ "--i": i } as CSSProperties}>
          {servicios.map((sv, k) => (
            <article
              key={sv.id}
              className={s.tarjetaServicio}
              data-activa={k === i}
              style={{ background: sv.fondo }}
              aria-hidden={k !== i}
              onClick={() => k !== i && setI(k)}
            >
              <header className={s.tarjetaServicioCabeza}>
                <h3>{sv.nombre}</h3>
                <span>{sv.etiqueta}</span>
              </header>
              <div className={s.tarjetaServicioCuerpo}>
                <div>
                  <p className={s.frase}>“{sv.frase}”</p>
                  <p className={s.para}>— {sv.para}</p>
                </div>
                <div className={s.tarjetaServicioArte}>
                  <ArteServicio tipo={sv.arte} tinte={sv.tinte} />
                </div>
              </div>
              <a
                className={`${k % 2 ? m.botonTintaChico : m.botonDuraznoChico} ${s.tarjetaBoton}`}
                href={whatsapp(sv.mensaje)}
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={k === i ? 0 : -1}
              >
                Solicitar
              </a>
            </article>
          ))}
        </div>
        <button type="button" className={`${s.flecha} ${s.flechaIzq}`} onClick={() => ir(i - 1)} aria-label="Servicio anterior">
          <ArrowLeft size={16} aria-hidden />
        </button>
        <button type="button" className={`${s.flecha} ${s.flechaDer}`} onClick={() => ir(i + 1)} aria-label="Servicio siguiente">
          <ArrowRight size={16} aria-hidden />
        </button>
      </div>

      <div className={s.puntos} aria-hidden>
        {servicios.map((sv, k) => (
          <span key={sv.id} data-activo={k === i} />
        ))}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- método */

function Metodo({ metodo }: { metodo: ChannelSection }) {
  const caja = useRef<HTMLElement>(null);
  const [paso, setPaso] = useState(0);
  const pasos = (metodo.items ?? []).slice(0, 5);
  const n = Math.max(pasos.length, 1);

  // La etapa sale de cuánto se ha recorrido la sección fija.
  useScroll(() => {
    const nodo = caja.current;
    if (!nodo) return;
    const r = nodo.getBoundingClientRect();
    const recorrido = r.height - window.innerHeight;
    if (recorrido <= 0) return;
    const p = Math.min(Math.max(-r.top / recorrido, 0), 0.9999);
    setPaso(Math.floor(p * n));
  });

  const irA = (k: number) => {
    const nodo = caja.current;
    if (!nodo) return;
    const r = nodo.getBoundingClientRect();
    const recorrido = r.height - window.innerHeight;
    const destino = window.scrollY + r.top + ((k + 0.5) / n) * recorrido;
    window.scrollTo({ top: destino, behavior: menosMovimiento() ? "auto" : "smooth" });
  };

  return (
    <section className={s.metodo} id={metodo.id} ref={caja} style={{ "--n": n } as CSSProperties}>
      <div className={s.metodoFijo}>
        <div className={s.metodoTexto}>
          <div>
            <p className={s.eyebrow}>{metodo.eyebrow ?? "Cómo intervenimos"}</p>
            <h2 className={s.tituloMetodo}>{metodo.title}</h2>
            <p className={s.cuerpo}>{metodo.body}</p>
          </div>
          <ol className={s.pasos}>
            {pasos.map((p, k) => (
              <li key={p.title} data-activo={k === paso}>
                <button type="button" onClick={() => irA(k)} aria-current={k === paso ? "step" : undefined}>
                  <span className={s.pasoNum}>{k + 1}</span>
                  <span className={s.pasoTitulo}>{p.title}</span>
                </button>
                <p className={s.pasoTexto}>{p.text}</p>
              </li>
            ))}
          </ol>
        </div>
        <div className={s.panelMetodo}>
          <EscenaMetodo paso={Math.min(paso, 4)} />
          <span className={s.panelContador}>
            {String(paso + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
          </span>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- formatos */

const DURACION_FORMATO = 6500;

function Formatos({ capacitacion }: { capacitacion: ChannelSection }) {
  const raiz = useRef<HTMLDivElement>(null);
  const cabecera = useAparicion<HTMLDivElement>({ y: 22 });
  const [activo, setActivo] = useState(0);
  const [pausa, setPausa] = useState(false);
  const [enVista, setEnVista] = useState(false);
  const items = (capacitacion.items ?? []).slice(0, FORMATOS.length);

  useEffect(() => {
    const nodo = raiz.current;
    if (!nodo || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => setEnVista(e.isIntersecting), { threshold: 0.35 });
    io.observe(nodo);
    return () => io.disconnect();
  }, []);

  // Avanza solo mientras se ve y nadie lo está leyendo.
  const corre = enVista && !pausa && items.length > 1;
  useEffect(() => {
    if (!corre || menosMovimiento()) return;
    const t = window.setTimeout(() => setActivo((a) => (a + 1) % items.length), DURACION_FORMATO);
    return () => window.clearTimeout(t);
  }, [activo, corre, items.length]);

  return (
    <section className={s.formatos} id={capacitacion.id}>
      <div className={s.formatosCabecera} ref={cabecera}>
        <p className={s.eyebrow}>{capacitacion.eyebrow}</p>
        <h2 className={s.tituloCentro}>{capacitacion.title}</h2>
        <p className={s.cuerpoCentro}>{capacitacion.body}</p>
      </div>

      <div
        className={s.acordeon}
        ref={raiz}
        onPointerEnter={() => setPausa(true)}
        onPointerLeave={() => setPausa(false)}
        onFocus={() => setPausa(true)}
        onBlur={() => setPausa(false)}
        style={{ "--dur": `${DURACION_FORMATO}ms` } as CSSProperties}
      >
        {items.map((item, k) => {
          const { Icono, arte, fondo } = FORMATOS[k];
          const es = k === activo;
          return (
            <button
              key={item.title}
              type="button"
              className={s.formato}
              data-activo={es}
              aria-expanded={es}
              onClick={() => setActivo(k)}
              style={es ? { background: fondo } : undefined}
            >
              {es && <span key={activo} className={s.formatoBarra} data-corre={corre} aria-hidden />}
              <span className={s.formatoCabeza}>
                {es ? <Icono size={18} aria-hidden /> : <span />}
                <span className={s.formatoCuenta}>
                  {k + 1} de {items.length}
                </span>
              </span>
              <span className={s.formatoTitulo}>{item.title}</span>
              <span className={s.formatoTexto}>{item.text}</span>
              <span className={s.formatoArte}>
                <ArteFormato tipo={arte} />
              </span>
            </button>
          );
        })}
      </div>

      <div className={s.centro}>
        <a className={m.botonTinta} href="#contacto">
          Pedir el calendario
          <ArrowRight size={16} aria-hidden />
        </a>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- especialidades */

function Especialidades({ especialidades }: { especialidades: ChannelSection }) {
  const cabecera = useAparicion<HTMLDivElement>({ y: 22 });

  return (
    <section className={s.especialidades} id={especialidades.id}>
      <div className={s.especialidadesCabecera} ref={cabecera}>
        <p className={s.eyebrow}>{especialidades.eyebrow}</p>
        <h2 className={s.tituloGrande}>{especialidades.title}</h2>
        <span className={s.sello}>
          <Scale size={13} aria-hidden />
          Derecho laboral en cada decisión
        </span>
      </div>
      <div className={s.especialidadesRejilla}>
        <div className={s.especialidadesArte} aria-hidden>
          <span className={`${s.nube} ${s.nubeE}`}>
            <Nube tono="lila" />
          </span>
          <span className={`${s.nube} ${s.nubeF}`}>
            <Nube tono="durazno" />
          </span>
          <MarcaIge className={s.especialidadesMarca} tinta="#1f2a3d" />
          <p className={s.especialidadesLema}>{especialidades.body}</p>
        </div>
        <ul className={s.especialidadesLista}>
          {(especialidades.items ?? []).map((item, k) => {
            const Icono = ICONO_ESPECIALIDAD[k % ICONO_ESPECIALIDAD.length];
            return (
              <li key={item.title}>
                <Icono size={18} aria-hidden />
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- academia */

function Academia({ cursos }: { cursos: CursoVista[] }) {
  const cabecera = useAparicion<HTMLDivElement>({ y: 22 });
  const panel = useAparicion<HTMLDivElement>({ y: 26 });
  const envivo = cursos.filter((c) => c.formato === "vivo").length;
  const grabados = cursos.length - envivo;

  const fichas = [
    { valor: envivo || "—", etiqueta: "en vivo" },
    { valor: grabados || "—", etiqueta: "grabados" },
    { valor: "En sitio", etiqueta: "o en línea" },
    { valor: "A tu ritmo", etiqueta: "por lección" },
    { valor: "Constancia", etiqueta: "con asistencia" },
    { valor: "Costo", etiqueta: "cerrado" },
  ];

  return (
    <section className={s.oscuro}>
      <div className={s.academia} id="academia">
        <div className={s.academiaCabecera} ref={cabecera}>
          <p className={s.eyebrow}>Academia</p>
          <h2 className={s.tituloCentro}>El catálogo completo, en vivo y grabado.</h2>
          <p className={s.cuerpoCentro}>
            Los cursos en vivo se dan con tu equipo y con los casos de tu operación. Los grabados se toman cuando se
            pueda, con avance por lección.
          </p>
        </div>
      </div>

      {cursos.length > 0 && <CintaTemas temas={cursos.map((c) => c.titulo)} etiqueta="Temas del catálogo" />}

      <div className={s.academia}>
        <div className={s.cifra} ref={panel}>
          <div className={s.cifraNumero}>
            <span className={`${s.nube} ${s.nubeG}`}>
              <Nube tono="lila" />
            </span>
            <span className={`${s.nube} ${s.nubeH}`}>
              <Nube tono="durazno" />
            </span>
            <strong>{cursos.length || "—"}</strong>
            <span>cursos abiertos</span>
          </div>
          <div className={s.cifraFichas}>
            <p>En vivo con tu equipo o grabados, a tu ritmo.</p>
            <ul>
              {fichas.map((f) => (
                <li key={f.etiqueta}>
                  <strong>{f.valor}</strong>
                  <span>{f.etiqueta}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <RejillaCursos cursos={cursos} />

        <p className={s.nota}>
          ¿No está el tema que necesitas? Armamos el temario a la medida sobre tu diagnóstico.{" "}
          <a href={whatsapp("Hola, necesito un curso que no está en el catálogo.")} target="_blank" rel="noopener noreferrer">
            Cuéntanos qué falta
          </a>
          .
        </p>
      </div>

      <div className={s.academia} id="video">
        <div className={s.videoRejilla}>
          <div>
            <p className={s.eyebrow}>En video</p>
            <h2 className={s.tituloOscuro}>Mira cómo se trabaja antes de contratar</h2>
            <p className={s.cuerpo}>
              Una sesión no se parece a un temario. Aquí está la presentación, un testimonio y una clase muestra para
              que veas el tono con el que entramos a tu organización.
            </p>
          </div>
          <VideoAcademia principal={VIDEO_PRINCIPAL} piezas={VIDEOS} />
        </div>
      </div>

      <div className={s.academia}>
        <div className={s.pedidos}>
          <p className={s.eyebrow}>Atajos</p>
          <h2 className={s.tituloOscuro}>Pide lo que tu equipo necesita</h2>
          <ul>
            {PEDIDOS.map((p) => (
              <li key={p.titulo}>
                <a href={whatsapp(p.mensaje)} target="_blank" rel="noopener noreferrer">
                  <span className={s.pedidoTitulo}>{p.titulo}</span>
                  <span className={s.pedidoTipo}>{p.tipo}</span>
                  <span className={s.pedidoFlecha} aria-hidden>
                    <ArrowRight size={15} />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- cierre */

function Cierre({ contacto }: { contacto?: ChannelSection }) {
  const caja = useAparicion<HTMLDivElement>({ y: 24 });

  return (
    <section className={s.cierre} id="contacto">
      <div className={s.cierreCaja} ref={caja}>
        <p className={s.eyebrow}>{contacto?.eyebrow ?? "Contacto"}</p>
        <h2 className={s.tituloCierre}>{contacto?.title ?? "Cuéntanos qué se está trabando en tu equipo"}</h2>
        <p className={s.cuerpoCentro}>
          {contacto?.body ?? "Una reunión sin costo para entender el problema real."}
        </p>
        <div className={s.cierreAcciones}>
          <a
            className={m.botonTinta}
            href={whatsapp("Hola, me interesa una propuesta de capacitación o consultoría.")}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle size={16} aria-hidden />
            Escribir por WhatsApp
          </a>
          <a className={m.botonDurazno} href="#academia">
            Ver los cursos
          </a>
        </div>
        <ol className={s.incluye} aria-label="Qué incluye la propuesta">
          <li>
            <span>01</span>Objetivos y temario sobre tu diagnóstico
          </li>
          <li>
            <span>02</span>Duración, modalidad y calendario
          </li>
          <li>
            <span>03</span>Costo cerrado, sin variables después
          </li>
        </ol>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- página */

export function IgeLanding({
  channel,
  content,
  cursos = [],
}: {
  channel: ChannelDef;
  content: ChannelPageContent;
  cursos?: CursoVista[];
}) {
  const seccion = (id: string) => content.sections.find((x) => x.id === id);
  const capacitacion = seccion("capacitacion");
  const consultoria = seccion("consultoria");
  const metodo = seccion("metodo");
  const especialidades = seccion("especialidades");
  const contacto = seccion("contacto");

  return (
    <div className={`${m.tema} ${s.pagina}`}>
      <Suave />
      <Telon />
      <Cabecera />
      <main>
        <Portada content={content} />
        <Servicios consultoria={consultoria} />
        {metodo && <Metodo metodo={metodo} />}
        {capacitacion && <Formatos capacitacion={capacitacion} />}
        {especialidades && <Especialidades especialidades={especialidades} />}
        <Academia cursos={cursos} />
        <Cierre contacto={contacto} />
      </main>
      <Pie channel={channel} />
    </div>
  );
}
