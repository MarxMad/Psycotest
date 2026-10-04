"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ChannelDef } from "@/lib/channels";
import type { ChannelPageContent } from "@/lib/channel-content";
import { getChannelPlatformCtas } from "@/lib/channels";
import { evaluacion } from "@/lib/routes";
import { CONTACTO, mailto, tel, whatsapp } from "@/lib/contacto";
import { Cifras, Cita, Declaracion, Pasos, SplitObra } from "./Secciones";
import { RadarBateria, SelloSociedad } from "./arte";
import s from "./PsicologiaLanding.module.css";

const INSTRUMENTOS = [
  {
    id: "papi",
    name: "Inventario de Personalidad",
    tag: "Rasgos y estilo de trabajo",
    time: "~20 min",
    blurb: "Cómo se conduce en el día a día: iniciativa, trato, tolerancia a la presión.",
  },
  {
    id: "hartman",
    name: "Axiología de Valores",
    tag: "Valores y motivación",
    time: "~15 min",
    blurb: "Qué lo mueve de verdad y si embona con la cultura de tu organización.",
  },
  {
    id: "mabe",
    name: "Toma de Decisiones",
    tag: "Criterio aplicado",
    time: "~25 min",
    blurb: "Qué información usa para decidir, qué riesgo acepta y qué tan consistente es.",
  },
  {
    id: "cleaver",
    name: "Compatibilidad Puesto–Persona",
    tag: "Ajuste al puesto",
    time: "~12 min",
    blurb: "Qué exige el puesto contra lo que la persona ofrece, y dónde habrá fricción.",
  },
  {
    id: "gerenciales",
    name: "Estilos Gerenciales",
    tag: "Conducción de equipos",
    time: "~15 min",
    blurb: "Cómo dirige, cómo delega y cómo sostiene el resultado con su equipo.",
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

            <div className={s.respaldo}>
              <SelloSociedad className={s.sello} />
              <div>
                <strong>Sociedad de Psicología Aplicada A.C.</strong>
                <span>
                  Instrumentos y criterios de interpretación respaldados por la asociación.
                </span>
              </div>
            </div>
          </motion.aside>
        </div>
      </section>

      <section id="acceso" className={`${s.section} ${s.acceso}`}>
        <p className={s.eyebrow}>Portal de acceso</p>
        <h2>¿Vienes a presentar tu evaluación?</h2>
        <p className={s.sectionBody}>
          La empresa que te convocó te envió un código. Con él entras directo a las pruebas que te
          corresponden — no necesitas crear cuenta ni preparar nada.
        </p>
        <div className={s.portalGrid}>
          <a className={s.portalCard} href={evaluacion.acceso}>
            <span className={s.portalTag}>Candidato</span>
            <h3>Tengo un código</h3>
            <p>
              Ingresa tu código y tus datos para comenzar. Puedes pausar y retomar donde te quedaste.
            </p>
            <span className={s.portalLink}>Ir a mi evaluación →</span>
          </a>
          <a className={`${s.portalCard} ${s.portalCardAdmin}`} href="#contacto">
            <span className={s.portalTag}>Empresas</span>
            <h3>Quiero evaluar candidatos</h3>
            <p>
              Te damos los códigos para tu proceso y el informe interpretado por un psicólogo en 72
              horas.
            </p>
            <span className={s.portalLink}>Solicitar una cotización →</span>
          </a>
        </div>
      </section>

      <SplitObra obra={<RadarBateria />}>
        <p className={s.eyebrow}>Por qué se leen juntos</p>
        <h2 className={s.tituloSplit}>Un instrumento solo no decide nada</h2>
        <p className={s.sectionBody}>
          Lo que importa no es cada eje por separado, sino la distancia entre lo que el puesto
          exige y lo que la persona ofrece. Esa brecha es la que se interpreta — y la que te dice
          dónde va a necesitar apoyo desde el primer mes.
        </p>
      </SplitObra>

      <Cifras
        datos={[
          { valor: "5", etiqueta: "Instrumentos que integran la batería completa" },
          { valor: "72 h", etiqueta: "Entrega del informe una vez aplicada" },
          { valor: "90 h", etiqueta: "Duración de los diplomados profesionales" },
          { valor: "En línea", etiqueta: "El candidato responde desde donde esté" },
        ]}
      />

      <section id="bateria" className={s.section}>
        <p className={s.eyebrow}>Instrumentos</p>
        <h2>Batería psicológica</h2>
        <p className={s.sectionBody}>
          Cinco instrumentos que se leen juntos. Según el puesto, aplicamos la batería completa o
          solo los que aportan a la decisión.
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
        );
      })}

      <section id="plataforma" className={`${s.section} ${s.platform}`}>
        <p className={s.eyebrow}>Siguiente paso</p>
        <h2>Por dónde empezar</h2>
        <p className={s.sectionBody}>
          Si ya traes código, entra directo. Si estás armando un proceso de selección, escríbenos y
          te decimos qué instrumentos aplican a esa vacante.
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

      <section id="contacto" className={`${s.section} ${s.contacto}`}>
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
            Escribir por WhatsApp
          </a>
          <a className={s.btnGhost} href={mailto("Solicito una evaluación de personal")}>
            {CONTACTO.email}
          </a>
          <a className={s.btnGhost} href={tel()}>
            {CONTACTO.phoneDisplay}
          </a>
        </div>
      </section>

    </div>
  );
}
