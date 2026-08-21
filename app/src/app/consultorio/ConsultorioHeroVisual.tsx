"use client";

import { motion } from "framer-motion";
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

const ORBIT = [
  { Icon: Brain, className: styles.floatBrain, duration: 5.2, delay: 0 },
  { Icon: Glasses, className: styles.floatGlasses, duration: 4.6, delay: 0.4 },
  { Icon: BookOpen, className: styles.floatBook, duration: 5.8, delay: 0.8 },
  { Icon: GraduationCap, className: styles.floatGrad, duration: 4.2, delay: 0.2 },
  { Icon: ScrollText, className: styles.floatScroll, duration: 6, delay: 1 },
  { Icon: Award, className: styles.floatAward, duration: 5, delay: 0.6 },
] as const;

function FloatIcon({
  Icon,
  className,
  duration,
  delay,
}: {
  Icon: (typeof ORBIT)[number]["Icon"];
  className: string;
  duration: number;
  delay: number;
}) {
  return (
    <motion.div
      className={`${styles.floatIcon} ${className}`}
      animate={{ y: [0, -14, 0], rotate: [0, 4, -3, 0] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}
    >
      <Icon size={22} strokeWidth={1.6} aria-hidden />
    </motion.div>
  );
}

export function ConsultorioHeroVisual() {
  return (
    <div className={styles.heroVisual} aria-hidden>
      <div className={styles.heroOrbA} />
      <div className={styles.heroOrbB} />
      <div className={styles.heroOrbC} />

      <svg className={styles.heroLines} viewBox="0 0 400 400">
        <motion.circle
          cx="200"
          cy="200"
          r="120"
          fill="none"
          stroke="rgba(147,197,253,0.2)"
          strokeWidth="1"
          strokeDasharray="6 8"
          animate={{ rotate: 360 }}
          transition={{ duration: 48, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "200px 200px" }}
        />
        <motion.circle
          cx="200"
          cy="200"
          r="155"
          fill="none"
          stroke="rgba(201,162,39,0.15)"
          strokeWidth="1"
          strokeDasharray="4 10"
          animate={{ rotate: -360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "200px 200px" }}
        />
      </svg>

      {ORBIT.map(({ Icon, className, duration, delay }) => (
        <FloatIcon key={className} Icon={Icon} className={className} duration={duration} delay={delay} />
      ))}

      <motion.div
        className={styles.heroCore}
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.div
          className={styles.heroCoreRing}
          animate={{ opacity: [0.4, 0.85, 0.4], scale: [1, 1.08, 1] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <BadgeCheck size={36} strokeWidth={1.5} className={styles.heroCoreIcon} />
        <span className={styles.heroCoreLabel}>CONOCER</span>
        <span className={styles.heroCoreSub}>Competencias laborales</span>
      </motion.div>

      <motion.div
        className={styles.heroSpark}
        animate={{ opacity: [0.5, 1, 0.5], y: [0, -6, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Sparkles size={16} />
        <span>Certificación SEP</span>
      </motion.div>
    </div>
  );
}
