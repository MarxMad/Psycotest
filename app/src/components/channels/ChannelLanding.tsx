"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ChannelDef } from "@/lib/channels";
import type { ChannelPageContent } from "@/lib/channel-content";
import {
  channelPublicUrl,
  getChannelPlatformCtas,
  type ChannelId,
} from "@/lib/channels";
import s from "./ChannelLanding.module.css";

export function ChannelLanding({
  channel,
  content,
}: {
  channel: ChannelDef;
  content: ChannelPageContent;
}) {
  const reduce = useReducedMotion();
  const platformCtas = getChannelPlatformCtas(channel.id);
  const fade = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 28 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <div className={`${s.page} ${s[channel.id]}`}>
      <section className={s.hero} aria-label="Inicio">
        <div
          className={s.heroMedia}
          style={
            content.hero.image
              ? { backgroundImage: `url(${content.hero.image})` }
              : undefined
          }
        />
        <div className={s.heroOverlay} />
        <motion.div className={s.heroCopy} {...fade}>
          <p className={s.eyebrow}>{content.hero.brand}</p>
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
      </section>

      {content.sections.map((section, idx) => (
        <motion.section
          key={section.id}
          id={section.id}
          className={s.section}
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.55, delay: Math.min(idx * 0.05, 0.2) }}
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
                  initial={reduce ? false : { opacity: 0, x: -12 }}
                  whileInView={reduce ? undefined : { opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                >
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                  {channel.id === "martin" && section.id === "canales" && (
                    <ChannelDeepLink title={item.title} />
                  )}
                </motion.article>
              ))}
            </div>
          )}
        </motion.section>
      ))}

      <motion.section
        id="plataforma"
        className={`${s.section} ${s.platform}`}
        initial={reduce ? false : { opacity: 0, y: 20 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10% 0px" }}
        transition={{ duration: 0.5 }}
      >
        <p className={s.eyebrow}>Continuar en la plataforma</p>
        <h2>Accesos directos</h2>
        <p className={s.sectionBody}>
          Sin duplicar motores: cada canal apunta a evaluación, CONOCER, cursos o live según su rol.
        </p>
        <div className={s.platformGrid}>
          {platformCtas.map((cta, i) => (
            <motion.a
              key={cta.href + cta.label}
              href={cta.href}
              className={s.platformCard}
              initial={reduce ? false : { opacity: 0, y: 12 }}
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

function ChannelDeepLink({ title }: { title: string }) {
  const map: Record<string, ChannelId> = {
    CEDUCT: "ceduct",
    "Psicología Aplicada": "psicologia",
    "Ingeniería de Grupos Efectivos": "ige",
  };
  const id = map[title];
  if (!id) return null;
  const href = channelPublicUrl(id);
  return (
    <a className={s.deepLink} href={href}>
      Abrir canal →
    </a>
  );
}
