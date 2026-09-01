"use client";

import Image from "next/image";
import { LandingReveal, LandingStagger, LandingStaggerItem } from "./LandingReveal";
import styles from "./consultorio.module.css";

export type VisualStory = {
  title: string;
  text: string;
  image: string;
  alt: string;
};

export function LandingVisualStories({ stories }: { stories: readonly VisualStory[] }) {
  return (
    <section className={`${styles.section} ${styles.visualSection}`} id="experiencias">
      <div className={styles.wrap}>
        <LandingReveal className={styles.sectionHead}>
          <p className={styles.eyebrow}>Experiencias reales</p>
          <h2>Formación y certificación que conecta con las personas</h2>
          <p>
            Capacitación presencial y en línea, diagnóstico organizacional y evaluación de competencias — con el
            respaldo de un centro certificador CONOCER.
          </p>
        </LandingReveal>

        <LandingStagger className={styles.visualGrid}>
          {stories.map((story, i) => (
            <LandingStaggerItem key={story.title}>
              <article className={styles.visualCard}>
                <div className={styles.visualMedia}>
                  <Image
                    src={story.image}
                    alt={story.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className={styles.visualImg}
                    priority={i === 0}
                  />
                  <div className={styles.visualOverlay} />
                </div>
                <div className={styles.visualBody}>
                  <h3>{story.title}</h3>
                  <p>{story.text}</p>
                </div>
              </article>
            </LandingStaggerItem>
          ))}
        </LandingStagger>
      </div>
    </section>
  );
}

export function LandingBannerStrip({
  image,
  alt,
  title,
  subtitle,
}: {
  image: string;
  alt: string;
  title: string;
  subtitle: string;
}) {
  return (
    <section className={styles.bannerStrip} aria-label={title}>
      <div className={styles.bannerMedia}>
        <Image src={image} alt={alt} fill sizes="100vw" className={styles.bannerImg} priority />
        <div className={styles.bannerOverlay} />
      </div>
      <LandingReveal className={styles.bannerCopy}>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </LandingReveal>
    </section>
  );
}
