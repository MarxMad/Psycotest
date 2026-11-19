import { useId } from "react";
import s from "./logo.module.css";

/**
 * Logo de la Sociedad de Psicología Aplicada A. C.: la Ψ calada en el
 * cuadro rojo. Digitalizado del original para que escale sin pixelarse; el
 * mismo dibujo vive en /public/marcas/psicologia para favicons y correos.
 */

export const ROJO_PSI = "#d8342a";

const CUADRO = "M22 0 H274 Q300 0 300 26 V236 Q300 260 276 260 H34 Q0 260 0 226 V20 Q0 0 22 0 Z";
const BRAZOS = "M58 -10 V28 C58 98 96 132 150 132 C204 132 242 98 242 28 V-10";

function Calado({ id }: { id: string }) {
  return (
    <mask id={id}>
      <rect width="300" height="260" fill="#fff" />
      <rect x="131" y="-10" width="38" height="280" fill="#000" />
      <path d={BRAZOS} fill="none" stroke="#000" strokeWidth="44" />
    </mask>
  );
}

/** El símbolo plano. Toma el color de `color` (rojo por defecto). */
export function LogoPsi({
  className,
  color = ROJO_PSI,
  titulo,
}: {
  className?: string;
  color?: string;
  /** Sin título el logo es decorativo (lo acompaña el nombre en texto). */
  titulo?: string;
}) {
  const id = `psi-${useId().replace(/:/g, "")}`;
  return (
    <svg
      className={className}
      viewBox="0 0 300 260"
      role={titulo ? "img" : undefined}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
    >
      <defs>
        <Calado id={id} />
      </defs>
      <path d={CUADRO} fill={color} mask={`url(#${id})`} />
    </svg>
  );
}

/** Capas apiladas en Z: de la cara trasera (oscura) a la frontal. */
const CAPAS = 16;
const tono = (i: number) => {
  // Interpola del rojo profundo del canto al rojo de la cara.
  const t = i / (CAPAS - 1);
  const mezcla = (a: number, b: number) => Math.round(a + (b - a) * t);
  return `rgb(${mezcla(120, 186)}, ${mezcla(22, 40)}, ${mezcla(16, 32)})`;
};

/**
 * El logo con volumen. Es CSS 3D puro (capas del mismo dibujo separadas en
 * profundidad), así que pinta al instante: no espera a que cargue la escena
 * WebGL, que es justamente lo que el cargador cubre.
 */
export function LogoPsi3D({ className }: { className?: string }) {
  const id = `psi3d-${useId().replace(/:/g, "")}`;
  return (
    <div className={`${s.escena} ${className ?? ""}`} aria-hidden>
      <div className={s.giro}>
        <svg width="0" height="0" className={s.defs} focusable="false">
          <defs>
            <Calado id={id} />
          </defs>
        </svg>
        {Array.from({ length: CAPAS }, (_, i) => (
          <svg
            key={i}
            className={s.capa}
            viewBox="0 0 300 260"
            style={{ ["--z" as string]: i - CAPAS + 1 }}
          >
            <path d={CUADRO} fill={tono(i)} mask={`url(#${id})`} />
          </svg>
        ))}
        <svg className={`${s.capa} ${s.cara}`} viewBox="0 0 300 260" style={{ ["--z" as string]: 1 }}>
          <defs>
            <linearGradient id={`${id}-cara`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ef4a3c" />
              <stop offset="0.55" stopColor={ROJO_PSI} />
              <stop offset="1" stopColor="#b9271e" />
            </linearGradient>
          </defs>
          <path d={CUADRO} fill={`url(#${id}-cara)`} mask={`url(#${id})`} />
        </svg>
        <div className={s.brillo} />
      </div>
      <div className={s.sombra} />
    </div>
  );
}
