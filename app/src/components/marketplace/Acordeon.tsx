"use client";

import { useId, useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import s from "./mk.module.css";

export type ItemAcordeon = {
  titulo: ReactNode;
  contenido: ReactNode;
  /** Texto corto a la izquierda del título (p. ej. «01»). */
  numero?: string;
  /** Texto a la derecha (p. ej. «3 lecciones»). */
  extra?: ReactNode;
};

/**
 * Acordeón accesible: cada cabecera es un <button> con aria-expanded y
 * aria-controls; el panel cerrado queda `inert`, así ni el tabulador ni el
 * lector de pantalla entran en lo que no se ve.
 */
export function Acordeon({
  items,
  unoALaVez = false,
  abiertoInicial = -1,
  nivel = 3,
}: {
  items: ItemAcordeon[];
  unoALaVez?: boolean;
  abiertoInicial?: number;
  nivel?: 2 | 3 | 4;
}) {
  const base = useId();
  const [abiertos, setAbiertos] = useState<Set<number>>(
    () => new Set(abiertoInicial >= 0 ? [abiertoInicial] : []),
  );
  const Encabezado = `h${nivel}` as "h2" | "h3" | "h4";

  function alternar(i: number) {
    setAbiertos((prev) => {
      const sig = new Set(unoALaVez ? [] : prev);
      if (prev.has(i)) sig.delete(i);
      else sig.add(i);
      return sig;
    });
  }

  return (
    <div className={s.acordeon}>
      {items.map((it, i) => {
        const abierto = abiertos.has(i);
        const idBoton = `${base}-b${i}`;
        const idPanel = `${base}-p${i}`;
        return (
          <div key={i} className={s.acordeonItem} data-abierto={abierto}>
            <Encabezado>
              <button
                type="button"
                id={idBoton}
                className={s.acordeonBoton}
                aria-expanded={abierto}
                aria-controls={idPanel}
                onClick={() => alternar(i)}
              >
                {it.numero && <span className={s.acordeonNumero} aria-hidden>{it.numero}</span>}
                <span className={s.acordeonTitulo}>{it.titulo}</span>
                {it.extra && <span className={s.meta}>{it.extra}</span>}
                <span className={s.acordeonIcono} aria-hidden>
                  <Plus size={18} />
                </span>
              </button>
            </Encabezado>
            <div
              id={idPanel}
              role="region"
              aria-labelledby={idBoton}
              className={s.acordeonPanel}
              inert={!abierto}
            >
              <div>
                <div className={s.acordeonContenido}>{it.contenido}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
