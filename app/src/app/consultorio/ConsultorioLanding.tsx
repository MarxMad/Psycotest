import Link from "next/link";
import { CONSULTORIO } from "@/lib/consultorio-brand";
import {
  BANNER_STRIP,
  CONOCER_ORG_BENEFITS,
  CONOCER_PERSON_BENEFITS,
  EVALUATION_DIMENSIONS,
  HERO_STATS,
  PLATFORM_MODULES,
  SERVICES,
  VISUAL_STORIES,
} from "@/lib/consultorio-content";
import { formatDuration, listPublishedCourses } from "@/lib/courses";
import { psycotest } from "@/lib/routes";
import { formatMxn } from "@/lib/stripe";
import { ConsultorioHeroVisual } from "./ConsultorioHeroVisual";
import { ConsultorioNav } from "./ConsultorioNav";
import { EvalShowcase } from "./EvalShowcase";
import { ConocerSeal, LandingModuleIcon } from "./LandingIcons";
import { LandingBannerStrip, LandingVisualStories } from "./LandingVisuals";
import { LandingReveal, LandingStagger, LandingStaggerItem } from "./LandingReveal";
import { ServiceCards } from "./ServiceCards";
import styles from "./consultorio.module.css";

const STATUS_LABEL = {
  operativo: "Operativo",
  construccion: "En construcción",
  proximo: "Próximamente",
} as const;

