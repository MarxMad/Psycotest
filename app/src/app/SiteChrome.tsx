"use client";

import { usePathname } from "next/navigation";
import { AppProviders } from "@/components/providers/AppProviders";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { APP_NAME } from "@/lib/brand";
import { BrandDot, TopNav } from "./TopNav";

/** Rutas que traen su propio encabezado: la barra global sobraría encima. */
const CON_ENCABEZADO_PROPIO = [
  "/cursos",
  "/sites",
  "/diplomados",
  "/carrito",
  "/checkout",
  "/gracias",
  "/mi-cuenta",
];

function hideGlobalTopbar(pathname: string) {
  return pathname === "/" || CON_ENCABEZADO_PROPIO.some((r) => pathname.startsWith(r));
}

/**
 * El flujo del aplicante: quien llega con un código y contesta las pruebas.
 *
 * Aquí la barra se queda sin la puerta del profesional. Decían casi lo mismo
 * —"Acceder" arriba y "Acceder a las pruebas" en el formulario— y quien trae
 * un código no tiene cómo saber cuál le toca; si se equivoca acaba en un
 * inicio de sesión del que no tiene contraseña.
 */
function esFlujoAplicante(pathname: string) {
  return pathname.startsWith("/evaluacion");
}

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const hide = hideGlobalTopbar(pathname);
  const aplicante = esFlujoAplicante(pathname);

  return (
    <AppProviders>
      {!hide ? (
        <header className="topbar">
          <div className="topbar-in">
            {/* Rótulo, no enlace: el índice de marcas es sólo demo y no debe
                alcanzarse desde ninguna página pública. */}
            <span className="brand" title={APP_NAME}>
              <BrandDot />
              <span className="brand-text">{APP_NAME}</span>
            </span>
            <div className="topbar-actions">
              <ThemeToggle />
              {!aplicante && <TopNav />}
            </div>
            {!aplicante && <span className="eyebrow topbar-eyebrow">Uso profesional</span>}
          </div>
        </header>
      ) : null}
      {children}
    </AppProviders>
  );
}
