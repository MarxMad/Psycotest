"use client";

import s from "./admin-charts.module.css";

export interface ChartTab {
  id: string;
  label: string;
  hint?: string;
}

export function ChartTabs({
  tabs,
  active,
  onChange,
  title,
}: {
  tabs: ChartTab[];
  active: string;
  onChange: (id: string) => void;
  title?: string;
}) {
  const current = tabs.find((t) => t.id === active);

  return (
    <div className={s.toolbar}>
      <div>
        {title && <h2 className={s.sectionTitle}>{title}</h2>}
        {current?.hint && <p className={s.sectionHint}>{current.hint}</p>}
      </div>
      <div className={s.tabs} role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active === t.id}
            className={active === t.id ? s.tabActive : s.tab}
            onClick={() => onChange(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ChartLegend({
  items,
}: {
  items: { color: string; label: string }[];
}) {
  return (
    <div className={s.legend}>
      {items.map((item) => (
        <span key={item.label}>
          <i style={{ background: item.color }} /> {item.label}
        </span>
      ))}
    </div>
  );
}
