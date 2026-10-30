import Link from "next/link";
import { ArrowRight, ArrowUpRight, BadgeCheck, CreditCard, MousePointerClick, PlayCircle, Quote } from "lucide-react";
import {
  CATEGORIAS,
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
import { IconoDeCategoria } from "../Iconos";
import { Revelar } from "../Revelar";
import { TarjetaPrograma } from "../TarjetaPrograma";
import { HeroArte } from "./HeroArte";
import { Luz } from "./Luz";
import { Manifiesto } from "./Manifiesto";
import { Ruta } from "./Ruta";
import s from "../mk.module.css";
import l from "./landing.module.css";

const ICONOS_PASO = [MousePointerClick, CreditCard, PlayCircle];

function destacados(programas: Programa[], tipo: Programa["tipo"], n: number) {
  const delTipo = programas.filter((p) => p.tipo === tipo);
  const primero = delTipo.filter((p) => p.destacado);
  return [...primero, ...delTipo.filter((p) => !p.destacado)].slice(0, n);
}

export function Landing({ programas }: { programas: Programa[] }) {
  const diplomados = destacados(programas, "diplomado", 4);
  const certificaciones = destacados(programas, "certificacion", 4);
  const porCategoria = (slug: string) =>
    programas.filter((p) => p.tipo === "certificacion" && p.categoria === slug).length;

  // Los estándares reales del catálogo corren en la cinta del manifiesto.
  const estandares = [
    ...new Set(
      programas
        .filter((p) => p.tipo === "certificacion" && p.estandarClave)
        .map((p) => `${p.estandarClave} ${p.titulo}`),
    ),
  ];

  // El titular resalta su última palabra.
  const palabras = PROPUESTA.titular.split(" ");
  const ultima = palabras.pop();

  return (
    <>
      {/* ------------------------------------------------------- Hero */}
      <section className={l.hero} aria-labelledby="hero-titulo">
        <div className={l.heroFondo} aria-hidden />
        <div className={`${s.contenedor} ${l.heroRejilla}`}>
          <div className={l.heroTexto}>
            <p className={s.eyebrow}>Entidad acreditada CONOCER · ECE 002-10</p>
            <h1 id="hero-titulo" className={l.heroTitulo}>
              {palabras.join(" ")} <span className={l.resalte}>{ultima}</span>
            </h1>
            <p className={l.heroSub}>{PROPUESTA.subtitulo}</p>
            <div className={l.heroBotones}>
              <Link href={RUTAS.catalogo({ tipo: "diplomado" })} className={`${s.btn} ${s.btnPrimario} ${s.btnGrande}`}>
                Explorar cursos <ArrowRight size={18} aria-hidden />
              </Link>
              <Link href={RUTAS.catalogo({ tipo: "certificacion" })} className={`${s.btn} ${s.btnSecundario} ${s.btnGrande}`}>
                Ver certificaciones
              </Link>
            </div>
            <ul className={l.respaldo}>
              {RESPALDO.map((r) => (
                <li key={r.dato}>
                  <strong>{r.dato}</strong>
                  <span>{r.texto}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className={l.heroVisual}>
            <HeroArte />
          </div>
        </div>
      </section>

      <Manifiesto estandares={estandares.length ? estandares : ["ECE 002-10"]} />
      <Luz />

      {/* -------------------------------------------------- Categorías */}
      <section className={s.seccion} aria-labelledby="cat-titulo">
        <div className={s.contenedor}>
          <Revelar className={s.cabeceraSeccion}>
            <div>
              <p className={s.eyebrow}>Certificaciones por sector</p>
              <h2 id="cat-titulo" className={s.h2}>Encuentra tu estándar.</h2>
            </div>
            <Link href={RUTAS.catalogo({ tipo: "certificacion" })} className={`${s.btn} ${s.btnSecundario}`}>
              Todas las certificaciones <ArrowRight size={16} aria-hidden />
            </Link>
          </Revelar>

          <ul className={l.categorias}>
            {CATEGORIAS.map((c, i) => {
              const n = porCategoria(c.slug);
              return (
                <Revelar como="li" key={c.slug} retraso={i * 60}>
                  <Link
                    href={RUTAS.catalogo({ tipo: "certificacion", categoria: c.slug })}
                    className={`${s.tarjeta} ${s.tarjetaInteractiva} ${l.categoria}`}
                    style={{ "--tono": c.tono } as React.CSSProperties}
                  >
                    <span className={l.categoriaIcono}>
                      <IconoDeCategoria icono={c.icono} size={26} strokeWidth={1.8} />
                    </span>
                    <span className={l.categoriaTexto}>
                      <strong>{c.nombre}</strong>
                      <span>{c.resumen}</span>
                    </span>
                    <span className={l.categoriaPie}>
                      <span>{n} {n === 1 ? "estándar" : "estándares"}</span>
                      <ArrowUpRight size={18} aria-hidden />
                    </span>
                  </Link>
                </Revelar>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------ Diplomados destacados */}
      {diplomados.length > 0 && (
        <section className={`${s.seccion} ${s.seccionAlt}`} aria-labelledby="dip-titulo">
          <div className={s.contenedor}>
            <Revelar className={s.cabeceraSeccion}>
              <div>
                <p className={s.eyebrow}>Diplomados</p>
                <h2 id="dip-titulo" className={s.h2}>Aprende a fondo. Luego certifícate.</h2>
                <p className={s.lead}>
                  104 horas en modalidad mixta, virtual y presencial: 60% práctica y 40% teoría. Al
                  terminar puedes certificarte en el estándar que le corresponde.
                </p>
              </div>
              <Link href={RUTAS.catalogo({ tipo: "diplomado" })} className={`${s.btn} ${s.btnSecundario}`}>
                Ver diplomados <ArrowRight size={16} aria-hidden />
              </Link>
            </Revelar>
            <ul className={l.rejilla4}>
              {diplomados.map((p, i) => (
                <Revelar como="li" key={p.id} retraso={i * 80}>
                  <TarjetaPrograma programa={p} />
                </Revelar>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* -------------------------------------- Certificaciones destacadas */}
      {certificaciones.length > 0 && (
        <section className={s.seccion} aria-labelledby="cert-titulo">
          <div className={`${s.contenedor} ${l.certRejilla}`}>
            <Revelar className={l.certIntro}>
              <p className={s.eyebrow}>Certificaciones CONOCER</p>
              <h2 id="cert-titulo" className={s.h2}>Tu experiencia, con papel oficial.</h2>
              <p className={s.lead}>
                Una certificación no te enseña desde cero: evalúa lo que ya haces. Te preparamos,
                revisamos tus evidencias y, si resultas competente, recibes tu certificado SEP-CONOCER
                con validez en todo México.
              </p>
              <ul className={l.checks}>
                <li><BadgeCheck size={18} aria-hidden /> Taller de alineación incluido</li>
                <li><BadgeCheck size={18} aria-hidden /> Evaluador certificado asignado</li>
                <li><BadgeCheck size={18} aria-hidden /> Certificado verificable en línea</li>
              </ul>
              <Link href={RUTAS.catalogo({ tipo: "certificacion" })} className={`${s.btn} ${s.btnPrimario}`}>
                Ver certificaciones <ArrowRight size={16} aria-hidden />
              </Link>
            </Revelar>
            <ul className={l.rejilla2}>
              {certificaciones.map((p, i) => (
                <Revelar como="li" key={p.id} retraso={i * 80}>
                  <TarjetaPrograma programa={p} />
                </Revelar>
              ))}
            </ul>
          </div>
        </section>
      )}

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
