"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ChannelDef } from "@/lib/channels";
import type { ChannelPageContent } from "@/lib/channel-content";
import { channelPublicUrl, getChannelPlatformCtas, type ChannelId } from "@/lib/channels";
import { CONTACTO, mailto, tel, whatsapp } from "@/lib/contacto";
import s from "./MartinLanding.module.css";

/** Enlace profundo desde una tarjeta de "líneas de trabajo" al canal correspondiente. */
const CANAL_POR_TITULO: Record<string, ChannelId> = {
  CEDUCT: "ceduct",
  "Psicología Aplicada": "psicologia",
  "Ingeniería de Grupos Efectivos": "ige",
};

export function MartinLanding({
  channel,
  content,
}: {
  channel: ChannelDef;
  content: ChannelPageContent;
}) {
  const reduce = useReducedMotion();
  const platformCtas = getChannelPlatformCtas(channel.id);
  const contacto = content.sections.find((x) => x.id === "contacto");
  const secciones = content.sections.filter((x) => x.id !== "contacto");

  const fade = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 26 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <div className={s.page}>
      {/* ---------- HERO ---------- */}
      <section className={s.hero} aria-label="Inicio Martín Hernández">
        <div className={s.heroGlow} aria-hidden />
        <motion.div className={s.heroCopy} {...fade}>
          <p className={s.kicker}>{content.hero.brand}</p>
          <h1 className={s.heroTitle}>
            Consultor. Valuador. <em>Certificador.</em>
          </h1>
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
            <li>Intervención directa, no delegada</li>
            <li>Confidencialidad absoluta</li>
          </ul>
        </motion.div>

        <motion.figure
          className={s.heroQuote}
          initial={reduce ? false : { opacity: 0, x: 22 }}
          animate={reduce ? undefined : { opacity: 1, x: 0 }}
          transition={{ duration: 0.75, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        >
          <blockquote>
            A las organizaciones no las detiene la falta de información. Las detiene no saber qué
            vale lo que ya tienen.
          </blockquote>
          <figcaption>Martín Hernández González</figcaption>
        </motion.figure>
      </section>

      {/* ---------- SECCIONES ---------- */}
      {secciones.map((section, idx) => (
        <motion.section
          key={section.id}
          id={section.id}
          className={`${s.section} ${idx % 2 === 1 ? s.sectionAlt : ""}`}
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
            <div className={s.items}>
              {section.items.map((item, i) => {
                const canal = section.id === "canales" ? CANAL_POR_TITULO[item.title] : undefined;
                return (
                  <motion.article
                    key={item.title}
                    className={s.item}
                    initial={reduce ? false : { opacity: 0, y: 16 }}
                    whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: Math.min(i * 0.07, 0.35), duration: 0.45 }}
                  >
                    <span className={s.itemIndex} aria-hidden>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                    {canal && (
                      <a className={s.itemCta} href={channelPublicUrl(canal)}>
                        Abrir canal →
                      </a>
                    )}
                  </motion.article>
                );
              })}
            </div>
          )}
        </motion.section>
      ))}

      {/* ---------- ACCESOS ---------- */}
      <section className={`${s.section} ${s.platform}`} id="plataforma">
        <div className={s.sectionHead}>
          <p className={s.eyebrow}>Accesos</p>
          <h2>Entrar por donde te corresponde</h2>
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
              href={whatsapp("Hola Martín, me gustaría agendar una conversación.")}
              target="_blank"
              rel="noopener noreferrer"
            >
              Escribir por WhatsApp
            </a>
            <a className={s.btnGhost} href={mailto("Quiero agendar una conversación")}>
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
