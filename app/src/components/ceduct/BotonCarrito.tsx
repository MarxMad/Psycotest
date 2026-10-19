"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCarrito } from "@/lib/carrito";
import s from "./ceduct.module.css";

export function BotonCarrito() {
  const { items, listo } = useCarrito();

  return (
    <Link href="/carrito" className={s.carritoBtn} aria-label="Ver carrito">
      <ShoppingBag size={17} aria-hidden />
      <span>Carrito</span>
      {listo && items.length > 0 && (
        <span className={s.carritoNum} aria-label={`${items.length} en el carrito`}>
          {items.length}
        </span>
      )}
    </Link>
  );
}
