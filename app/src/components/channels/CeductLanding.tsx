"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ChannelDef } from "@/lib/channels";
import type { ChannelPageContent } from "@/lib/channel-content";
import type { Diplomado } from "@/lib/diplomados-formato";
import { CONTACTO, mailto, tel, whatsapp } from "@/lib/contacto";
import { RejillaDiplomados } from "@/components/ceduct/Catalogo";
import { Cifras } from "./Secciones";
import { RutaRapida } from "./RutaRapida";
import { BarraAccion } from "./BarraAccion";
import { CintaEstandares } from "./CintaEstandares";
import { RutaCertificacion } from "./RutaCertificacion";
import { SelloClave, TramaCertificado } from "./arte";
import s from "./CeductLanding.module.css";

const LOGO = "/ceduct/logo-ceduct.png";

type Area = { slug: string; nombre: string; total: number };

/** Las secciones de contenido que esta portada compone a mano. */
const PROPIAS = new Set(["diplomados", "certificaciones", "estandares", "proceso", "contacto"]);

export function CeductLanding({
  channel,
  content,
  diplomados = [],
  areas = [],
}: {
  channel: ChannelDef;
  content: ChannelPageContent;
  diplomados?: Diplomado[];
  areas?: Area[];
}) {
  const reduce = useReducedMotion();

  const seccion = (id: string) => content.sections.find((x) => x.id === id);
  const certificaciones = seccion("certificaciones");
  const contacto = seccion("contacto");
  const diplomadosTxt = seccion("diplomados");
  const estandares = seccion("estandares");
  const otras = content.sections.filter((x) => !PROPIAS.has(x.id));

  return (
    <div className={s.page}>
      {/* ---------- Portada: manda el producto ---------- */}
      <section className={s.hero} aria-label={`Inicio ${channel.name}`}>
        <div className={s.heroMedia} aria-hidden>
          <TramaCertificado className={s.heroTrama} />
          <div className={s.heroScrim} />
          <div className={s.heroVignette} />
        </div>

        <motion.div
          className={s.heroCopy}
          initial={reduce ? false : { opacity: 0, y: 26 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className={s.heroTexto}>
            <p className={s.kicker}>{content.hero.brand}</p>
            <h1>{content.hero.headline}</h1>
            <p className={s.lead}>{content.hero.lead}</p>

            <div className={s.actions}>
              <a className={s.btnPrimary} href={content.hero.primaryCta.href}>
                {content.hero.primaryCta.label}
              </a>
              <a className={s.btnGhost} href={content.hero.secondaryCta.href}>
                {content.hero.secondaryCta.label}
              </a>
            </div>

          </div>

          {/* Quien llega resuelve aquí mismo cuál es su camino, sin bajar. */}
          <div className={s.heroRuta}>
            <RutaRapida total={diplomados.length} />
          </div>

          {/* CEDUCT aparece como aval, no como titular. */}
          <div className={s.aval}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO} alt="CEDUCT" className={s.avalLogo} width={480} height={270} />
            <p>
              Avalado por <strong>{channel.legalName}</strong>, Entidad de Certificación y
              Evaluación acreditada ante CONOCER con clave <strong>ECE 002-10</strong>.
            </p>
          </div>
        </motion.div>
      </section>

      <Cifras
        datos={[
          { valor: `${diplomados.length || "—"}`, etiqueta: "Diplomados abiertos a inscripción" },
          { valor: "ECE 002-10", etiqueta: "Clave de acreditación ante CONOCER" },
          { valor: "Vitalicio", etiqueta: "El certificado de competencia no caduca" },
          { valor: "15 min", etiqueta: "La llamada en que sabes qué estándar te toca" },
        ]}
      />

      <CintaEstandares nombres={(estandares?.items ?? []).map((i) => i.title)} />

      {/* ---------- El catálogo: lo principal ---------- */}
      <section className={s.catalogoWrap} id="diplomados">
        <motion.div
          className={s.catalogoIntro}
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-12% 0px" }}
          transition={{ duration: 0.55 }}
        >
          <p className={s.eyebrow}>{diplomadosTxt?.eyebrow ?? "Catálogo"}</p>
          <h2>{diplomadosTxt?.title ?? "Elige tu diplomado"}</h2>
          <p className={s.sectionBody}>
            {diplomadosTxt?.body ??
              "Cada programa indica a qué estándar de competencia te lleva, cuántas horas dura y en qué modalidad se cursa."}
          </p>
        </motion.div>

        {diplomados.length > 0 ? (
          <RejillaDiplomados diplomados={diplomados} areas={areas} />
        ) : (
          <p className={s.vacioCatalogo}>
            Estamos preparando la siguiente generación. Escríbenos y te avisamos en cuanto abran las
            inscripciones.
          </p>
        )}
      </section>

      {/* ---------- Ruta hacia el certificado, en tres etapas ---------- */}
      <RutaCertificacion />

      {/* ---------- Certificación directa ---------- */}
      {certificaciones && (
        <section className={`${s.section} ${s.sectionAccent}`} id="certificaciones">
          <div className={s.certGrid}>
            <motion.div
              className={s.certCopy}
              initial={reduce ? false : { opacity: 0, y: 20 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-12% 0px" }}
              transition={{ duration: 0.55 }}
            >
              <p className={s.eyebrow}>{certificaciones.eyebrow}</p>
              <h2>{certificaciones.title}</h2>
              <p className={s.sectionBody}>{certificaciones.body}</p>
              <div className={s.dualCtas}>
                <a className={s.btnPrimarySolid} href="#contacto">
                  Quiero certificarme
                </a>
                <a className={s.btnOutline} href="/verificar">
                  Verificar una constancia
                </a>
              </div>
            </motion.div>

            <div className={s.certItems}>
              {(certificaciones.items ?? []).map((item, i) => (
                <motion.article
                  key={item.title}
                  className={s.certItem}
                  data-num={String(i + 1).padStart(2, "0")}
                  initial={reduce ? false : { opacity: 0, y: 14 }}
                  whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                >
                  <span className={s.itemIndex} aria-hidden>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- Qué competencias certificamos ---------- */}
      {estandares && (
        <section className={s.section} id="estandares">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-12% 0px" }}
            transition={{ duration: 0.55 }}
          >
            <p className={s.eyebrow}>{estandares.eyebrow}</p>
            <h2>{estandares.title}</h2>
            <p className={s.sectionBody}>{estandares.body}</p>
          </motion.div>

          <ul className={s.estandares}>
            {(estandares.items ?? []).map((item, i) => (
              <motion.li
                key={item.title}
                className={s.estandar}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(i * 0.045, 0.36), duration: 0.35 }}
              >
                <span className={s.estandarNum} aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className={s.estandarNombre}>{item.title}</span>
                <a
                  className={s.estandarCta}
                  href={whatsapp(`Hola, me interesa certificarme en: ${item.title}.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Solicitar
                </a>
              </motion.li>
            ))}
          </ul>
        </section>
      )}

      {/* Cualquier sección extra que se agregue desde /admin/canales */}
      {otras.map((section) => (
        <motion.section
          key={section.id}
          id={section.id}
          className={s.section}
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-12% 0px" }}
          transition={{ duration: 0.55 }}
        >
          {section.eyebrow && <p className={s.eyebrow}>{section.eyebrow}</p>}
          <h2>{section.title}</h2>
          <p className={s.sectionBody}>{section.body}</p>
          {section.items && section.items.length > 0 && (
            <div className={s.items}>
              {section.items.map((item, i) => (
                <article key={item.title} className={s.item}>
                  <span className={s.itemIndex} aria-hidden>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          )}
        </motion.section>
      ))}

      {/* ---------- Aquí sí: quién respalda ---------- */}
      <section className={s.respaldo} id="respaldo">
        <motion.div
          className={s.respaldoGrid}
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-12% 0px" }}
          transition={{ duration: 0.55 }}
        >
          <div className={s.respaldoSello}>
            <SelloClave />
          </div>
          <div className={s.respaldoCopy}>
            <p className={s.eyebrow}>Quién respalda</p>
            <h2>{channel.legalName}</h2>
            <p className={s.sectionBody}>
              Entidad de Certificación y Evaluación acreditada ante el Consejo Nacional de
              Normalización y Certificación de Competencias Laborales (CONOCER) con clave{" "}
              <strong>ECE 002-10</strong>. Esa acreditación es la que da validez oficial a las
              constancias que emitimos y la que puedes verificar en cualquier momento.
            </p>
            <div className={s.respaldoMarca}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO} alt="CEDUCT" width={480} height={270} />
              <a className={s.btnOutline} href="/verificar">
                Verificar una constancia
              </a>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ---------- Contacto ---------- */}
      {contacto && (
        <section className={s.section} id="contacto">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-12% 0px" }}
            transition={{ duration: 0.55 }}
          >
            <p className={s.eyebrow}>{contacto.eyebrow}</p>
            <h2>{contacto.title}</h2>
            <p className={s.sectionBody}>{contacto.body}</p>
            <div className={s.dualCtas}>
              <a
                className={s.btnPrimarySolid}
                href={whatsapp("Hola, me interesan los diplomados y la certificación de competencias.")}
                target="_blank"
                rel="noopener noreferrer"
              >
                Escribir por WhatsApp
              </a>
              <a className={s.btnOutline} href={mailto("Informes sobre diplomados y certificación")}>
                {CONTACTO.email}
              </a>
              <a className={s.btnOutline} href={tel()}>
                {CONTACTO.phoneDisplay}
              </a>
            </div>
          </motion.div>
        </section>
      )}

      <BarraAccion total={diplomados.length} />
    </div>
  );
}
