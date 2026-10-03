import type { Metadata } from "next";
import { CHANNELS, channelPublicUrl, type ChannelId } from "@/lib/channels";
import { CONTACTO, mailto } from "@/lib/contacto";
import h from "./hub.module.css";

export const metadata: Metadata = {
  title: "Martín Hernández González — Certificación, evaluación y formación",
  description:
    "Certificación de competencias laborales, evaluación y selección de personal, capacitación y consultoría organizacional.",
};

const ORDEN: ChannelId[] = ["ceduct", "psicologia", "ige", "martin"];

const TONO: Record<ChannelId, string> = {
  ceduct: "#5b89ad",
  psicologia: "#3fb59a",
  ige: "#e8524a",
  martin: "#d4a24c",
};

export default function HubPage() {
  return (
    <div className={h.page}>
      <div className={h.bg} aria-hidden />

      <main>
        <section className={`${h.wrap} ${h.head}`}>
          <p className={h.kicker}>Cuatro líneas de trabajo</p>
          <h1 className={h.title}>
            Decidir sobre tu gente <em>sin adivinar.</em>
          </h1>
          <p className={h.lead}>
            Certificamos competencias, evaluamos candidatos, formamos equipos y acompañamos a la
            dirección. Elige por dónde empezar.
          </p>
        </section>

        <section className={`${h.wrap} ${h.grid}`}>
          {ORDEN.map((id) => {
            const canal = CHANNELS[id];
            return (
              <a
                key={id}
                href={channelPublicUrl(id)}
                className={h.card}
                style={{ ["--tono" as string]: TONO[id] }}
              >
                <span className={h.cardRole}>{canal.accentLabel}</span>
                <span className={h.cardName}>{canal.name}</span>
                <span className={h.cardPitch}>{canal.description}</span>
                <span className={h.spacer} />
                <span className={h.cardCta}>Entrar →</span>
              </a>
            );
          })}
        </section>
      </main>

      <footer className={h.foot}>
        <div className={`${h.wrap} ${h.footInner}`}>
          <p className={h.footCopy}>
            <strong>¿No sabes cuál te corresponde?</strong> Escríbenos en una línea qué necesitas
            resolver y te decimos por dónde entrar.
          </p>
          <a className={h.footLink} href={mailto("Quiero saber qué servicio me corresponde")}>
            {CONTACTO.email}
          </a>
        </div>
      </footer>
    </div>
  );
}
