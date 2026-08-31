"use client";

import Link from "next/link";
import { Clock, KeyRound, Layers, Shield, GraduationCap, Video, Award, FlaskConical } from "lucide-react";
import { AmbientBackground } from "@/components/AmbientBackground";
import { FadeIn, StaggerItem } from "@/components/motion";
import { APP_NAME } from "@/lib/brand";
import s from "./page.module.css";

const servicios = [
  {
    icon: FlaskConical,
    titulo: "Pruebas Psicométricas",
    descripcion: "Aplique, califique e interprete PAPI, Hartman y MABE con motor integrado.",
    href: "/acceso",
    color: "var(--papi)",
    badge: "3 instrumentos",
  },
  {
    icon: GraduationCap,
    titulo: "Cursos Online",
    descripcion: "Plataforma LMS completa con gestión de estudiantes, lecciones y certificaciones.",
    href: "/admin/cursos",
    color: "var(--hartman)",
    badge: "Próximamente",
  },
  {
    icon: Video,
    titulo: "Clases en Vivo",
    descripcion: "Sistema propio de videoclases con pizarra interactiva, chat y grabación.",
    href: "/admin/clases-vivo",
    color: "var(--mabe)",
    badge: "Meet propio",
  },
  {
    icon: Award,
    titulo: "Certificaciones",
    descripcion: "Emita certificados digitales verificables para cursos y capacitaciones.",
    href: "/admin",
    color: "var(--accent)",
    badge: "Próximamente",
  },
];

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
  { 
    icon: Layers, 
    title: "Plataforma integral", 
    text: "Tests, cursos, clases en vivo y certificaciones en un solo lugar." 
  },
  { 
    icon: Clock, 
    title: "Guardado continuo", 
    text: "Borradores automáticos; retome donde se quedó." 
  },
  { 
    icon: Shield, 
    title: "Acceso controlado", 
    text: "Código único por lote; cupos limitados y trazabilidad." 
  },
];

export function HomeContent() {
  return (
    <>
      <AmbientBackground />
      <main className={s.main}>
        <div className="wrap">
          <FadeIn className={s.hero}>
            <span className="eyebrow">Plataforma integral para psicólogos</span>
            <h1>{APP_NAME}</h1>
            <p>
              Plataforma todo-en-uno: aplique pruebas psicométricas, imparta cursos online,
              realice clases en vivo y emita certificaciones profesionales.
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
            Servicios disponibles
          </FadeIn>

          <div className={s.serviciosGrid}>
            {servicios.map((servicio, i) => (
              <StaggerItem key={servicio.titulo} index={i}>
                <Link
                  href={servicio.href}
                  className={s.servicioCard}
                  style={{ ["--tint" as string]: servicio.color }}
                >
                  <div className={s.cardGlow} aria-hidden />
                  <div className={s.servicioIcon}>
                    <servicio.icon size={24} strokeWidth={1.75} />
                  </div>
                  <div className={s.servicioContent}>
                    <div className={s.servicioHeader}>
                      <h3>{servicio.titulo}</h3>
                      <span className="chip">{servicio.badge}</span>
                    </div>
                    <p>{servicio.descripcion}</p>
                  </div>
                  <span className={s.go}>Explorar →</span>
                </Link>
              </StaggerItem>
            ))}
          </div>

          <FadeIn className={s.sectionLabel} delay={0.2} style={{ marginTop: "4rem" }}>
            Instrumentos psicométricos
          </FadeIn>

          <FadeIn delay={0.24}>
            <Link href="/acceso" className={s.accesoBanner}>
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
                  href="/acceso"
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

          <FadeIn className={s.ctaSection} delay={0.5}>
            <h2>Panel de administración profesional</h2>
            <p>
              Gestione pruebas, cursos, clases en vivo y usuarios desde un panel unificado con
              interpretaciones detalladas y reportes completos.
            </p>
            <Link href="/login" className="btn btn-primary btn-lg">
              Acceso profesional →
            </Link>
          </FadeIn>

          <FadeIn className={s.note} delay={0.6}>
            <strong>Plataforma en desarrollo activo.</strong> Algunos servicios están en fase de
            implementación. Contacta para más información sobre disponibilidad.
          </FadeIn>
        </div>
      </main>
    </>
  );
}
