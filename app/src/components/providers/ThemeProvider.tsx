"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  applyTheme,
  nextTheme,
  readStoredTheme,
  resolveIsDark,
  THEME_STORAGE_KEY,
  type ThemeMode,
} from "@/lib/theme";

interface ThemeContextValue {
  mode: ThemeMode;
  isDark: boolean;
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("light");
  const [isDark, setIsDark] = useState(false);

  const sync = useCallback((next: ThemeMode) => {
    applyTheme(next);
    setMode(next);
    setIsDark(resolveIsDark(next));
  }, []);

  useEffect(() => {
    sync(readStoredTheme());
  }, [sync]);

  const cycleTheme = useCallback(() => {
    const stored = readStoredTheme();
    const next = nextTheme(stored);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    sync(next);
  }, [sync]);

  return (
    <ThemeContext.Provider value={{ mode, isDark, cycleTheme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme debe usarse dentro de ThemeProvider");
  return ctx;
}
