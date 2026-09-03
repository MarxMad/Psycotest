"use client";

import { motion } from "framer-motion";
import type { CSSProperties } from "react";
import {
  Award,
  BadgeCheck,
  BookOpen,
  Brain,
  Glasses,
  GraduationCap,
  ScrollText,
  Sparkles,
} from "lucide-react";
import styles from "./consultorio.module.css";

/** Íconos distribuidos simétricamente sobre la órbita (cada 60°). */
const ORBIT = [
  { Icon: Brain, angle: -90, duration: 5.2, delay: 0 },
  { Icon: Glasses, angle: -30, duration: 4.6, delay: 0.4 },
  { Icon: Award, angle: 30, duration: 5, delay: 0.6 },
  { Icon: GraduationCap, angle: 90, duration: 4.2, delay: 0.2 },
  { Icon: ScrollText, angle: 150, duration: 6, delay: 1 },
  { Icon: BookOpen, angle: 210, duration: 5.8, delay: 0.8 },
] as const;

function OrbitIcon({
  Icon,
  angle,
  duration,
  delay,
}: {
  Icon: (typeof ORBIT)[number]["Icon"];
  angle: number;
  duration: number;
  delay: number;
}) {
  const slotStyle = { "--orbit-angle": `${angle}deg` } as CSSProperties;

  return (
    <motion.div
      className={styles.orbitIconSlot}
      style={slotStyle}
      animate={{ y: [0, -8, 0] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}
    >
      <div className={styles.floatIcon}>
        <Icon size={22} strokeWidth={1.6} aria-hidden />
      </div>
    </motion.div>
  );
}

export function ConsultorioHeroVisual() {
  return (
    <div className={styles.heroVisual} aria-hidden>
      <div className={styles.heroOrbA} />
      <div className={styles.heroOrbB} />
      <div className={styles.heroOrbC} />

      <div className={styles.heroOrbitAnchor}>
        <motion.div
          className={styles.heroOrbitSpin}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 48, repeat: Infinity, ease: "linear" }}
        >
          <svg className={styles.heroRingsSvg} viewBox="0 0 200 200" aria-hidden>
            <circle
              cx="100"
              cy="100"
              r="58"
              fill="none"
              stroke="rgba(45, 106, 159, 0.38)"
              strokeWidth="0.75"
              strokeDasharray="4 6"
            />
            <circle
              cx="100"
              cy="100"
              r="76"
              fill="none"
              stroke="rgba(201, 162, 39, 0.32)"
              strokeWidth="0.75"
              strokeDasharray="3 7"
            />
          </svg>

          {ORBIT.map(({ Icon, angle, duration, delay }) => (
            <OrbitIcon key={angle} Icon={Icon} angle={angle} duration={duration} delay={delay} />
          ))}
        </motion.div>

        <div className={styles.heroCoreAnchor}>
          <motion.div
            className={styles.heroCorePulse}
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className={styles.heroCore}>
              <div className={styles.heroCoreRing} />
              <BadgeCheck size={36} strokeWidth={1.5} className={styles.heroCoreIcon} />
              <span className={styles.heroCoreLabel}>CONOCER</span>
              <span className={styles.heroCoreSub}>Competencias laborales</span>
            </div>
          </motion.div>
        </div>
      </div>

      <div className={styles.heroSparkWrap}>
        <motion.div
          className={styles.heroSpark}
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles size={16} />
          <span>Certificación SEP</span>
        </motion.div>
      </div>
    </div>
  );
}
