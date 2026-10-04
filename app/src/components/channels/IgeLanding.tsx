"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ChannelDef } from "@/lib/channels";
import type { ChannelPageContent } from "@/lib/channel-content";
import { getChannelPlatformCtas } from "@/lib/channels";
import { CONTACTO, mailto, tel, whatsapp } from "@/lib/contacto";
import { Cifras, Cita, Declaracion, Pasos, SplitObra } from "./Secciones";
import { RedEquipo } from "./arte";
import s from "./IgeLanding.module.css";

/** Secciones que se pintan como pasos numerados en lugar de tarjetas. */
const SECCIONES_PASOS = new Set(["metodo"]);

export function IgeLanding({
  channel,
  content,
}: {
  channel: ChannelDef;
  content: ChannelPageContent;
}) {
  const reduce = useReducedMotion();
  const platformCtas = getChannelPlatformCtas(channel.id);
  const secciones = content.sections.filter((x) => x.id !== "contacto");
  const contacto = content.sections.find((x) => x.id === "contacto");

  const fade = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 26 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <div className={s.page}>
      {/* ---------- HERO ---------- */}
      <section className={s.hero} aria-label="Inicio Ingeniería de Grupos Efectivos">
        <div
          className={s.heroMedia}
          style={content.hero.image ? { backgroundImage: `url(${content.hero.image})` } : undefined}
          aria-hidden
        />
        <div className={s.heroScrim} aria-hidden />
        <div className={s.heroRules} aria-hidden />

        <motion.div className={s.heroCopy} {...fade}>
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
          <ul className={s.heroTrust}>
            <li>Sector público e iniciativa privada</li>
            <li>En tus instalaciones o en línea</li>
            <li>Programa a la medida</li>
          </ul>
        </motion.div>
      </section>

      {/* ---------- SECCIONES ---------- */}
      {secciones.map((section, idx) => {
        if (SECCIONES_PASOS.has(section.id)) {
          return (
            <div key={section.id}>
              <Declaracion
                id={section.id}
                texto={section.title}
                pie={section.body}
                trama="curvas"
                compacta
              />
              <Pasos
                pegado
                pasos={(section.items ?? []).map((i) => ({ title: i.title, text: i.text }))}
              />
            </div>
          );
        }

        if (section.id === "especialidades") {
          return (
            <SplitObra key={section.id} id={section.id} obra={<RedEquipo />} inverso>
              <p className={s.eyebrow}>{section.eyebrow}</p>
              <h2 className={s.tituloSplit}>{section.title}</h2>
              <p className={s.sectionBody}>{section.body}</p>
              <ul className={s.listaSplit}>
                {(section.items ?? []).map((i) => (
                  <li key={i.title}>
                    <strong>{i.title}</strong>
                    <span>{i.text}</span>
                  </li>
                ))}
              </ul>
            </SplitObra>
          );
        }

        const pasos = false;
        return (
          <motion.section
            key={section.id}
            id={section.id}
            className={`${s.section} ${idx % 2 === 1 ? s.sectionAlt : ""} ${pasos ? s.sectionPasos : ""}`}
            initial={reduce ? false : { opacity: 0, y: 22 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.55 }}
          >
            <div className={s.sectionHead}>
              {section.eyebrow && <p className={s.eyebrow}>{section.eyebrow}</p>}
              <h2>{section.title}</h2>
              <p className={s.sectionBody}>{section.body}</p>
            </div>

            {section.items && section.items.length > 0 && (
              <div className={pasos ? s.pasos : s.items}>
                {section.items.map((item, i) => (
                  <motion.article
                    key={item.title}
                    className={pasos ? s.paso : s.item}
                    initial={reduce ? false : { opacity: 0, y: 16 }}
                    whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: Math.min(i * 0.07, 0.35), duration: 0.45 }}
                  >
                    {pasos && (
                      <span className={s.pasoNum} aria-hidden>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    )}
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                    {!pasos && (
                      <a className={s.itemCta} href="#contacto">
                        Cotizar →
                      </a>
                    )}
                  </motion.article>
                ))}
              </div>
            )}
          </motion.section>
        );
      })}

      {/* ---------- ACCESOS ---------- */}
      <section className={`${s.section} ${s.platform}`} id="plataforma">
        <div className={s.sectionHead}>
          <p className={s.eyebrow}>Empezar hoy</p>
          <h2>Formación que arranca sin esperar al grupo</h2>
          <p className={s.sectionBody}>
            Si tu equipo necesita avanzar ya, tenemos cursos grabados con avance por lección y
            sesiones en vivo con calendario.
          </p>
        </div>
        <div className={s.platformGrid}>
          {platformCtas.map((cta) => (
            <a key={cta.href + cta.label} href={cta.href} className={s.platformCard}>
              <strong>{cta.label}</strong>
              <span>{cta.hint}</span>
            </a>
          ))}
        </div>
      </section>

      {/* ---------- CONTACTO ---------- */}
      {contacto && (
        <section className={`${s.section} ${s.contacto}`} id="contacto">
          <div className={s.sectionHead}>
            <p className={s.eyebrow}>{contacto.eyebrow}</p>
            <h2>{contacto.title}</h2>
            <p className={s.sectionBody}>{contacto.body}</p>
          </div>
          <div className={s.contactoActions}>
            <a
              className={s.btnPrimary}
              href={whatsapp("Hola, me interesa una propuesta de capacitación o consultoría.")}
              target="_blank"
              rel="noopener noreferrer"
            >
              Escribir por WhatsApp
            </a>
            <a className={s.btnGhost} href={mailto("Solicito una propuesta de capacitación")}>
              {CONTACTO.email}
            </a>
            <a className={s.btnGhost} href={tel()}>
              {CONTACTO.phoneDisplay}
            </a>
          </div>
        </section>
      )}
    </div>
  );
}
