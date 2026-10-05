"use client";

import Image from "next/image";
import {
  ArrowRight,
  CalendarCheck,
  GraduationCap,
  MessageCircle,
  MonitorPlay,
  Users,
} from "lucide-react";
import type { ChannelDef } from "@/lib/channels";
import type { ChannelPageContent, ChannelSection } from "@/lib/channel-content";
import { CONTACTO, mailto, tel, whatsapp } from "@/lib/contacto";
import { useAparicion, useAparicionLista } from "@/lib/aparicion";
import { Cifras, Declaracion, Pasos, SplitObra } from "./Secciones";
import { BarraAccion } from "./BarraAccion";
import { CintaTemas } from "./CintaTemas";
import { RejillaCursos, type CursoVista } from "./RejillaCursos";
import { TituloVivo } from "./TituloVivo";
import { VideoAcademia, type Pieza } from "./VideoAcademia";
import { RedEquipo } from "./arte";
import s from "./IgeLanding.module.css";

/** Los formatos de impartición llevan icono: se escanean antes de leerse. */
const ICONO_FORMATO = [GraduationCap, CalendarCheck, Users, MonitorPlay];

/**
 * El video de presentación y las piezas que lo acompañan.
 *
 * Los huecos sin `youtube` ni `archivo` se dibujan igual, marcados como
 * «próximamente»: así se ve dónde va cada video y basta pegar el id de
 * YouTube aquí para publicarlo.
 */
const VIDEO_PRINCIPAL: Pieza = {
  id: "presentacion",
  titulo: "Así se trabaja una sesión",
  pie: "Grupo completo, casos propios y acuerdos por escrito al cerrar.",
  poster: "/media/hero-poster.jpg",
  archivo: "/media/hero-bg.mp4",
};

const VIDEOS: Pieza[] = [
  {
    id: "testimonio",
    titulo: "Lo que dicen los equipos",
    pie: "Testimonio de un grupo al terminar el programa.",
    poster: "/ige/download-1.jpg",
  },
  {
    id: "muestra",
    titulo: "Clase muestra",
    pie: "Quince minutos de un curso grabado, abiertos.",
    poster: "/ige/serv2.png",
  },
  {
    id: "consultoria",
    titulo: "Cómo diagnosticamos",
    pie: "El recorrido de un diagnóstico organizacional.",
    poster: "/ige/download.jpg",
  },
];

