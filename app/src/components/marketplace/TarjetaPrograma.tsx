import Link from "next/link";
import { categoriaPorSlug } from "@/lib/ceduct/config";
import { RUTAS } from "@/lib/ceduct/rutas";
import {
  MODALIDAD_LABEL,
  TIPO_LABEL,
  fechaCorta,
  precio,
  type Programa,
} from "@/lib/ceduct/tipos";
import { BotonAgregar } from "./BotonesCompra";
import { Imagen } from "./Imagen";
import { Portada } from "./Portada";
import s from "./mk.module.css";
import t from "./tarjeta.module.css";

/**
 * Tarjeta de programa. Toda la tarjeta lleva a la ficha (enlace estirado
 * sobre el título) y el botón queda por encima para agregar sin salir.
 */
export function TarjetaPrograma({
  programa: p,
  prioridad,
  variante = "normal",
}: {
  programa: Programa;
  prioridad?: boolean;
  variante?: "normal" | "ancha";
}) {
  const cat = categoriaPorSlug(p.categoria);
  const quedan = p.cupo === null ? null : Math.max(0, p.cupo - p.vendidos);

  return (
    <article className={`${s.tarjeta} ${s.tarjetaInteractiva} ${t.tarjeta}`} data-variante={variante}>
      <div className={t.media}>
        <Imagen
          src={p.imagen}
          alt=""
          prioridad={prioridad}
          className={t.imagen}
          respaldo={<Portada slug={p.slug} categoria={p.categoria} etiqueta={p.estandarClave} />}
        />
        <div className={t.chips}>
          <span className={`${s.chip} ${p.tipo === "certificacion" ? s.chipNaranja : ""}`}>
            {TIPO_LABEL[p.tipo]}
          </span>
          {p.estandarClave && <span className={`${s.chip} ${s.chipOscuro}`}>{p.estandarClave}</span>}
        </div>
        {p.precioAntesMxn && p.precioAntesMxn > p.precioMxn && (
          <span className={`${s.chip} ${s.chipOscuro} ${t.promo}`}>
            −{Math.round((1 - p.precioMxn / p.precioAntesMxn) * 100)}%
          </span>
        )}
      </div>

      <div className={t.cuerpo}>
        <p className={t.categoria} style={{ "--tono": cat.tono } as React.CSSProperties}>
          {cat.nombre}
        </p>
        <h3 className={t.titulo}>
          <Link href={RUTAS.programa(p.slug)} className={t.enlace}>
            {p.titulo}
          </Link>
        </h3>

        <ul className={t.datos} aria-label="Detalles">
          {p.horas > 0 && <li>{p.horas} h</li>}
          <li>{p.duracion}</li>
          <li>{MODALIDAD_LABEL[p.modalidad]}</li>
          <li>{p.fechaInicio ? `Inicia ${fechaCorta(p.fechaInicio)}` : "Inicio inmediato"}</li>
        </ul>

        {quedan !== null && quedan > 0 && quedan <= 8 && (
          <p className={t.cupo}>Quedan {quedan} lugares</p>
        )}

        <div className={t.pie}>
          <p className={t.precio}>
            <span className={s.visualmenteOculto}>Precio: </span>
            <strong>{precio(p.precioMxn)}</strong>
            {p.precioAntesMxn && p.precioAntesMxn > p.precioMxn && (
              <del>
                <span className={s.visualmenteOculto}>antes </span>
                {precio(p.precioAntesMxn)}
              </del>
            )}
            {p.precioMxn > 0 && <small>MXN · IVA incluido</small>}
          </p>
          <div className={t.accion}>
            <BotonAgregar programa={p} compacto />
          </div>
        </div>
      </div>
    </article>
  );
}
