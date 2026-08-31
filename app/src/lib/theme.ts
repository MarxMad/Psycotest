export type ThemeMode = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "psycotest-theme";

export function applyTheme(mode: ThemeMode): void {
  const root = document.documentElement;
  if (mode === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", mode);
}

export function readStoredTheme(): ThemeMode {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    if (value === "light" || value === "dark" || value === "system") return value;
  } catch {
    /* ignore */
  }
  return "system";
}

export function resolveIsDark(mode: ThemeMode): boolean {
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function nextTheme(mode: ThemeMode): ThemeMode {
  if (mode === "light") return "dark";
  return "light";
}

export const THEME_LABELS: Record<ThemeMode, string> = {
  system: "Automático (día / noche)",
  light: "Modo claro",
  dark: "Modo oscuro",
};

/** Script inline para evitar flash antes de hidratar React. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;
