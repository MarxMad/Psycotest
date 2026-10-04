"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { channelPublicUrl } from "@/lib/channels";
import s from "./ceduct.module.css";

/**
 * Navegación de las páginas de compra (catálogo, ficha, carrito).
 *
 * Antes mostraba «Diplomados · Certificaciones · Proceso» como iguales, y
 * estando ya en /diplomados parecía que los tres eran secciones de esta
 * página: dos se iban a la portada sin avisar. Ahora la página en la que
 * estás va marcada y los enlaces que viven en la portada quedan detrás de
 * «Inicio», separados, para que se lea a qué sitio llevan.
 */
export function NavCeduct() {
  const ruta = usePathname() || "";
  const inicio = channelPublicUrl("ceduct");

  const enCatalogo = ruta === "/diplomados" || ruta.startsWith("/diplomados/");

  return (
    <nav className={s.navLinks} aria-label="Principal">
      <Link href={inicio} className={s.navLink}>
        Inicio
      </Link>
      <Link
        href="/diplomados"
        className={s.navLink}
        aria-current={enCatalogo ? "page" : undefined}
      >
        Diplomados
      </Link>

      <span className={s.navCorte} aria-hidden />

      {/* Secciones de la portada: el corte de arriba las separa de las de aquí. */}
      <Link href={`${inicio}#certificaciones`} className={s.navLink}>
        Certificaciones
      </Link>
      <Link href={`${inicio}#ruta`} className={s.navLink}>
        Cómo funciona
      </Link>
    </nav>
  );
}
