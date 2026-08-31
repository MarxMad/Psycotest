import { ReactNode } from "react";
import s from "./EmptyState.module.css";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className={s.emptyState}>
      {icon && <div className={s.emptyIcon}>{icon}</div>}
      <h3 className={s.emptyTitle}>{title}</h3>
      {description && <p className={s.emptyDescription}>{description}</p>}
      {action && <div className={s.emptyAction}>{action}</div>}
    </div>
  );
}
