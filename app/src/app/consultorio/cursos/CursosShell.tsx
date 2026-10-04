"use client";

import { usePathname } from "next/navigation";
import { ConsultorioNav } from "../ConsultorioNav";

/**
 * El layout de /consultorio ya aplica la cáscara y el tema del canal;
 * aquí sólo se decide si se muestra el encabezado.
 */
export function CursosShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // El reproductor va a pantalla completa: sin encabezado que estorbe.
  const enReproductor = pathname.includes("/aprender/");

  return (
    <>
      {!enReproductor ? <ConsultorioNav /> : null}
      {children}
    </>
  );
}
