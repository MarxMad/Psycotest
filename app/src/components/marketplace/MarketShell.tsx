import { Suspense, type ReactNode } from "react";
import { getSessionUser } from "@/lib/auth";
import { FUENTES_MK } from "@/lib/ceduct/fuentes";
import { Navbar } from "./Navbar";
import { Pie } from "./Pie";
import s from "./mk.module.css";

async function haySesion(): Promise<boolean> {
  try {
    return Boolean(await getSessionUser());
  } catch {
    return false;
  }
}

/**
 * Cáscara de todas las páginas del marketplace: tipografías, tokens de
 * color, navbar fijo y pie. Las páginas sólo ponen su contenido.
 */
export async function MarketShell({ children }: { children: ReactNode }) {
  const conSesion = await haySesion();

  return (
    <div className={`${s.raiz} ${FUENTES_MK}`}>
      <a href="#contenido" className={s.saltar}>
        Saltar al contenido
      </a>
      <Suspense fallback={<div style={{ height: 72 }} aria-hidden />}>
        <Navbar conSesion={conSesion} />
      </Suspense>
      <main id="contenido" className={s.principal} tabIndex={-1}>
        {children}
      </main>
      <Pie />
    </div>
  );
}
