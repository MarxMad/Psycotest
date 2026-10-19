/**
 * Cálculo del resumen de compra. Una sola función para el carrito y el
 * checkout, para que nunca muestren cifras distintas.
 *
 * Todo en centavos enteros. El servidor recalcula con precios de la base.
 */

import type { CuponAplicado, ItemCarrito } from "@/lib/carrito";
import { IMPUESTOS } from "./config";

export type Totales = {
  /** Suma de precios de lista. */
  bruto: number;
  descuento: number;
  /** Base sin impuestos. */
  subtotal: number;
  impuestos: number;
  total: number;
  tasa: number;
  incluido: boolean;
};

export function descuentoDe(cupon: CuponAplicado | null, monto: number): number {
  if (!cupon || monto <= 0) return 0;
  const d =
    cupon.type === "percentage"
      ? Math.round((monto * Math.min(100, Math.max(0, cupon.value))) / 100)
      : Math.max(0, cupon.value);
  return Math.min(d, monto);
}

export function calcularTotales(
  items: Pick<ItemCarrito, "precioMxn">[],
  cupon: CuponAplicado | null,
  impuestos: { tasa: number; incluidoEnPrecio: boolean } = IMPUESTOS,
): Totales {
  const bruto = items.reduce((s, i) => s + Math.max(0, i.precioMxn), 0);
  const descuento = descuentoDe(cupon, bruto);
  const neto = bruto - descuento;
  const { tasa, incluidoEnPrecio } = impuestos;

  if (incluidoEnPrecio) {
    const subtotal = Math.round(neto / (1 + tasa));
    return { bruto, descuento, subtotal, impuestos: neto - subtotal, total: neto, tasa, incluido: true };
  }
  const iva = Math.round(neto * tasa);
  return { bruto, descuento, subtotal: neto, impuestos: iva, total: neto + iva, tasa, incluido: false };
}
