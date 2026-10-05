"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { channelPublicUrl } from "@/lib/channels";
import s from "./ceduct.module.css";

/**
 * Navegación de las páginas de compra (catálogo, ficha, carrito).
 *
 * Sólo dos destinos: la portada y el catálogo. Antes colgaban aquí
 * «Certificaciones» y «Cómo funciona», que son anclas de la portada: se
 * leían como secciones de esta página y al tocarlas te sacaban del
 * catálogo sin avisar. Quien quiera esas secciones las encuentra en
 * «Inicio», que es donde viven.
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
    </nav>
  );
}
