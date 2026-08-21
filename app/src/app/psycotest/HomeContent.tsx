"use client";

import Link from "next/link";
import { Clock, KeyRound, Layers, Shield } from "lucide-react";
import { AmbientBackground } from "@/components/AmbientBackground";
import { FadeIn, StaggerItem } from "@/components/motion";
import { APP_NAME } from "@/lib/brand";
import s from "./page.module.css";

const pruebas = [
  {
    slug: "papi",
    nombre: "PAPI",
    tagline: "Personalidad en 20 factores",
    sub: "Noventa pares de frases. En cada uno se elige la que describe mejor a la persona.",
    tint: "var(--papi)",
    facts: [
      ["Ítems", "90 pares"],
      ["Escala", "0–9"],
      ["Duración", "~20 min"],
    ],
    listo: true,
  },
  {
    slug: "hartman",
    nombre: "Hartman",
    tagline: "Jerarquía de valores",
    sub: "Dos partes de dieciocho enunciados, ordenados del que más valor tiene al que menos.",
    tint: "var(--hartman)",
    facts: [
      ["Ítems", "2 × 18"],
      ["Escala", "Niveles 1–7"],
      ["Duración", "~15 min"],
    ],
    listo: true,
  },
  {
    slug: "mabe",
    nombre: "MABE",
    tagline: "Persona vs. puesto",
    sub: "Preferencias de pensamiento y valores, evaluadas tanto en la persona como en el puesto.",
    tint: "var(--mabe)",
    facts: [
      ["Bloques", "4 · 144"],
      ["Escala", "1–5"],
      ["Duración", "~30 min"],
    ],
    listo: true,
  },
];

const pilares = [
  { icon: Layers, title: "Tres instrumentos", text: "PAPI, Hartman y MABE con motor de calificación integrado." },
  { icon: Clock, title: "Guardado continuo", text: "Borradores automáticos; retome donde se quedó." },
  { icon: Shield, title: "Acceso controlado", text: "Código único por lote; cupos limitados y trazabilidad." },
];

export function HomeContent() {
  return (
    <>
      <AmbientBackground />
      <main className={s.main}>
        <div className="wrap">
          <FadeIn className={s.hero}>
            <span className="eyebrow">Uso profesional</span>
            <h1>{APP_NAME}</h1>
            <p>
              Aplique, califique e interprete PAPI, Hartman y MABE desde un flujo diseñado para
              psicólogos. Captura en papel, transcripción digital, informe en panel.
            </p>
          </FadeIn>

          <FadeIn className={s.pilares} delay={0.08}>
            {pilares.map(({ icon: Icon, title, text }) => (
              <div key={title} className={s.pilar}>
                <span className={s.pilarIcon}>
                  <Icon size={18} strokeWidth={1.75} />
                </span>
                <div>
                  <strong>{title}</strong>
                  <span>{text}</span>
                </div>
              </div>
            ))}
          </FadeIn>

          <FadeIn className={s.sectionLabel} delay={0.12}>
            Instrumentos disponibles
          </FadeIn>

          <FadeIn delay={0.14}>
            <Link href="/psycotest/acceso" className={s.accesoBanner}>
              <KeyRound size={20} />
              <div>
                <strong>Soy aplicante — tengo un código</strong>
                <span>Ingresa tu código y datos para acceder a las pruebas autorizadas.</span>
              </div>
              <span className={s.go}>Acceder →</span>
            </Link>
          </FadeIn>

          <div className={s.grid}>
            {pruebas.map((p, i) => (
              <StaggerItem key={p.slug} index={i}>
                <Link
                  href="/psycotest/acceso"
                  className={s.card}
                  data-soon={!p.listo}
                  aria-disabled={!p.listo}
                  style={{ ["--tint" as string]: p.tint }}
                >
                  <div className={s.cardGlow} aria-hidden />
                  <div className={s.cardTop}>
                    <div>
                      <span className={s.name}>{p.nombre}</span>
                      <span className={s.tagline}>{p.tagline}</span>
                    </div>
                    <span className="chip">{p.listo ? "Listo" : "Próximo"}</span>
                  </div>
                  <p className={s.sub}>{p.sub}</p>
                  <div className={s.facts}>
                    {p.facts.map(([k, v]) => (
                      <div key={k} className={s.fact}>
                        <span>{k}</span>
                        <span>{v}</span>
                      </div>
                    ))}
                  </div>
                  <span className={s.go}>Requiere código →</span>
                </Link>
              </StaggerItem>
            ))}
          </div>

          <FadeIn className={s.note} delay={0.4}>
            <strong>Desarrollo activo.</strong> Falta validar calificaciones contra protocolos
            calificados a mano antes de emitir informes clínicos definitivos.
          </FadeIn>
        </div>
      </main>
    </>
  );
}
