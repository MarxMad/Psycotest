"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ChannelDef } from "@/lib/channels";
import type { ChannelPageContent } from "@/lib/channel-content";
import { getChannelPlatformCtas } from "@/lib/channels";
import { evaluacion } from "@/lib/routes";
import s from "./PsicologiaLanding.module.css";

const INSTRUMENTOS = [
  {
    id: "papi",
    name: "PAPI",
    tag: "Personalidad",
    time: "~20 min",
    blurb: "Factores conductuales por pares comparativos.",
  },
  {
    id: "hartman",
    name: "Hartman",
    tag: "Valores",
    time: "~15 min",
    blurb: "Jerarquía axiológica y estructura de prioridades.",
  },
  {
    id: "mabe",
    name: "MABE",
    tag: "Competencias",
    time: "~25 min",
    blurb: "Contraste persona–puesto y preferencias de pensamiento.",
  },
  {
    id: "cleaver",
    name: "Cleaver",
    tag: "DISC",
    time: "~12 min",
    blurb: "Estilo conductual y Factor Humano.",
  },
] as const;

export function PsicologiaLanding({
  channel,
  content,
}: {
  channel: ChannelDef;
  content: ChannelPageContent;
}) {
  const reduce = useReducedMotion();
  const platformCtas = getChannelPlatformCtas(channel.id);

  return (
    <div className={s.page}>
      <section className={s.hero} aria-label="Inicio Psicología Aplicada">
        <div className={s.heroGlow} aria-hidden />
        <div className={s.heroGrid}>
          <motion.div
            className={s.copy}
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className={s.kicker}>{content.hero.brand}</p>
            <h1>{content.hero.headline}</h1>
            <p className={s.lead}>{content.hero.lead}</p>
            <div className={s.actions}>
              <a className={s.btnPrimary} href="#acceso">
                {content.hero.primaryCta.label}
              </a>
              <a className={s.btnGhost} href={content.hero.secondaryCta.href}>
                {content.hero.secondaryCta.label}
              </a>
            </div>
          </motion.div>

          <motion.aside
            className={s.heroPanel}
            initial={reduce ? false : { opacity: 0, x: 20 }}
            animate={reduce ? undefined : { opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            aria-label="Resumen de batería"
          >
            <p className={s.panelEyebrow}>Batería activa</p>
            <ul className={s.panelList}>
              {INSTRUMENTOS.map((item, i) => (
                <li key={item.id}>
                  <span className={s.panelIndex}>{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <strong>{item.name}</strong>
                    <em>{item.tag}</em>
                  </div>
                  <span className={s.panelTime}>{item.time}</span>
                </li>
              ))}
            </ul>
            <a className={s.panelCta} href={evaluacion.acceso}>
              Entrar con código →
            </a>
          </motion.aside>
        </div>
      </section>

      <section id="acceso" className={`${s.section} ${s.acceso}`}>
        <p className={s.eyebrow}>Portal de acceso</p>
        <h2>Dos entradas. Un solo panel operativo.</h2>
        <p className={s.sectionBody}>
          El candidato aplica con código. El psicólogo gestiona pruebas, códigos y resultados desde el
          admin — sin sitios separados.
        </p>
        <div className={s.portalGrid}>
          <a className={s.portalCard} href={evaluacion.acceso}>
            <span className={s.portalTag}>Candidato</span>
            <h3>Tengo un código</h3>
            <p>
              Ingresa tu código de acceso para aplicar las pruebas autorizadas (PAPI, Hartman, MABE,
              Cleaver).
            </p>
            <span className={s.portalLink}>Ir a evaluación →</span>
          </a>
          <a className={`${s.portalCard} ${s.portalCardAdmin}`} href="/login?next=/admin/pruebas">
            <span className={s.portalTag}>Psicólogo / Admin</span>
            <h3>Gestionar pruebas y códigos</h3>
            <p>
              Emite códigos, revisa sesiones y exporta informes desde el panel único de Sistema Psic.
            </p>
            <span className={s.portalLink}>Abrir panel →</span>
          </a>
        </div>
        <div className={s.adminShortcuts}>
          <a href="/admin/pruebas/codigos">Códigos de acceso</a>
          <a href="/admin/pruebas">Sesiones y resultados</a>
          <a href={evaluacion.participantes}>Participantes</a>
        </div>
      </section>

      <section id="bateria" className={s.section}>
        <p className={s.eyebrow}>Instrumentos</p>
        <h2>Batería psicológica</h2>
        <p className={s.sectionBody}>
          Cada prueba se habilita por código desde el admin. El candidato solo ve lo autorizado.
        </p>
        <div className={s.battery}>
          {INSTRUMENTOS.map((item, i) => (
            <motion.a
              key={item.id}
              href={evaluacion.acceso}
              className={s.batteryCard}
              initial={reduce ? false : { opacity: 0, y: 14 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
            >
              <span className={s.batteryName}>{item.name}</span>
              <span className={s.batteryTag}>{item.tag}</span>
              <p>{item.blurb}</p>
              <span className={s.batteryMeta}>{item.time}</span>
            </motion.a>
          ))}
        </div>
      </section>

      {content.sections.map((section, idx) => (
        <motion.section
          key={section.id}
          id={section.id}
          className={`${s.section} ${idx % 2 === 1 ? s.sectionAlt : ""}`}
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.5 }}
        >
          {section.eyebrow && <p className={s.eyebrow}>{section.eyebrow}</p>}
          <h2>{section.title}</h2>
          <p className={s.sectionBody}>{section.body}</p>
          {section.items && section.items.length > 0 && (
            <div className={s.items}>
              {section.items.map((item) => (
                <article key={item.title} className={s.item}>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          )}
        </motion.section>
      ))}

      <section id="plataforma" className={`${s.section} ${s.platform}`}>
        <p className={s.eyebrow}>Operación</p>
        <h2>Todo ligado al admin</h2>
        <p className={s.sectionBody}>
          Códigos, sesiones, informes y diplomados viven en el mismo panel. Este canal solo orienta.
        </p>
        <div className={s.platformGrid}>
          {platformCtas.map((cta) => (
            <a key={cta.href + cta.label} href={cta.href} className={s.platformCard}>
              <strong>{cta.label}</strong>
              <span>{cta.hint}</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
