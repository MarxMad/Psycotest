"use client";

import { ConsultorioNav } from "../ConsultorioNav";
import c from "./cursos.module.css";

export function CursosShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={c.platziRoot}>
      <ConsultorioNav />
      {children}
    </div>
  );
}
