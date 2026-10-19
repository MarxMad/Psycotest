"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Plus } from "lucide-react";
import { useCarrito, type ItemCarrito } from "@/lib/carrito";
import { RUTAS } from "@/lib/ceduct/rutas";
import type { Programa } from "@/lib/ceduct/tipos";
import s from "./mk.module.css";

export function aItem(p: Programa): ItemCarrito {
  return {
    slug: p.slug,
    titulo: p.titulo,
    precioMxn: p.precioMxn,
    imagen: p.imagen,
    horas: p.horas,
    tipo: p.tipo,
    categoria: p.categoria,
    modalidad: p.modalidad,
    demo: p.fuente === "demo",
  };
}

/** «Agregar al carrito». Si ya está, se vuelve un enlace al carrito. */
export function BotonAgregar({
  programa,
  compacto,
  bloque,
}: {
  programa: Programa;
  compacto?: boolean;
  bloque?: boolean;
}) {
  const { agregar, incluye, listo } = useCarrito();
  const [aviso, setAviso] = useState("");
  const yaEsta = listo && incluye(programa.slug);
  const clases = `${s.btn} ${compacto ? s.btnCompacto : ""} ${bloque ? s.btnBloque : ""}`;

  if (programa.precioMxn <= 0) {
    return (
      <a className={`${clases} ${s.btnSecundario}`} href={RUTAS.contacto + `?programa=${programa.slug}`}>
        Solicitar informes
      </a>
    );
  }

  return (
    <>
      {yaEsta ? (
        <a href={RUTAS.carrito} className={`${clases} ${s.btnHecho}`}>
          <Check size={16} aria-hidden /> En tu carrito
        </a>
      ) : (
        <button
          type="button"
          className={`${clases} ${s.btnPrimario}`}
          disabled={!listo}
          onClick={() => {
            if (agregar(aItem(programa))) setAviso(`${programa.titulo} se agregó al carrito.`);
          }}
        >
          <Plus size={16} aria-hidden /> Agregar al carrito
        </button>
      )}
      {/* Anuncio para lectores de pantalla: el cambio de botón no basta. */}
      <span className={s.visualmenteOculto} role="status" aria-live="polite">
        {aviso}
      </span>
    </>
  );
}

/** «Comprar ahora»: agrega (si hace falta) y va directo al checkout. */
export function BotonComprarAhora({ programa, bloque }: { programa: Programa; bloque?: boolean }) {
  const { agregar, listo } = useCarrito();
  const router = useRouter();
  if (programa.precioMxn <= 0) return null;
  return (
    <button
      type="button"
      className={`${s.btn} ${s.btnSecundario} ${bloque ? s.btnBloque : ""}`}
      disabled={!listo}
      onClick={() => {
        agregar(aItem(programa));
        router.push(RUTAS.checkout);
      }}
    >
      Comprar ahora <ArrowRight size={16} aria-hidden />
    </button>
  );
}
