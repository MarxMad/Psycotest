"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ChannelDef } from "@/lib/channels";
import type { ChannelPageContent } from "@/lib/channel-content";
import { getChannelPlatformCtas } from "@/lib/channels";
import s from "./CeductLanding.module.css";

export function CeductLanding({
  channel,
  content,
}: {
  channel: ChannelDef;
  content: ChannelPageContent;
}) {
  const reduce = useReducedMotion();
  const platformCtas = getChannelPlatformCtas(channel.id);
  const logo = channel.logo || content.hero.image || "/ceduct/hqdefault.jpg";

  return (
    <div className={s.page}>
      <section className={s.hero} aria-label="Inicio CEDUCT">
        <div className={s.heroPattern} aria-hidden />
        <div className={s.heroGrid}>
          <motion.div
            className={s.sealCol}
            initial={reduce ? false : { opacity: 0, scale: 0.92 }}
            animate={reduce ? undefined : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={s.sealRing}>
              <img
                src={logo}
                alt="Logo CEDUCT ECE 002-10"
                className={s.logo}
                width={320}
                height={320}
              />
            </div>
            <p className={s.sealCaption}>Entidad de Certificación y Evaluación</p>
          </motion.div>

          <motion.div
            className={s.copyCol}
            initial={reduce ? false : { opacity: 0, y: 28 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className={s.kicker}>{content.hero.brand}</p>
            <p className={s.eceCode} aria-label="Clave de acreditación">
              <span className={s.eceLabel}>Clave</span>
              <span className={s.eceValue}>ECE 002-10</span>
            </p>
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
          </motion.div>
        </div>
      </section>

      {content.sections.map((section, idx) => (
        <motion.section
          key={section.id}
          id={section.id}
          className={`${s.section} ${section.id === "certificaciones" ? s.sectionAccent : ""}`}
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-12% 0px" }}
          transition={{ duration: 0.55, delay: Math.min(idx * 0.04, 0.16) }}
        >
          {section.eyebrow && <p className={s.eyebrow}>{section.eyebrow}</p>}
          <h2>{section.title}</h2>
          <p className={s.sectionBody}>{section.body}</p>
          {section.items && section.items.length > 0 && (
            <div className={s.items}>
              {section.items.map((item, i) => (
                <motion.article
                  key={item.title}
                  className={s.item}
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
          )}
          {section.id === "diplomados" && (
            <a className={s.inlineCta} href="/consultorio/cursos">
              Ir al catálogo de diplomados →
            </a>
          )}
          {section.id === "certificaciones" && (
            <div className={s.dualCtas}>
              <a className={s.btnPrimary} href="/consultorio/expediente">
                Gestionar expedientes
              </a>
              <a className={s.btnGhost} href="/consultorio/constancias">
                Constancias
              </a>
            </div>
          )}
        </motion.section>
      ))}

      <motion.section
        id="plataforma"
        className={`${s.section} ${s.platform}`}
        initial={reduce ? false : { opacity: 0, y: 18 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <p className={s.eyebrow}>Operación ECE 002-10</p>
        <h2>Accesos de gestión</h2>
        <p className={s.sectionBody}>
          Diplomados, expedientes y constancias en la plataforma compartida — sin duplicar motores.
        </p>
        <div className={s.platformGrid}>
          {platformCtas.map((cta, i) => (
            <motion.a
              key={cta.href + cta.label}
              href={cta.href}
              className={s.platformCard}
              initial={reduce ? false : { opacity: 0, y: 10 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.35 }}
            >
              <strong>{cta.label}</strong>
              <span>{cta.hint}</span>
            </motion.a>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
