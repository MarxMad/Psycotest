"use client";

import { usePathname } from "next/navigation";
import { AppProviders } from "@/components/providers/AppProviders";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { TopNav } from "./TopNav";

/** Rutas que traen su propio encabezado: la barra global sobraría encima. */
const CON_ENCABEZADO_PROPIO = [
  "/admin",
  "/cursos",
  "/sites",
  "/diplomados",
  "/carrito",
  "/checkout",
  "/gracias",
  "/nosotros",
  "/contacto",
  "/acceso",
  "/mis-cursos",
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
