"use client";

import {
  Award,
  BadgeCheck,
  BookOpen,
  Brain,
  CreditCard,
  GraduationCap,
  Video,
} from "lucide-react";
import styles from "./consultorio.module.css";

const ICONS: Record<string, typeof Brain> = {
  certificacion: Award,
  evaluacion: Brain,
  formacion: BookOpen,
  clases: Video,
  comercial: CreditCard,
};

export function LandingModuleIcon({ id }: { id: string }) {
  const Icon = ICONS[id] ?? GraduationCap;
  return (
    <span className={styles.moduleIconWrap}>
      <Icon size={20} strokeWidth={1.75} aria-hidden />
    </span>
  );
}

export function ConocerSeal() {
  return (
    <span className={styles.conocerSeal} aria-label="Certificación CONOCER">
      <BadgeCheck size={18} strokeWidth={2} aria-hidden />
      CONOCER · SEP
    </span>
  );
}
