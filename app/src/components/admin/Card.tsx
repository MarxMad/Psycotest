import { ReactNode } from "react";
import s from "./Card.module.css";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({ children, className = "", padding = "md" }: CardProps) {
  return (
    <div className={`${s.card} ${s[`padding-${padding}`]} ${className}`}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className={s.cardHeader}>
      <div>
        <h3 className={s.cardTitle}>{title}</h3>
        {subtitle && <p className={s.cardSubtitle}>{subtitle}</p>}
      </div>
      {action && <div className={s.cardAction}>{action}</div>}
    </div>
  );
}
