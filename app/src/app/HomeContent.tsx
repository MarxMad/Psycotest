"use client";

import Link from "next/link";
import { Clock, KeyRound, Layers, Shield, GraduationCap, Video, Award, FlaskConical } from "lucide-react";
import { AmbientBackground } from "@/components/AmbientBackground";
import { FadeIn, StaggerItem } from "@/components/motion";
import { APP_NAME } from "@/lib/brand";
import s from "./page.module.css";

const servicios = [
  {
    icon: Award,
    titulo: "Certificaciones Profesionales",
    descripcion: "Emita certificados digitales verificables para cursos, capacitaciones y evaluaciones.",
    href: "/admin",
    color: "var(--accent)",
    badge: "Principal",
  },
  {
    icon: FlaskConical,
    titulo: "Evaluaciones Psicométricas",
    descripcion: "Herramientas de evaluación de personalidad, valores y competencias con análisis detallado.",
    href: "/acceso",
    color: "var(--papi)",
    badge: "3 instrumentos",
  },
  {
    icon: GraduationCap,
    titulo: "Cursos Online",
    descripcion: "Plataforma LMS completa con gestión de estudiantes, lecciones y progreso.",
    href: "/admin/cursos",
    color: "var(--hartman)",
    badge: "Disponible",
  },
  {
    icon: Video,
    titulo: "Clases en Vivo",
    descripcion: "Sistema propio de videoclases con pizarra interactiva, chat y grabación.",
    href: "/admin/clases-vivo",
    color: "var(--mabe)",
    badge: "Meet propio",
  },
];

const evaluaciones = [
  {
    slug: "personalidad",
    nombre: "Evaluación de Personalidad",
    tagline: "Rasgos y factores conductuales",
    sub: "Evaluación profunda de características de personalidad, estilos de comportamiento y preferencias en el ámbito laboral y personal.",
    tint: "var(--papi)",
    facts: [
      ["Áreas", "20 factores"],
      ["Formato", "Pares comparativos"],
      ["Duración", "~20 min"],
    ],
    listo: true,
  },
  {
    slug: "valores",
    nombre: "Jerarquía de Valores",
    tagline: "Sistema axiológico personal",
    sub: "Evaluación de la estructura de valores y prioridades personales mediante análisis de preferencias y jerarquización.",
    tint: "var(--hartman)",
    facts: [
      ["Dimensiones", "3 niveles"],
      ["Formato", "Ordenamiento"],
      ["Duración", "~15 min"],
    ],
    listo: true,
  },
  {
    slug: "competencias",
    nombre: "Análisis de Competencias",
    tagline: "Perfil profesional integral",
    sub: "Evaluación comparativa entre perfil personal y requerimientos del puesto, con análisis de preferencias de pensamiento y valores aplicados.",
    tint: "var(--mabe)",
    facts: [
      ["Bloques", "4 áreas"],
      ["Formato", "Comparativo"],
      ["Duración", "~30 min"],
    ],
    listo: true,
  },
];

const pilares = [
  { 
    icon: Award, 
    title: "Certificaciones verificables", 
    text: "Emita certificados digitales con validación y trazabilidad completa." 
  },
  { 
    icon: Layers, 
    title: "Plataforma integral", 
    text: "Evaluaciones, cursos, clases en vivo y certificaciones unificados." 
  },
  { 
    icon: Shield, 
    title: "Acceso controlado", 
    text: "Gestión de accesos con códigos únicos y cupos limitados." 
  },
];

export function HomeContent() {
  return (
    <>
      <AmbientBackground />
      <main className={s.main}>
        <div className="wrap">
          <FadeIn className={s.hero}>
            <span className="eyebrow">Plataforma integral de certificaciones</span>
            <h1>{APP_NAME}</h1>
            <p>
              Plataforma profesional para psicólogos: emita certificaciones, realice evaluaciones
              psicométricas, imparta cursos online y conduzca clases en vivo desde un solo lugar.
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
            Evaluaciones psicométricas disponibles
          </FadeIn>

          <FadeIn delay={0.24}>
            <Link href="/acceso" className={s.accesoBanner}>
              <KeyRound size={20} />
              <div>
                <strong>Acceso con código de evaluación</strong>
                <span>Si tiene un código autorizado, ingrese aquí para acceder a su evaluación.</span>
              </div>
              <span className={s.go}>Acceder →</span>
            </Link>
          </FadeIn>

          <div className={s.grid}>
            {evaluaciones.map((e, i) => (
              <StaggerItem key={e.slug} index={i}>
                <Link
                  href="/acceso"
                  className={s.card}
                  data-soon={!e.listo}
                  aria-disabled={!e.listo}
                  style={{ ["--tint" as string]: e.tint }}
                >
                  <div className={s.cardGlow} aria-hidden />
                  <div className={s.cardTop}>
                    <div>
                      <span className={s.name}>{e.nombre}</span>
                      <span className={s.tagline}>{e.tagline}</span>
                    </div>
                    <span className="chip">{e.listo ? "Disponible" : "Próximo"}</span>
                  </div>
                  <p className={s.sub}>{e.sub}</p>
                  <div className={s.facts}>
                    {e.facts.map(([k, v]) => (
                      <div key={k} className={s.fact}>
                        <span>{k}</span>
                        <span>{v}</span>
                      </div>
                    ))}
                  </div>
                  <span className={s.go}>Requiere autorización →</span>
                </Link>
              </StaggerItem>
            ))}
          </div>

          <FadeIn className={s.ctaSection} delay={0.5}>
            <h2>Panel de administración profesional</h2>
            <p>
              Gestione certificaciones, evaluaciones, cursos y clases en vivo desde un panel unificado
              con interpretaciones detalladas, reportes completos y emisión de certificados verificables.
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
