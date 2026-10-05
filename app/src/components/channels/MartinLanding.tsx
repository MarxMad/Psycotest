"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";
import { ArrowUpRight, FileCheck2, Gavel, MessageCircle, ScrollText, Scale } from "lucide-react";
import type { ChannelDef } from "@/lib/channels";
import type { ChannelPageContent } from "@/lib/channel-content";
import { channelPublicUrl, type ChannelId } from "@/lib/channels";
import { CONTACTO, mailto, tel, whatsapp } from "@/lib/contacto";
import { menosMovimiento, useAparicion, useAparicionLista } from "@/lib/aparicion";
import { Cifras, Cita, Declaracion, Pasos } from "./Secciones";
import { SelloSociedad, TresOficios } from "./arte";
import s from "./MartinLanding.module.css";

/**
 * El retrato del portafolio.
 *
 * Mientras no haya foto suya, la tarjeta se sostiene con el monograma y la
 * obra de los tres oficios: se ve deliberado, no incompleto. Para publicarla
 * basta poner aquí la ruta del archivo en /public.
 */
const RETRATO: string | null = null;

const OFICIOS = ["Consultor", "Valuador", "Certificador"] as const;

/** Lo que respalda la práctica. Va arriba, antes de pedir nada. */
const CREDENCIALES = [
  "ECE 002-10 · CONOCER",
  "Psicología del trabajo",
  "Valuación con dictamen técnico",
  "Sector público e iniciativa privada",
  "Confidencialidad absoluta",
] as const;

/** Lo que queda por escrito al terminar. Un portafolio se juzga por esto. */
const ENTREGABLES = [
  {
    icono: Scale,
    titulo: "Dictamen de valuación",
    texto:
      "Un número defendible frente a terceros, con la metodología a la vista y los criterios escritos.",
  },
  {
    icono: ScrollText,
    titulo: "Informe de diagnóstico",
    texto:
      "Qué se atora en la organización, dónde y con qué prioridad. Sin adjetivos que no se puedan sostener.",
  },
  {
    icono: FileCheck2,
    titulo: "Certificado de competencia",
    texto:
      "Acreditación oficial contra estándar reconocido, con la CLAVE a nombre de la persona.",
  },
  {
    icono: Gavel,
    titulo: "Propuesta de alcance cerrado",
    texto: "Objetivos, duración y costo definidos antes de empezar. Lo que se firma es lo que se cobra.",
  },
] as const;

/** Las estructuras que opera, con su propia marca y su propio color. */
const LINEAS: Record<
  string,
  { canal: ChannelId; marca: string; logo?: string; sello?: boolean; tono: string }
> = {
  CEDUCT: {
    canal: "ceduct",
    marca: "Certificación de competencias",
    logo: "/ceduct/logo-ceduct.png",
    tono: "#c9a227",
  },
  "Psicología Aplicada": {
    canal: "psicologia",
    marca: "Evaluación y selección de personal",
    sello: true,
    tono: "#d4895a",
  },
  "Ingeniería de Grupos Efectivos": {
    canal: "ige",
    marca: "Capacitación y consultoría",
    logo: "/ige/logo.png",
    tono: "#22d3ee",
  },
};

/** El oficio activo se enciende por turnos: la firma se lee como una práctica viva. */
function FirmaOficios() {
  const [activo, setActivo] = useState(0);

  useEffect(() => {
    if (menosMovimiento()) return;
    const reloj = setInterval(() => setActivo((n) => (n + 1) % OFICIOS.length), 2600);
    return () => clearInterval(reloj);
  }, []);

  return (
    <p className={s.firma}>
      {OFICIOS.map((oficio, i) => (
        <span key={oficio} className={s.oficio} data-activo={i === activo}>
          {oficio}
        </span>
      ))}
    </p>
  );
}

