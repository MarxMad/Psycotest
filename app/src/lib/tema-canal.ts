/**
 * Puente de tokens: viste cualquier zona con el tema del canal.
 *
 * El área de alumno se escribió con la paleta clara original (--paper,
 * --ink, --brand, --c-blue, --serif…). Salir de un canal oscuro y caer
 * ahí se sentía otro sitio. En vez de reescribir casi tres mil líneas de
 * CSS, se redefinen esos tokens con los valores del canal: el CSS
 * existente sigue igual y se pinta solo con la identidad correcta.
 */

import type { CSSProperties } from "react";
import { CHANNELS, type ChannelId } from "./channels";
import { FUENTES_CANAL } from "./channel-fonts";

export function estiloDeCanal(canal: ChannelId): CSSProperties {
  const tema = CHANNELS[canal].theme.vars as Record<string, string>;
  const fuentes = FUENTES_CANAL[canal];

  return {
    ...tema,
    "--ch-font-display": fuentes.display,
    "--ch-font-body": fuentes.body,

    // Superficies y texto
    "--paper": "var(--ch-bg)",
    "--surface": "var(--ch-surface)",
    "--raised": "var(--ch-surface)",
    "--ink": "var(--ch-ink)",
    "--ink-soft": "var(--ch-muted)",
    "--muted": "var(--ch-muted)",
    "--faint": "var(--ch-muted)",
    "--rule": "var(--ch-rule)",
    "--rule-soft": "var(--ch-rule)",

    // Acento
    "--brand": "var(--ch-accent)",
    "--brand-bright": "var(--ch-accent)",
    "--brand-dark": "var(--ch-bg)",
    "--brand-soft": "color-mix(in srgb, var(--ch-accent) 16%, var(--ch-surface))",
    "--accent": "var(--ch-accent)",
    "--on-accent": "var(--ch-bg)",
    "--gold": "var(--ch-accent-2, var(--ch-accent))",
    "--gold-soft": "color-mix(in srgb, var(--ch-accent-2, var(--ch-accent)) 16%, var(--ch-surface))",

    // Alias heredados del consultorio
    "--c-blue": "var(--ch-accent)",
    "--c-blue-bright": "var(--ch-accent)",
    "--c-blue-soft": "color-mix(in srgb, var(--ch-accent) 16%, var(--ch-surface))",
    "--c-gold": "var(--ch-accent-2, var(--ch-accent))",
    "--c-gold-soft": "color-mix(in srgb, var(--ch-accent-2, var(--ch-accent)) 16%, var(--ch-surface))",
    "--c-ink": "var(--ch-ink)",
    "--c-slate": "var(--ch-muted)",
    "--c-muted": "var(--ch-muted)",
    "--c-paper": "var(--ch-bg)",
    "--c-surface": "var(--ch-surface)",
    "--c-border": "var(--ch-rule)",
    "--c-dark": "var(--ch-bg)",

    // Tipografía
    "--serif": "var(--ch-font-display)",
    "--sans": "var(--ch-font-body)",
  } as CSSProperties;
}

/** Clases que activan las fuentes del canal (next/font). */
export function clasesDeCanal(canal: ChannelId): string {
  return FUENTES_CANAL[canal].className;
}