export async function ConsultorioLanding() {
  let featured: Awaited<ReturnType<typeof listPublishedCourses>>[number]["course"] | null = null;
  try {
    const published = await listPublishedCourses();
    featured = published[0]?.course ?? null;
  } catch (error) {
    console.error("[consultorio] No se pudieron cargar cursos para la landing:", error);
  }

  return (
    <div className={styles.page}>
      <ConsultorioNav />

      <section className={styles.hero}>
        <div className={styles.heroMesh} aria-hidden />
        <div className={styles.heroGrid}>
          <LandingReveal className={styles.heroCopy}>
            <ConocerSeal />
            <h1>{CONSULTORIO.tagline}</h1>
            <p className={styles.heroLead}>{CONSULTORIO.heroLead}</p>
            <div className={styles.heroActions}>
              <Link href="#conocer" className={styles.btnPrimary}>
                Certificación CONOCER
              </Link>
              <Link href="/consultorio/cursos" className={styles.btnSecondary}>
                Ver cursos
              </Link>
              <Link href="#evaluacion" className={styles.btnGhostHero}>
                Evaluación en línea
              </Link>
            </div>
            <dl className={styles.heroStats}>
              {HERO_STATS.map((stat) => (
                <div key={stat.label}>
                  <dt>{stat.value}</dt>
                  <dd>{stat.label}</dd>
                </div>
              ))}
            </dl>
          </LandingReveal>

          <div className={styles.heroVisualWrap}>
            <ConsultorioHeroVisual />
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.conocerSection}`} id="conocer">
        <div className={styles.wrap}>
          <LandingReveal className={styles.conocerIntro}>
            <p className={styles.eyebrowGold}>Sistema Nacional de Competencias</p>
            <h2>Certifica competencias con respaldo oficial</h2>
            <p>
              El{" "}
              <a href={CONSULTORIO.conocerUrl} target="_blank" rel="noopener noreferrer" className={styles.inlineLink}>
                CONOCER
              </a>{" "}
              impulsa la profesionalización del capital humano mediante estándares de competencia, evaluación y
              certificación reconocida por la SEP. Esta plataforma digitaliza todo el ciclo para tu centro
              certificador.
            </p>
          </LandingReveal>

          <LandingStagger className={styles.conocerGrid}>
            {CONOCER_PERSON_BENEFITS.map((item) => (
              <LandingStaggerItem key={item.title}>
                <article className={styles.conocerCard}>
                  <span className={styles.conocerCardNum} aria-hidden />
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              </LandingStaggerItem>
            ))}
          </LandingStagger>

          <LandingReveal className={styles.conocerOrg} delay={0.1}>
            <h3>Para organizaciones que certifican a su personal</h3>
            <ul className={styles.conocerOrgList}>
              {CONOCER_ORG_BENEFITS.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <p className={styles.conocerFine}>
              Marco alineado al artículo oficial de la SEP sobre certificación de competencias laborales.{" "}
              <a
                href="https://www.gob.mx/sep/articulos/certifica-tus-competencias-labores-conoce-el-conocer"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.inlineLink}
              >
                Conoce el CONOCER en gob.mx →
              </a>
            </p>
          </LandingReveal>
        </div>
      </section>

      <LandingBannerStrip {...BANNER_STRIP} />
      <LandingVisualStories stories={VISUAL_STORIES} />

      <section className={styles.section} id="plataforma">
        <div className={styles.wrap}>
          <LandingReveal className={styles.sectionHead}>
            <p className={styles.eyebrow}>Ecosistema digital</p>
            <h2>Una plataforma, todo el ciclo formativo</h2>
            <p>
              Desde la capacitación hasta la constancia CONOCER — evaluación confidencial, cursos grabados, clases en
              vivo y cobro en línea bajo la marca de {CONSULTORIO.shortName}.
            </p>
          </LandingReveal>

          <LandingStagger className={styles.moduleGrid}>
            {PLATFORM_MODULES.map((mod) => (
              <LandingStaggerItem key={mod.id}>
                <article className={styles.moduleCard}>
                  <div className={styles.moduleTop}>
                    <LandingModuleIcon id={mod.id} />
                    <span className={`${styles.badge} ${styles[`badge_${mod.status}`]}`}>
                      {STATUS_LABEL[mod.status]}
                    </span>
                  </div>
                  <h3>{mod.title}</h3>
                  <p>{mod.description}</p>
                  <ul>
                    {mod.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  {mod.href.startsWith("/") && !mod.href.includes("#") ? (
                    <Link href={mod.href} className={styles.cardLink}>
                      Explorar →
                    </Link>
                  ) : (
                    <a href={mod.href} className={styles.cardLink}>
                      {mod.status === "operativo" ? "Abrir →" : "Ver más →"}
                    </a>
                  )}
                </article>
              </LandingStaggerItem>
            ))}
          </LandingStagger>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionDark}`} id="evaluacion">
        <div className={styles.wrap}>
          <div className={styles.split}>
            <LandingReveal>
              <p className={styles.eyebrowLight}>Evaluación · Operativo</p>
              <h2>Diagnóstico psicométrico en línea</h2>
              <p className={styles.leadLight}>
                Aplicamos baterías validadas para medir perfil, valores, aptitudes y competencias — con calificación
                automática, gráficas e informes PDF. El evaluado no conoce el instrumento; tú interpretas con criterio
                profesional.
              </p>
              <ul className={styles.checkListLight}>
                <li>Códigos de acceso confidenciales</li>
                <li>Validación de protocolo y puntajes automáticos</li>
                <li>Informes trazables para expediente CONOCER</li>
              </ul>
              <Link href={psycotest.home} className={styles.btnOnDark}>
                Acceder al panel de evaluación
              </Link>
            </LandingReveal>
            <LandingReveal delay={0.12}>
              <EvalShowcase image="/ige/download-1.jpg" dimensions={EVALUATION_DIMENSIONS} />
            </LandingReveal>
          </div>
        </div>
      </section>

      {featured ? (
        <section className={styles.section} id="cursos">
          <div className={styles.wrap}>
            <LandingReveal className={styles.courseFeature}>
              <div>
                <p className={styles.eyebrow}>Formación en línea</p>
                <h2>{featured.title}</h2>
                <p>{featured.description}</p>
                <ul className={styles.checkList}>
                  <li>Clases grabadas con temario por módulos</li>
                  <li>Registro de avance estilo Platzi</li>
                  <li>Ruta hacia evaluación y certificación</li>
                </ul>
              </div>
              <aside className={styles.courseAside}>
                <p className={styles.coursePrice}>{formatMxn(featured.priceMxn)}</p>
                <p className={styles.courseMeta}>
                  Curso en línea
                  <br />
                  {formatDuration(featured.durationMinutes)}
                </p>
                <p className={styles.courseInstructor}>
                  <strong>{featured.instructorName}</strong>
                  <br />
                  {featured.instructorBio}
                </p>
                <Link href={`/consultorio/cursos/${featured.slug}`} className={styles.btnPrimary}>
                  Ver curso
                </Link>
              </aside>
            </LandingReveal>
          </div>
        </section>
      ) : null}

      <section className={`${styles.section} ${styles.sectionMuted}`} id="servicios">
        <div className={styles.wrap}>
          <LandingReveal className={styles.sectionHead}>
            <p className={styles.eyebrow}>Servicios</p>
            <h2>Tu centro certificador, potenciado</h2>
            <p>Evaluación, capacitación y certificación CONOCER para organizaciones públicas y privadas.</p>
          </LandingReveal>
          <LandingStagger className={styles.serviceGrid}>
            <ServiceCards services={SERVICES} />
          </LandingStagger>
        </div>
      </section>

      <section className={styles.ctaBand} id="contacto">
        <div className={styles.wrap}>
          <LandingReveal>
            <h2>¿Listo para certificar competencias a escala?</h2>
            <p>
              Agenda una demo de la plataforma: cursos, evaluación confidencial y certificación CONOCER en un solo
              ecosistema.
            </p>
            <div className={styles.ctaActions}>
              <a href={`mailto:${CONSULTORIO.email}`} className={styles.btnPrimary}>
                {CONSULTORIO.email}
              </a>
              <a href={`tel:+52${CONSULTORIO.phone}`} className={styles.btnSecondary}>
                {CONSULTORIO.phone}
              </a>
            </div>
          </LandingReveal>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.wrap}>
          <div className={styles.footerGrid}>
            <div>
              <p className={styles.footerBrand}>{CONSULTORIO.professionalName}</p>
              <p className={styles.footerSub}>{CONSULTORIO.practiceTitle}</p>
            </div>
            <div className={styles.footerLinks}>
              <a href="#conocer">CONOCER</a>
              <Link href="/consultorio/cursos">Cursos</Link>
              <a href="#evaluacion">Evaluación</a>
              <a href="#contacto">Contacto</a>
            </div>
          </div>
          <p className={styles.footerCopy}>
            © {new Date().getFullYear()} {CONSULTORIO.shortName} · Plataforma certificadora en desarrollo
          </p>
        </div>
      </footer>
    </div>
  );
}
