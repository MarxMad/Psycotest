import { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import s from "./StatCard.module.css";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "blue" | "green" | "purple" | "orange";
}

export function StatCard({ label, value, icon, trend, color = "blue" }: StatCardProps) {
  return (
    <div className={`${s.statCard} ${s[`color-${color}`]}`}>
      <div className={s.statContent}>
        <div className={s.statLabel}>{label}</div>
        <div className={s.statValue}>{value}</div>
        {trend && (
          <div className={`${s.statTrend} ${trend.isPositive ? s.trendUp : s.trendDown}`}>
            {trend.isPositive ? (
              <TrendingUp size={14} />
            ) : (
              <TrendingDown size={14} />
            )}
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      {icon && <div className={s.statIcon}>{icon}</div>}
    </div>
  );
}
