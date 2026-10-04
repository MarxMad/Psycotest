"use client";

import { useEffect, useRef } from "react";
import { animate, onScroll } from "animejs";
import { ArrowRight, Clock, Layers, MessageCircle, ShieldCheck } from "lucide-react";
import type { ChannelDef } from "@/lib/channels";
import type { ChannelPageContent, ChannelSection } from "@/lib/channel-content";
import { evaluacion } from "@/lib/routes";
import { CONTACTO, mailto, tel, whatsapp } from "@/lib/contacto";
import { PRUEBAS } from "@/lib/pruebas-catalogo";
import { menosMovimiento, useAparicion, useAparicionLista } from "@/lib/aparicion";
import { Cifras, Declaracion, Pasos } from "./Secciones";
import { Cotizador } from "./Cotizador";
import { PuertasPsico } from "./PuertasPsico";
import { RadarVivo } from "./RadarVivo";
import { BarraAccion } from "./BarraAccion";
import { TituloVivo } from "./TituloVivo";
import { SelloSociedad, Trama } from "./arte";
import s from "./PsicologiaLanding.module.css";

const pesos = (centavos: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(centavos / 100);

/** La prueba más barata marca el piso: sirve para anclar el precio desde la portada. */
const DESDE = pesos(Math.min(...PRUEBAS.map((p) => p.precio)));

const CONFIANZA = [
  { icono: Layers, texto: `${PRUEBAS.length} instrumentos, una sola lectura` },
  { icono: Clock, texto: "Informe en 72 h" },
  { icono: ShieldCheck, texto: "Confidencial" },
];

/**
 * Cada bloque de contenido cierra con la acción que le toca. Antes se leían
 * tres secciones seguidas sin nada que tocar y el único botón vivía al final
 * de la página.
 */
const QUE_SIGUE = [
  "Definimos el puesto y qué instrumentos aplican.",
  "Te mandamos los códigos a tu nombre para repartir.",
  "Recibes el informe interpretado en 72 horas.",
];

const ACCION_SECCION: Record<string, { label: string; href: string; externo?: boolean }> = {
  servicios: { label: "Ver precios y armar la evaluación", href: "#bateria" },
  socioeconomicos: {
    label: "Pedir un estudio socioeconómico",
    href: whatsapp("Hola, necesito un estudio socioeconómico para un candidato."),
    externo: true,
  },
};

/** Sección de contenido: encabezado que entra y tarjetas escalonadas. */
function SeccionContenido({
  section,
  alterna,
}: {
  section: ChannelSection;
  alterna: boolean;
}) {
  const cabecera = useAparicion<HTMLDivElement>({ y: 22 });
  const tarjetas = useAparicionLista<HTMLDivElement>();
  const accion = ACCION_SECCION[section.id];

  return (
    <section id={section.id} className={`${s.section} ${alterna ? s.sectionAlt : ""}`}>
      <div ref={cabecera}>
        {section.eyebrow && <p className={s.eyebrow}>{section.eyebrow}</p>}
        <h2>{section.title}</h2>
        <p className={s.sectionBody}>{section.body}</p>
      </div>

      {section.items && section.items.length > 0 && (
        <div className={s.items} ref={tarjetas}>
          {section.items.map((item, i) => (
            <article key={item.title} className={s.item}>
              <span className={s.itemNum}>{String(i + 1).padStart(2, "0")}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      )}

      {accion && (
        <a
          className={s.enlaceAccion}
          href={accion.href}
          {...(accion.externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {accion.label}
          <ArrowRight size={16} aria-hidden />
        </a>
      )}
    </section>
  );
}

export function PsicologiaLanding({
  channel,
  content,
}: {
  channel: ChannelDef;
  content: ChannelPageContent;
}) {
  const portada = useRef<HTMLElement>(null);
  const brillo = useRef<HTMLDivElement>(null);
  const copia = useAparicion<HTMLDivElement>({ inmediato: true, y: 26 });
  const panel = useAparicion<HTMLElement>({ inmediato: true, y: 18, retraso: 140 });
  const instrumentos = useAparicionLista<HTMLUListElement>({ retraso: 340, separacion: 70, inmediato: true });
  const brechaTexto = useAparicion<HTMLDivElement>({ y: 24 });
  const brechaObra = useAparicion<HTMLDivElement>({ y: 24, retraso: 120 });
  const cierre = useAparicion<HTMLDivElement>({ y: 24 });

  // La portada se hunde un poco al bajar: la rejilla se va antes que el texto y
  // el scroll se siente con profundidad sin robarle protagonismo a nada.
  useEffect(() => {
    const capa = brillo.current;
    const zona = portada.current;
    if (!capa || !zona || menosMovimiento()) return;

    const animacion = animate(capa, {
      translateY: [0, 110],
      opacity: [1, 0.25],
      ease: "linear",
      autoplay: onScroll({
        target: zona,
        enter: "start start",
        leave: "start end",
        sync: 0.2,
      }),
    });

    return () => {
      animacion.revert();
    };
  }, []);

  return (
    <div className={s.page}>
      <section
        className={s.hero}
        id="acceso"
        ref={portada}
        aria-label={`Inicio ${channel.name}`}
      >
        <div className={s.heroGlow} ref={brillo} aria-hidden />
        <div className={s.heroGrid}>
          <div className={s.copy} ref={copia}>
            <p className={s.kicker}>{content.hero.brand}</p>
            <TituloVivo texto={content.hero.headline} />
            <p className={s.lead}>{content.hero.lead}</p>

            <ul className={s.confianza}>
              {CONFIANZA.map(({ icono: Icono, texto }) => (
                <li key={texto}>
                  <Icono size={15} strokeWidth={2} aria-hidden />
                  {texto}
                </li>
              ))}
            </ul>
          </div>

          <aside className={s.heroPanel} ref={panel} aria-label="Resumen de batería">
            <p className={s.panelEyebrow}>Batería activa</p>
            <ul className={s.panelList} ref={instrumentos}>
              {PRUEBAS.map((item, i) => (
                <li key={item.id}>
                  <span className={s.panelIndex}>{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <strong>{item.nombre}</strong>
                    <em>{item.etiqueta}</em>
                  </div>
                  <span className={s.panelTime}>~{item.minutos} min</span>
                </li>
              ))}
            </ul>

            <a className={s.panelCta} href="#bateria">
              Desde {DESDE} por candidato
              <ArrowRight size={15} aria-hidden />
            </a>

            <div className={s.respaldo}>
              <SelloSociedad className={s.sello} />
              <div>
                <strong>Sociedad de Psicología Aplicada A.C.</strong>
                <span>Instrumentos y criterios de interpretación respaldados.</span>
              </div>
            </div>
          </aside>
        </div>

        {/* Las dos puertas del canal, a lo ancho: es lo primero que hay que decidir.
            En móvil se adelantan al panel —la decisión va antes que el detalle. */}
        <div className={s.puertasZona}>
          <PuertasPsico />
        </div>
      </section>

      <section id="brecha" className={s.brecha}>
        <div className={s.brechaGrid}>
          <div ref={brechaTexto}>
            <p className={s.eyebrow}>Por qué se leen juntos</p>
            <h2 className={s.tituloSplit}>Un instrumento solo no decide nada</h2>
            <p className={s.sectionBody}>
              Lo que importa no es cada eje por separado, sino la distancia entre lo que el puesto
              exige y lo que la persona ofrece. Esa brecha es la que se interpreta — y la que te
              dice dónde va a necesitar apoyo desde el primer mes.
            </p>
            <p className={s.sectionBody}>
              Cambia de candidato y mira cómo se mueve el perfil contra el mismo puesto: es
              exactamente la lectura que recibes por escrito.
            </p>
            <a className={s.enlaceAccion} href="#bateria">
              Armar mi evaluación
              <ArrowRight size={16} aria-hidden />
            </a>
          </div>

          <div ref={brechaObra}>
            <RadarVivo />
          </div>
        </div>
      </section>

      <Cifras
        datos={[
          { valor: "5", etiqueta: "Instrumentos que integran la batería completa" },
          { valor: "72 h", etiqueta: "Entrega del informe una vez aplicada" },
          { valor: "En línea", etiqueta: "El candidato responde desde donde esté" },
          { valor: "Confidencial", etiqueta: "Resultados sólo para quien solicitó la evaluación" },
        ]}
      />

      <section id="bateria" className={s.section}>
        <p className={s.eyebrow}>Instrumentos y precios</p>
        <h2>Arma la evaluación y llévatela</h2>
        <p className={s.sectionBody}>
          Cinco instrumentos que se leen juntos. Según el puesto aplicas la batería completa o solo
          los que aportan a la decisión: marca los que necesitas, dinos a cuántas personas evalúas y
          el precio se arma solo. Sin llamada previa.
        </p>
        <Cotizador />
      </section>

      {content.sections.map((section, idx) => {
        // El proceso se lee mejor como línea de tiempo que como tarjetas
        if (section.id === "tres-pasos") {
          return (
            <div key={section.id}>
              <Declaracion
                id={section.id}
                texto={section.title}
                pie={section.body}
                trama="puntos"
                compacta
              />
              <Pasos
                pegado
                pasos={(section.items ?? []).map((i) => ({ title: i.title, text: i.text }))}
              />
            </div>
          );
        }

        return (
          <SeccionContenido key={section.id} section={section} alterna={idx % 2 === 1} />
        );
      })}

      <section id="contacto" className={s.contacto}>
        <Trama variante="curvas" className={s.contactoTrama} />
        <div className={s.contactoPanel} ref={cierre}>
          <div>
            <p className={s.eyebrow}>Contacto</p>
            <h2>Dinos qué puesto necesitas cubrir</h2>
            <p className={s.sectionBody}>
              En una llamada corta definimos qué instrumentos aplican, si conviene el estudio
              socioeconómico y en cuántos días tienes el informe. Sin costo.
            </p>
            <div className={s.contactoActions}>
              <a
                className={s.btnPrimary}
                href={whatsapp("Hola, necesito evaluar candidatos para una vacante.")}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={17} aria-hidden />
                Escribir por WhatsApp
              </a>
              <a className={s.btnGhost} href={mailto("Solicito una evaluación de personal")}>
                {CONTACTO.email}
              </a>
              <a className={s.btnGhost} href={tel()}>
                {CONTACTO.phoneDisplay}
              </a>
            </div>
            <p className={s.contactoNota}>
              ¿Ya traes un código de tu empresa?{" "}
              <a href={evaluacion.acceso}>Entra directo a tu evaluación</a>.
            </p>
          </div>

          <aside className={s.queSigue} aria-label="Qué pasa después">
            <p className={s.queSigueTitulo}>Qué pasa después</p>
            <ol>
              {QUE_SIGUE.map((paso, i) => (
                <li key={paso}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  {paso}
                </li>
              ))}
            </ol>
            <p className={s.queSiguePie}>Respondemos el mismo día hábil.</p>
          </aside>
        </div>
      </section>

      <BarraAccion
        tema="psicologia"
        titulo="Arma tu evaluación"
        nota="Informe interpretado por un psicólogo en 72 h"
        principal={{ label: "Ver precios", href: "#bateria" }}
        secundario={{ label: "Tengo un código", href: evaluacion.acceso, externo: false }}
      />
    </div>
  );
}
