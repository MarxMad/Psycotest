import { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import s from "./PageHeader.module.css";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, breadcrumbs, action }: PageHeaderProps) {
  return (
    <div className={s.pageHeader}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className={s.breadcrumbs}>
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className={s.breadcrumbItem}>
              {crumb.href ? (
                <Link href={crumb.href} className={s.breadcrumbLink}>
                  {crumb.label}
                </Link>
              ) : (
                <span className={s.breadcrumbCurrent}>{crumb.label}</span>
              )}
              {i < breadcrumbs.length - 1 && (
                <ChevronRight size={14} className={s.breadcrumbSeparator} />
              )}
            </span>
          ))}
        </nav>
      )}
      <div className={s.headerContent}>
        <div>
          <h1 className={s.pageTitle}>{title}</h1>
          {subtitle && <p className={s.pageSubtitle}>{subtitle}</p>}
        </div>
        {action && <div className={s.headerAction}>{action}</div>}
      </div>
    </div>
  );
}
