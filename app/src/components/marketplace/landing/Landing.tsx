import Link from "next/link";
import { ArrowRight, CreditCard, MousePointerClick, PlayCircle, Quote } from "lucide-react";
import {
  PASOS,
  PREGUNTAS,
  PROPUESTA,
  RESPALDO,
  TESTIMONIOS,
  TESTIMONIOS_SON_EJEMPLO,
} from "@/lib/ceduct/config";
import { RUTAS } from "@/lib/ceduct/rutas";
import type { Programa } from "@/lib/ceduct/tipos";
import { Acordeon } from "../Acordeon";
import { Revelar } from "../Revelar";
import { Certificado } from "./Certificado";
import { Escenarios } from "./Escenarios";
import { Luz } from "./Luz";
import { Manifiesto } from "./Manifiesto";
import { Ruta } from "./Ruta";
import s from "../mk.module.css";
import l from "./landing.module.css";

const ICONOS_PASO = [MousePointerClick, CreditCard, PlayCircle];

export function Landing({ programas }: { programas: Programa[] }) {
  // Los estándares reales del catálogo corren en la cinta del manifiesto.
  const estandares = [
    ...new Set(
      programas
        .filter((p) => p.tipo === "certificacion" && p.estandarClave)
        .map((p) => `${p.estandarClave} ${p.titulo}`),
    ),
  ];

  // El punto final del titular va en el color de acento.
  const titular = PROPUESTA.titular.replace(/\.$/, "");
  const punto = PROPUESTA.titular.endsWith(".") ? "." : "";

  return (
    <>
      {/* ------------------------------------------------------- Hero */}
      <section className={l.hero} aria-labelledby="hero-titulo">
        <div className={`${s.contenedor} ${l.heroRejilla}`}>
          <div className={l.heroTexto}>
            <p className={l.heroMeta}>
              <span>Entidad de Certificación y Evaluación</span>
              <span>Acreditación CONOCER ECE 002-10</span>
            </p>
            <h1 id="hero-titulo" className={l.heroTitulo}>
              {titular}
              <span className={l.heroPunto}>{punto}</span>
            </h1>
            <p className={l.heroSub}>{PROPUESTA.subtitulo}</p>
            <div className={l.heroBotones}>
              <Link href={RUTAS.catalogo({ tipo: "certificacion" })} className={`${s.btn} ${s.btnPrimario} ${s.btnGrande} ${l.heroBtn}`}>
                Ver certificaciones <ArrowRight size={18} aria-hidden />
              </Link>
              <Link href={RUTAS.catalogo({ tipo: "diplomado" })} className={l.heroEnlace}>
                o empieza con un diplomado
              </Link>
            </div>
          </div>
          <div className={l.heroVisual}>
            <Certificado />
          </div>
        </div>

        <div className={s.contenedor}>
          <dl className={l.heroDatos}>
            {estandares.length > 0 && (
              <div>
                <dt>{estandares.length}</dt>
                <dd>estándares de competencia en el catálogo</dd>
              </div>
            )}
            {RESPALDO.map((r) => (
              <div key={r.dato}>
                <dt>{r.dato}</dt>
                <dd>{r.texto}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <Manifiesto estandares={estandares.length ? estandares : ["ECE 002-10"]} />
      <Luz />

      {/* Todo el catálogo en una sola pieza: antes eran tres secciones
          (sectores, diplomados y certificaciones) que se veían iguales. */}
      <Escenarios programas={programas} />

      {/* ---------------------------------------------- Cómo funciona */}
      <section className={`${s.seccion} ${s.seccionAlt}`} aria-labelledby="pasos-titulo">
        <div className={s.contenedor}>
          <Revelar className={s.cabeceraSeccion}>
            <div>
              <p className={s.eyebrow}>Cómo funciona</p>
              <h2 id="pasos-titulo" className={s.h2}>Tres pasos. Cero vueltas.</h2>
            </div>
          </Revelar>
          <ol className={l.pasos}>
            {PASOS.map((p, i) => {
              const Icono = ICONOS_PASO[i];
              return (
                <Revelar como="li" key={p.titulo} retraso={i * 100} className={l.paso}>
                  <span className={l.pasoNum} aria-hidden>0{i + 1}</span>
                  <span className={l.pasoIcono}><Icono size={24} aria-hidden /></span>
                  <h3>{p.titulo}</h3>
                  <p>{p.texto}</p>
                </Revelar>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------------- Ruta */}
      <Ruta />

      {/* ------------------------------------------------- Testimonios */}
      <section className={s.seccion} aria-labelledby="test-titulo">
        <div className={s.contenedor}>
          <Revelar className={s.cabeceraSeccion}>
            <div>
              <p className={s.eyebrow}>Alumnos</p>
              <h2 id="test-titulo" className={s.h2}>Lo que cambia después.</h2>
            </div>
            {TESTIMONIOS_SON_EJEMPLO && (
              <p className={s.avisoDemo}>Testimonios de ejemplo: sustituir por testimonios reales.</p>
            )}
          </Revelar>
          <ul className={l.testimonios}>
            {TESTIMONIOS.map((t, i) => (
              <Revelar como="li" key={i} retraso={i * 90}>
                <figure className={`${s.tarjeta} ${l.testimonio}`}>
                  <Quote size={28} className={l.comillas} aria-hidden />
                  <blockquote>{t.texto}</blockquote>
                  <figcaption>
                    <strong>{t.nombre}</strong>
                    <span>{t.rol}</span>
                    <span className={l.testimonioPrograma}>{t.programa}</span>
                  </figcaption>
                </figure>
              </Revelar>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------------------------------------------------------- FAQ */}
      <section className={`${s.seccion} ${s.seccionAlt}`} aria-labelledby="faq-titulo">
        <div className={`${s.contenedor} ${l.faq}`}>
          <Revelar className={l.faqIntro}>
            <p className={s.eyebrow}>Preguntas frecuentes</p>
            <h2 id="faq-titulo" className={s.h2}>Antes de inscribirte.</h2>
            <p className={s.lead}>¿Te queda alguna duda? Escríbenos y te respondemos el mismo día hábil.</p>
            <Link href={RUTAS.contacto} className={`${s.btn} ${s.btnSecundario}`}>
              Contactar a un asesor
            </Link>
          </Revelar>
          <Acordeon
            unoALaVez
            abiertoInicial={0}
            items={PREGUNTAS.map((p) => ({ titulo: p.pregunta, contenido: <p>{p.respuesta}</p> }))}
          />
        </div>
      </section>

      {/* ------------------------------------------------- CTA final */}
      <section className={l.cta} aria-labelledby="cta-titulo">
        <div className={s.contenedor}>
          <Revelar className={l.ctaCaja}>
            <h2 id="cta-titulo" className={l.ctaTitulo}>
              Tu siguiente certificado empieza <span className={l.resalte}>hoy.</span>
            </h2>
            <p className={s.lead}>{PROPUESTA.publico}</p>
            <div className={l.heroBotones}>
              <Link href={RUTAS.catalogo()} className={`${s.btn} ${s.btnPrimario} ${s.btnGrande}`}>
                Explorar el catálogo <ArrowRight size={18} aria-hidden />
              </Link>
              <Link href={RUTAS.empresas} className={`${s.btn} ${s.btnSecundario} ${s.btnGrande}`}>
                Soy empresa
              </Link>
            </div>
          </Revelar>
        </div>
      </section>
    </>
  );
}
