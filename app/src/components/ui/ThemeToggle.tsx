"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";

export function ThemeToggle() {
  const { mode, cycleTheme } = useTheme();

  const Icon = mode === "light" ? Sun : Moon;
  const label = mode === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={cycleTheme}
      aria-label={label}
      title={label}
    >
      <Icon size={18} strokeWidth={1.85} aria-hidden />
    </button>
  );
}
