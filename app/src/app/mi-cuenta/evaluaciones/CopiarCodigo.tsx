"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import s from "./evaluaciones.module.css";

/** Copia un código (o varios, uno por línea) al portapapeles. */
export function CopiarCodigo({ texto, etiqueta }: { texto: string; etiqueta?: string }) {
  const [hecho, setHecho] = useState(false);
  async function copiar() {
    await navigator.clipboard?.writeText(texto).catch(() => {});
    setHecho(true);
    setTimeout(() => setHecho(false), 1600);
  }
  return (
    <button
      type="button"
      className={etiqueta ? s.botonTexto : s.copiar}
      onClick={copiar}
      aria-label={etiqueta ?? `Copiar ${texto}`}
    >
      {hecho ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
      {etiqueta && <span>{hecho ? "Copiados" : etiqueta}</span>}
    </button>
  );
}
