"use client";

import { useRef, useState } from "react";
import { animate } from "animejs";
import { Check, Plus } from "lucide-react";
import { useCarrito } from "@/lib/carrito";
import type { Diplomado } from "@/lib/diplomados-formato";
import s from "./ceduct.module.css";

export function BotonAgregar({
  diplomado,
  compacto,
}: {
  diplomado: Diplomado;
  compacto?: boolean;
}) {
  const { agregar, incluye, listo } = useCarrito();
  const [recienAgregado, setRecienAgregado] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);

  const yaEsta = listo && incluye(diplomado.slug);

  function onClick() {
    const nuevo = agregar({
      slug: diplomado.slug,
      titulo: diplomado.titulo,
      precioMxn: diplomado.precioMxn,
      imagen: diplomado.imagen,
      horas: diplomado.horas,
    });
    if (!nuevo) return;

    setRecienAgregado(true);
    setTimeout(() => setRecienAgregado(false), 1600);

    if (ref.current && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      animate(ref.current, { scale: [1, 0.94, 1], duration: 320, ease: "out(3)" });
    }
  }

  if (yaEsta) {
    return (
      <span className={`${s.btnAgregado} ${compacto ? s.btnCompacto : ""}`}>
        <Check size={15} aria-hidden />
        {recienAgregado ? "Agregado" : "En el carrito"}
      </span>
    );
  }

  return (
    <button
      ref={ref}
      type="button"
      className={`${s.btnPrimario} ${compacto ? s.btnCompacto : ""}`}
      onClick={onClick}
      disabled={!listo}
    >
      <Plus size={15} aria-hidden />
      {compacto ? "Agregar" : "Agregar al carrito"}
    </button>
  );
}