export function MartinLanding({
  channel,
  content,
}: {
  channel: ChannelDef;
  content: ChannelPageContent;
}) {
  const copia = useAparicion<HTMLDivElement>({ inmediato: true, y: 26 });
  const tarjeta = useAparicion<HTMLDivElement>({ inmediato: true, y: 20, retraso: 160 });
  const marcas = useAparicionLista<HTMLUListElement>({ retraso: 60, separacion: 90 });
  const perfilTexto = useAparicion<HTMLDivElement>({ y: 24 });
  const perfilObra = useAparicion<HTMLDivElement>({ y: 24, retraso: 120 });
  const entregaCabecera = useAparicion<HTMLDivElement>({ y: 22 });
  const entregaLista = useAparicionLista<HTMLDivElement>();
  const lineasCabecera = useAparicion<HTMLDivElement>({ y: 22 });
  const lineasLista = useAparicionLista<HTMLDivElement>();
  const cierre = useAparicion<HTMLDivElement>({ y: 24 });
  const regla = useRef<HTMLSpanElement>(null);

  // La regla de oro bajo el nombre se traza sola: firma el titular.
  useEffect(() => {
    const nodo = regla.current;
    if (!nodo || menosMovimiento()) return;
    animate(nodo, {
      scaleX: [0, 1],
      duration: 900,
      delay: 420,
      ease: "out(4)",
    });
  }, []);

  const palabras = content.hero.headline.trim().split(/\s+/);
  const ultima = palabras[palabras.length - 1];
  const antes = palabras.slice(0, -1).join(" ");

  const seccion = (id: string) => content.sections.find((x) => x.id === id);
  const credenciales = seccion("credenciales");
  const metodo = seccion("metodo");
  const canales = seccion("canales");
  const contacto = seccion("contacto");

  return (
    <div className={s.page}>
      {/* ---------- PORTADA ---------- */}
      <section className={s.hero} id="inicio" aria-label={`Inicio ${channel.name}`}>
        <div className={s.heroGlow} aria-hidden />
        <div className={s.grano} aria-hidden />

        <div className={s.heroCopy} ref={copia}>
          <p className={s.kicker}>{content.hero.brand}</p>
          <h1 className={s.heroTitle}>
            {/* La última palabra del titular va en cursiva dorada: el acento
                se mueve solo si alguien reescribe la frase desde el panel. */}
            {antes}
            {antes && " "}
            <em>{ultima}</em>
            <span className={s.regla} ref={regla} aria-hidden />
          </h1>

          <FirmaOficios />

          <p className={s.lead}>{content.hero.lead}</p>

          <div className={s.acciones}>
            <a className={s.btnPrimary} href="#contacto">
              Agendar una conversación
            </a>
            <a className={s.btnGhost} href="#entregables">
              Qué entrego
            </a>
          </div>
        </div>

        <aside className={s.tarjeta} ref={tarjeta} aria-label="Ficha profesional">
          <TresOficios className={s.tarjetaObra} />
          <div className={s.retrato}>
            {RETRATO ? (
              <img src={RETRATO} alt="Martín Hernández González" />
            ) : (
              <span className={s.monograma} aria-hidden>
                MH
              </span>
            )}
          </div>
          <p className={s.tarjetaNombre}>{channel.legalName}</p>
          <p className={s.tarjetaRol}>{channel.tagline}</p>
          <dl className={s.tarjetaDatos}>
            <div>
              <dt>Acreditación</dt>
              <dd>ECE 002-10 · CONOCER</dd>
            </div>
            <div>
              <dt>Cobertura</dt>
              <dd>Sector público e iniciativa privada</dd>
            </div>
            <div>
              <dt>Primera conversación</dt>
              <dd>15 minutos, sin costo</dd>
            </div>
          </dl>
        </aside>
      </section>

      {/* ---------- CREDENCIALES ---------- */}
      <section className={s.credenciales} aria-label="Credenciales">
        <ul className={s.credencialesLista} ref={marcas}>
          {CREDENCIALES.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </section>

      <Cifras
        datos={[
          { valor: "3", etiqueta: "Oficios que se cruzan en cada intervención" },
          { valor: "4", etiqueta: "Líneas de trabajo bajo una misma responsable" },
          { valor: "15 min", etiqueta: "La primera conversación, sin costo" },
          { valor: "ECE 002-10", etiqueta: "Clave de acreditación de la certificadora" },
        ]}
      />

      {/* ---------- PERFIL ---------- */}
      {credenciales && (
        <section id={credenciales.id} className={s.perfil}>
          <div className={`${s.limite} ${s.perfilGrid}`}>
            <div ref={perfilTexto}>
              <p className={s.eyebrow}>{credenciales.eyebrow}</p>
              <h2 className={s.titulo}>{credenciales.title}</h2>
              <p className={s.cuerpo}>{credenciales.body}</p>

              <ol className={s.oficiosLista}>
                {(credenciales.items ?? []).map((item, i) => (
                  <li key={item.title}>
                    <span className={s.oficioNum} aria-hidden>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className={s.perfilObra} ref={perfilObra}>
              <span className={s.perfilHalo} aria-hidden />
              <TresOficios />
            </div>
          </div>
        </section>
      )}

      {/* ---------- ENTREGABLES ---------- */}
      <section id="entregables" className={`${s.seccion} ${s.seccionAlt}`}>
        <div className={s.limite}>
          <div className={s.cabecera} ref={entregaCabecera}>
            <p className={s.eyebrow}>Qué entrego</p>
            <h2 className={s.titulo}>Papeles que se sostienen solos</h2>
            <p className={s.cuerpo}>
              Una intervención mía termina en un documento con nombre, fecha y método. Esto es lo
              que queda en tus manos.
            </p>
          </div>

          <div className={s.entregables} ref={entregaLista}>
            {ENTREGABLES.map(({ icono: Icono, titulo, texto }) => (
              <article key={titulo} className={s.entregable}>
                <span className={s.entregableIcono} aria-hidden>
                  <Icono size={19} strokeWidth={1.6} />
                </span>
                <h3>{titulo}</h3>
                <p>{texto}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Cita
        texto="A las organizaciones no las detiene la falta de información. Las detiene no saber qué vale lo que ya tienen."
        autor="Martín Hernández González"
        trama="radial"
      />

      {/* ---------- MÉTODO ---------- */}
      {metodo && (
        <div>
          <Declaracion
            id={metodo.id}
            texto={metodo.title}
            pie={metodo.body}
            trama="puntos"
            compacta
          />
          <Pasos
            pegado
            pasos={(metodo.items ?? []).map((i) => ({ title: i.title, text: i.text }))}
          />
        </div>
      )}

      {/* ---------- LÍNEAS DE TRABAJO ---------- */}
      {canales && (
        <section id={canales.id} className={s.seccion}>
          <div className={s.limite}>
            <div className={s.cabecera} ref={lineasCabecera}>
              <p className={s.eyebrow}>{canales.eyebrow}</p>
              <h2 className={s.titulo}>{canales.title}</h2>
              <p className={s.cuerpo}>{canales.body}</p>
            </div>

            <div className={s.lineas} ref={lineasLista}>
              {(canales.items ?? []).map((item) => {
                const linea = LINEAS[item.title];
                return (
                  <article
                    key={item.title}
                    className={s.linea}
                    style={linea ? ({ ["--tono" as string]: linea.tono }) : undefined}
                  >
                    {linea && (
                      <span className={s.lineaMarca} style={{ color: linea.tono }}>
                        {linea.sello ? (
                          <SelloSociedad className={s.marcaSello} />
                        ) : (
                          <img src={linea.logo} alt="" />
                        )}
                      </span>
                    )}
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                    {linea && (
                      <a className={s.lineaCta} href={channelPublicUrl(linea.canal)}>
                        Abrir el sitio
                        <ArrowUpRight size={16} aria-hidden />
                      </a>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ---------- CONTACTO ---------- */}
      <section id="contacto" className={`${s.seccion} ${s.contacto}`}>
        <div className={`${s.limite} ${s.contactoGrid}`} ref={cierre}>
          <div>
            <p className={s.eyebrow}>{contacto?.eyebrow ?? "Contacto"}</p>
            <h2 className={s.tituloGrande}>
              {contacto?.title ?? "La primera conversación no cuesta"}
            </h2>
            <p className={s.cuerpo}>
              {contacto?.body ??
                "Quince minutos para saber si soy la persona indicada para resolver lo que traes."}
            </p>
            <div className={s.contactoAcciones}>
              <a
                className={s.btnPrimary}
                href={whatsapp("Hola Martín, me gustaría agendar una conversación.")}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={17} aria-hidden />
                Escribir por WhatsApp
              </a>
              <a className={s.btnGhost} href={mailto("Quiero agendar una conversación")}>
                {CONTACTO.email}
              </a>
              <a className={s.btnGhost} href={tel()}>
                {CONTACTO.phoneDisplay}
              </a>
            </div>
          </div>

          <aside className={s.compromiso} aria-label="Cómo trabajo contigo">
            <p className={s.compromisoTitulo}>Lo que puedes esperar</p>
            <ul>
              <li>Hablas conmigo, no con un intermediario.</li>
              <li>Primero el diagnóstico; la propuesta va después.</li>
              <li>Si no puedo resolverlo, te lo digo y te oriento con quien sí.</li>
            </ul>
            <p className={s.compromisoPie}>Confidencialidad absoluta, dentro y fuera del proyecto.</p>
          </aside>
        </div>
      </section>
    </div>
  );
}
