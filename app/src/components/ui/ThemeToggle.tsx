"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { THEME_LABELS } from "@/lib/theme";
import { useTheme } from "@/components/providers/ThemeProvider";

export function ThemeToggle({ className }: { className?: string }) {
  const { mode, cycleTheme } = useTheme();

  const Icon = mode === "system" ? Monitor : mode === "light" ? Sun : Moon;

  return (
    <button
      type="button"
      className={className ? `${className} theme-toggle` : "theme-toggle"}
      onClick={cycleTheme}
      aria-label={THEME_LABELS[mode]}
      title={THEME_LABELS[mode]}
    >
      <Icon size={17} strokeWidth={1.85} aria-hidden />
      <span className="theme-toggle-label">{THEME_LABELS[mode]}</span>
    </button>
  );
}
