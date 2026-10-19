"use client";

import Link from "next/link";
import { ArrowRight, Lock, ShoppingBag, Trash2 } from "lucide-react";
import { useCarrito } from "@/lib/carrito";
import { categoriaPorSlug } from "@/lib/ceduct/config";
import { RUTAS } from "@/lib/ceduct/rutas";
import { MODALIDAD_LABEL, TIPO_LABEL, precio, type Programa } from "@/lib/ceduct/tipos";
import { Imagen } from "../Imagen";
import { Portada } from "../Portada";
import { TarjetaPrograma } from "../TarjetaPrograma";
import { CampoCupon, Totales } from "./Resumen";
import s from "../mk.module.css";
import k from "./compra.module.css";

export function VistaCarrito({ sugerencias }: { sugerencias: Programa[] }) {
  const { items, listo, quitar } = useCarrito();

  if (!listo) {
    return (
      <div className={`${s.contenedor} ${k.pagina}`} aria-busy="true">
        <h1 className={k.titulo}>Tu carrito</h1>
        <div className={k.esqueleto} />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={`${s.contenedor} ${k.pagina}`}>
        <div className={k.vacio}>
          <span className={k.vacioIcono}><ShoppingBag size={36} aria-hidden /></span>
          <h1 className={k.titulo}>Tu carrito está vacío.</h1>
          <p className={s.lead}>Explora el catálogo y agrega el diplomado o la certificación que te lleve al siguiente nivel.</p>
          <div className={k.vacioBotones}>
            <Link href={RUTAS.catalogo({ tipo: "diplomado" })} className={`${s.btn} ${s.btnPrimario} ${s.btnGrande}`}>
              Explorar cursos <ArrowRight size={18} aria-hidden />
            </Link>
            <Link href={RUTAS.catalogo({ tipo: "certificacion" })} className={`${s.btn} ${s.btnSecundario} ${s.btnGrande}`}>
              Ver certificaciones
            </Link>
          </div>
        </div>
        {sugerencias.length > 0 && (
          <section className={k.sugerencias} aria-labelledby="sug-titulo">
            <p className={s.eyebrow}>Para empezar</p>
            <h2 id="sug-titulo" className={k.subtitulo}>Los más solicitados.</h2>
            <ul className={k.rejillaSug}>
              {sugerencias.map((p) => (
                <li key={p.id}><TarjetaPrograma programa={p} /></li>
              ))}
            </ul>
          </section>
        )}
      </div>
    );
  }

  const hayDemo = items.some((i) => i.demo);

  return (
    <div className={`${s.contenedor} ${k.pagina}`}>
      <ol className={k.pasos} aria-label="Progreso de compra">
        <li aria-current="step">Carrito</li>
        <li>Datos y pago</li>
        <li>Confirmación</li>
      </ol>
      <h1 className={k.titulo}>
        Tu carrito <span className={k.tituloNum}>({items.length})</span>
      </h1>

      <div className={k.rejilla}>
        <div>
          {hayDemo && (
            <p className={s.avisoDemo} style={{ marginBottom: 16 }}>
              Incluye programas del catálogo de ejemplo: el pago se simula.
            </p>
          )}
          <ul className={k.lista}>
            {items.map((it) => {
              const cat = categoriaPorSlug(it.categoria ?? "negocios");
              return (
                <li key={it.slug} className={`${s.tarjeta} ${k.item}`}>
                  <Imagen
                    src={it.imagen}
                    alt=""
                    className={k.itemImagen}
                    respaldo={<Portada slug={it.slug} categoria={cat.slug} />}
                  />
                  <div className={k.itemTexto}>
                    <p className={k.itemTipo}>
                      {it.tipo ? TIPO_LABEL[it.tipo] : "Programa"} · {cat.nombre}
                    </p>
                    <h2 className={k.itemTitulo}>
                      <Link href={RUTAS.programa(it.slug)}>{it.titulo}</Link>
                    </h2>
                    <p className={s.meta}>
                      {it.horas} h{it.modalidad ? ` · ${MODALIDAD_LABEL[it.modalidad]}` : ""}
                    </p>
                  </div>
                  <p className={k.itemPrecio}>{precio(it.precioMxn)}</p>
                  <button
                    type="button"
                    className={k.quitar}
                    onClick={() => quitar(it.slug)}
                    aria-label={`Eliminar ${it.titulo} del carrito`}
                  >
                    <Trash2 size={18} aria-hidden />
                    <span>Eliminar</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <Link href={RUTAS.catalogo()} className={k.seguir}>
            ← Seguir explorando
          </Link>
        </div>

        <aside className={k.lateral} aria-label="Resumen del pedido">
          <Totales>
            <CampoCupon />
            <Link href={RUTAS.checkout} className={`${s.btn} ${s.btnPrimario} ${s.btnGrande} ${s.btnBloque}`}>
              Proceder al pago <ArrowRight size={18} aria-hidden />
            </Link>
            <p className={k.seguro}>
              <Lock size={14} aria-hidden /> Pago seguro. Tarjeta, transferencia u OXXO.
            </p>
          </Totales>
        </aside>
      </div>
    </div>
  );
}
