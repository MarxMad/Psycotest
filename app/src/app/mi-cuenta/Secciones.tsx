import type { ReactNode } from "react";
import s from "./secciones.module.css";

export function Encabezado({ titulo, texto }: { titulo: string; texto?: string }) {
  return (
    <header className={s.encabezado}>
      <h1>{titulo}</h1>
      {texto && <p>{texto}</p>}
    </header>
  );
}

export function Vacio({
  titulo,
  texto,
  accion,
}: {
  titulo: string;
  texto: string;
  accion?: ReactNode;
}) {
  return (
    <div className={s.vacio}>
      <h2>{titulo}</h2>
      <p>{texto}</p>
      {accion && <div className={s.vacioAccion}>{accion}</div>}
    </div>
  );
}

export function Tarjetas({ children }: { children: ReactNode }) {
  return <div className={s.tarjetas}>{children}</div>;
}

export function Tarjeta({
  titulo,
  meta,
  children,
  pie,
}: {
  titulo: string;
  meta?: string;
  children?: ReactNode;
  pie?: ReactNode;
}) {
  return (
    <article className={s.tarjeta}>
      {meta && <p className={s.meta}>{meta}</p>}
      <h3>{titulo}</h3>
      {children}
      {pie && <div className={s.pie}>{pie}</div>}
    </article>
  );
}

/** Barra de avance con su valor accesible. */
export function Avance({ porcentaje }: { porcentaje: number }) {
  const v = Math.max(0, Math.min(100, Math.round(porcentaje)));
  return (
    <div className={s.avance}>
      <div
        className={s.avancePista}
        role="progressbar"
        aria-valuenow={v}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Avance del curso"
      >
        <span className={s.avanceValor} style={{ inlineSize: `${v}%` }} />
      </div>
      <span className={s.avanceCifra}>{v}%</span>
    </div>
  );
}