/** Sección de contenido con tarjetas, con su entrada escalonada. */
function SeccionTarjetas({
  section,
  alterna,
  conIconos,
  accion,
}: {
  section: ChannelSection;
  alterna?: boolean;
  conIconos?: boolean;
  accion?: { label: string; href: string; externo?: boolean };
}) {
  const cabecera = useAparicion<HTMLDivElement>({ y: 22 });
  const tarjetas = useAparicionLista<HTMLDivElement>();

  return (
    <section id={section.id} className={`${s.seccion} ${alterna ? s.seccionAlt : ""}`}>
      <div className={s.limite}>
        <div className={s.cabecera} ref={cabecera}>
          {section.eyebrow && <p className={s.eyebrow}>{section.eyebrow}</p>}
          <h2>{section.title}</h2>
          <p className={s.cuerpo}>{section.body}</p>
        </div>

        {section.items && section.items.length > 0 && (
          <div className={s.tarjetas} ref={tarjetas}>
            {section.items.map((item, i) => {
              const Icono = ICONO_FORMATO[i % ICONO_FORMATO.length];
              return (
                <article key={item.title} className={s.tarjeta}>
                  {conIconos ? (
                    <span className={s.tarjetaIcono} aria-hidden>
                      <Icono size={18} strokeWidth={1.8} />
                    </span>
                  ) : (
                    <span className={s.tarjetaNum} aria-hidden>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  )}
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              );
            })}
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
      </div>
    </section>
  );
}

export function IgeLanding({
  channel,
  content,
  cursos = [],
}: {
  channel: ChannelDef;
  content: ChannelPageContent;
  cursos?: CursoVista[];
}) {
  const portada = useAparicion<HTMLDivElement>({ inmediato: true, y: 26, retraso: 80 });
  const academia = useAparicion<HTMLDivElement>({ y: 22 });
  const videoTexto = useAparicion<HTMLDivElement>({ y: 22 });
  const videoCaja = useAparicion<HTMLDivElement>({ y: 26, retraso: 120 });
  const cierre = useAparicion<HTMLDivElement>({ y: 24 });

  const seccion = (id: string) => content.sections.find((x) => x.id === id);
  const capacitacion = seccion("capacitacion");
  const consultoria = seccion("consultoria");
  const metodo = seccion("metodo");
  const especialidades = seccion("especialidades");
  const contacto = seccion("contacto");

  const envivo = cursos.filter((c) => c.formato === "vivo").length;
  const grabados = cursos.length - envivo;

  return (
    <div className={s.page}>
      {/* ---------- PORTADA ---------- */}
      <section className={s.hero} id="inicio" aria-label={`Inicio ${channel.name}`}>
        <video
          className={s.heroVideo}
          src="/media/hero-bg.mp4"
          poster="/media/hero-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
        />
        <div className={s.heroScrim} aria-hidden />

        <div className={s.heroInner} ref={portada}>
          <p className={s.kicker}>{content.hero.brand}</p>
          <TituloVivo texto={content.hero.headline} className={s.heroTitulo} />
          <p className={s.lead}>{content.hero.lead}</p>

          <div className={s.acciones}>
            <a className={s.btnPrimary} href="#academia">
              {cursos.length > 0 ? `Ver los ${cursos.length} cursos` : "Ver los cursos"}
              <ArrowRight size={17} aria-hidden />
            </a>
            <a className={s.btnGhost} href="#consultoria">
              Conocer la consultora
            </a>
          </div>

          <ul className={s.heroDatos}>
            <li>
              <strong>{envivo || "—"}</strong>
              <span>cursos en vivo, con tu gente</span>
            </li>
            <li>
              <strong>{grabados || "—"}</strong>
              <span>grabados, para avanzar hoy</span>
            </li>
            <li>
              <strong>En sitio</strong>
              <span>o en línea, según convenga</span>
            </li>
          </ul>
        </div>
      </section>

      {/* ---------- CINTA DE TEMAS ---------- */}
      <CintaTemas
        temas={cursos.map((c) => c.titulo)}
        etiqueta="Temas del catálogo"
      />

      {/* ---------- ACADEMIA ---------- */}
      <section id="academia" className={s.seccion}>
        <div className={s.limite}>
          <div className={s.cabecera} ref={academia}>
            <p className={s.eyebrow}>Academia</p>
            <h2>El catálogo completo, en vivo y grabado</h2>
            <p className={s.cuerpo}>
              Los cursos en vivo se dan con tu equipo, con los casos de tu operación y en tus
              instalaciones o en línea. Los grabados se toman cuando se pueda, con avance por
              lección. Elige el corte que te sirva.
            </p>
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
      </section>

      {/* ---------- FORMATOS DE IMPARTICIÓN ---------- */}
      {capacitacion && (
        <SeccionTarjetas
          section={capacitacion}
          alterna
          conIconos
          accion={{ label: "Pedir el calendario", href: "#contacto" }}
        />
      )}

      {/* ---------- VIDEO ---------- */}
      <section id="video" className={s.seccion}>
        <div className={`${s.limite} ${s.videoGrid}`}>
          <div ref={videoTexto}>
            <p className={s.eyebrow}>En video</p>
            <h2>Mira cómo se trabaja antes de contratar</h2>
            <p className={s.cuerpo}>
              Una sesión no se parece a un temario. Aquí dejamos la presentación, un testimonio y
              una clase muestra para que veas el tono con el que entramos a tu organización.
            </p>
            <a className={s.enlaceAccion} href="#contacto">
              Agendar una sesión de muestra
              <ArrowRight size={16} aria-hidden />
            </a>
          </div>
          <div ref={videoCaja}>
            <VideoAcademia principal={VIDEO_PRINCIPAL} piezas={VIDEOS} />
          </div>
        </div>
      </section>

      <Cifras
        datos={[
          { valor: `${cursos.length || "—"}`, etiqueta: "Cursos abiertos en el catálogo" },
          { valor: "En vivo", etiqueta: "Con tu equipo y tus casos, en sitio o en línea" },
          { valor: "A tu ritmo", etiqueta: "Los grabados avanzan por lección" },
          { valor: "Constancia", etiqueta: "Al terminar, con registro de asistencia" },
        ]}
      />

      {/* ---------- LA CONSULTORA ---------- */}
      {consultoria && (
        <section id="consultoria" className={`${s.seccion} ${s.consultora}`}>
          <div className={`${s.limite} ${s.consultoraGrid}`}>
            <div className={s.consultoraFoto}>
              <Image
                src="/ige/download.jpg"
                alt="Sesión de diagnóstico con un equipo de trabajo"
                width={900}
                height={600}
                className={s.foto}
              />
            </div>
            <div>
              <p className={s.eyebrow}>{consultoria.eyebrow ?? "La consultora"}</p>
              <h2>{consultoria.title}</h2>
              <p className={s.cuerpo}>{consultoria.body}</p>
              <ul className={s.listaConsultora}>
                {(consultoria.items ?? []).map((item) => (
                  <li key={item.title}>
                    <strong>{item.title}</strong>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
              <a
                className={s.enlaceAccion}
                href={whatsapp("Hola, me interesa un diagnóstico organizacional.")}
                target="_blank"
                rel="noopener noreferrer"
              >
                Pedir un diagnóstico
                <ArrowRight size={16} aria-hidden />
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ---------- MÉTODO ---------- */}
      {metodo && (
        <div>
          <Declaracion
            id={metodo.id}
            texto={metodo.title}
            pie={metodo.body}
            trama="curvas"
            compacta
          />
          <Pasos
            pegado
            pasos={(metodo.items ?? []).map((i) => ({ title: i.title, text: i.text }))}
          />
        </div>
      )}

      {/* ---------- ESPECIALIDADES ---------- */}
      {especialidades && (
        <SplitObra id={especialidades.id} obra={<RedEquipo />} inverso>
          <p className={s.eyebrow}>{especialidades.eyebrow}</p>
          <h2 className={s.tituloSplit}>{especialidades.title}</h2>
          <p className={s.cuerpo}>{especialidades.body}</p>
          <ul className={s.listaSplit}>
            {(especialidades.items ?? []).map((i) => (
              <li key={i.title}>
                <strong>{i.title}</strong>
                <span>{i.text}</span>
              </li>
            ))}
          </ul>
        </SplitObra>
      )}

      {/* ---------- CONTACTO ---------- */}
      <section id="contacto" className={`${s.seccion} ${s.contacto}`}>
        <div className={`${s.limite} ${s.contactoGrid}`} ref={cierre}>
          <div>
            <p className={s.eyebrow}>{contacto?.eyebrow ?? "Contacto"}</p>
            <h2>{contacto?.title ?? "Dinos qué necesita tu equipo"}</h2>
            <p className={s.cuerpo}>
              {contacto?.body ??
                "En una llamada corta definimos el formato, la duración y el costo cerrado."}
            </p>
            <div className={s.contactoAcciones}>
              <a
                className={s.btnPrimary}
                href={whatsapp("Hola, me interesa una propuesta de capacitación o consultoría.")}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={17} aria-hidden />
                Escribir por WhatsApp
              </a>
              <a className={s.btnGhost} href={mailto("Solicito una propuesta de capacitación")}>
                {CONTACTO.email}
              </a>
              <a className={s.btnGhost} href={tel()}>
                {CONTACTO.phoneDisplay}
              </a>
            </div>
          </div>

          <aside className={s.queIncluye} aria-label="Qué incluye la propuesta">
            <p className={s.queIncluyeTitulo}>Qué incluye la propuesta</p>
            <ol>
              <li>
                <span>01</span>Objetivos y temario sobre tu diagnóstico.
              </li>
              <li>
                <span>02</span>Duración, modalidad y calendario.
              </li>
              <li>
                <span>03</span>Costo cerrado, sin variables después.
              </li>
            </ol>
            <p className={s.queIncluyePie}>Sin costo y sin compromiso.</p>
          </aside>
        </div>
      </section>

      <BarraAccion
        tema="ige"
        titulo={cursos.length > 0 ? `${cursos.length} cursos abiertos` : "Catálogo de cursos"}
        nota="En vivo con tu equipo o grabados, a tu ritmo"
        principal={{ label: "Ver cursos", href: "#academia" }}
        secundario={{
          label: "WhatsApp",
          href: whatsapp("Hola, quiero información de los cursos y la consultoría."),
          externo: true,
        }}
      />
    </div>
  );
}
