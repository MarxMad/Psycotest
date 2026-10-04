"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { animate, stagger } from "animejs";
import { Clock, GraduationCap, MapPin } from "lucide-react";
import {
  MODALIDAD_LABEL,
  NIVEL_LABEL,
  precioMxn,
  type Diplomado,
} from "@/lib/diplomados-formato";
import { BotonAgregar } from "./BotonAgregar";
import { PortadaDiplomado } from "./PortadaDiplomado";
import s from "./ceduct.module.css";

type Area = { slug: string; nombre: string; total: number };

/**
 * La ficha sigue al cursor: guarda dónde está el puntero en variables CSS y
 * el resto (resplandor, filo encendido, inclinación) lo resuelve la hoja de
 * estilos. Así no hay re-render por movimiento del ratón.
 */
function seguirPuntero(e: React.PointerEvent<HTMLElement>) {
  if (e.pointerType !== "mouse") return;
  const nodo = e.currentTarget;
  const caja = nodo.getBoundingClientRect();
  const x = (e.clientX - caja.left) / caja.width;
  const y = (e.clientY - caja.top) / caja.height;
  nodo.style.setProperty("--mx", `${(x * 100).toFixed(2)}%`);
  nodo.style.setProperty("--my", `${(y * 100).toFixed(2)}%`);
  nodo.style.setProperty("--gx", (x - 0.5).toFixed(3));
  nodo.style.setProperty("--gy", (y - 0.5).toFixed(3));
}

function soltarPuntero(e: React.PointerEvent<HTMLElement>) {
  const nodo = e.currentTarget;
  nodo.style.setProperty("--gx", "0");
  nodo.style.setProperty("--gy", "0");
}

/** Catálogo con su portada: la página /diplomados. */
export function Catalogo({
  diplomados,
  areas,
}: {
  diplomados: Diplomado[];
  areas: Area[];
}) {
  return (
    <>
      <section className={s.portada}>
        <div className={s.portadaInterior}>
          <p className={s.eyebrow}>Formación con ruta a la certificación</p>
          <h1 className={s.portadaTitulo}>Diplomados y certificaciones</h1>
          <p className={s.portadaTexto}>
            Programas que preparan para un estándar de competencia y terminan en
            una constancia con validez oficial. Cada uno indica a qué clave te
            lleva.
          </p>
        </div>
      </section>
      <RejillaDiplomados diplomados={diplomados} areas={areas} />
    </>
  );
}

/** Sólo los filtros y las fichas: va dentro de /diplomados y de la portada del canal. */
export function RejillaDiplomados({
  diplomados,
  areas,
  id,
}: {
  diplomados: Diplomado[];
  areas: Area[];
  id?: string;
}) {
  const [area, setArea] = useState<string>("todos");
  const rejilla = useRef<HTMLDivElement>(null);

  const visibles = useMemo(
    () =>
      area === "todos"
        ? diplomados
        : diplomados.filter((d) => d.categoriaSlug === area),
    [area, diplomados],
  );

  // Las fichas entran escalonadas al cargar y al cambiar de filtro.
  useEffect(() => {
    const nodos =
      rejilla.current?.querySelectorAll<HTMLElement>("[data-ficha]");
    if (!nodos?.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    animate(Array.from(nodos), {
      opacity: [0, 1],
      translateY: [18, 0],
      duration: 520,
      delay: stagger(55),
      ease: "out(3)",
    });
  }, [area]);

  return (
    <section className={s.catalogo} id={id}>
      {areas.length > 1 && (
        <div className={s.filtros} role="group" aria-label="Filtrar por área">
          <button
            type="button"
            className={`${s.filtro} ${area === "todos" ? s.filtroActivo : ""}`}
            onClick={() => setArea("todos")}
            aria-pressed={area === "todos"}
          >
            Todos <span>{diplomados.length}</span>
          </button>
          {areas.map((a) => (
            <button
              key={a.slug}
              type="button"
              className={`${s.filtro} ${area === a.slug ? s.filtroActivo : ""}`}
              onClick={() => setArea(a.slug)}
              aria-pressed={area === a.slug}
            >
              {a.nombre} <span>{a.total}</span>
            </button>
          ))}
        </div>
      )}

      {visibles.length === 0 ? (
        <p className={s.vacio}>
          Todavía no hay diplomados publicados en esta área. Escríbenos y te
          avisamos cuando abra la siguiente generación.
        </p>
      ) : (
        <div className={s.rejilla} ref={rejilla}>
          {visibles.map((d) => (
            <article
              key={d.id}
              className={s.ficha}
              data-ficha
              onPointerMove={seguirPuntero}
              onPointerLeave={soltarPuntero}
            >
              <Link
                href={`/diplomados/${d.slug}`}
                className={s.fichaImagen}
                tabIndex={-1}
                aria-hidden
              >
                {d.imagen ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.imagen} alt="" loading="lazy" />
                ) : (
                  <PortadaDiplomado
                    slug={d.slug}
                    clave={d.estandarClave}
                    className={s.fichaPortada}
                  />
                )}
                {d.estandarClave && (
                  <span className={s.fichaClave}>{d.estandarClave}</span>
                )}
              </Link>

              <div className={s.fichaCuerpo}>
                {d.categoria && <p className={s.fichaArea}>{d.categoria}</p>}
                <h2 className={s.fichaTitulo}>
                  <Link href={`/diplomados/${d.slug}`}>{d.titulo}</Link>
                </h2>
                {d.subtitulo && <p className={s.fichaSub}>{d.subtitulo}</p>}

                <ul className={s.fichaDatos}>
                  <li>
                    <Clock size={14} aria-hidden /> {d.horas} horas
                  </li>
                  <li>
                    <MapPin size={14} aria-hidden />{" "}
                    {MODALIDAD_LABEL[d.modalidad]}
                  </li>
                  <li>
                    <GraduationCap size={14} aria-hidden />{" "}
                    {NIVEL_LABEL[d.nivel]}
                  </li>
                </ul>

                <div className={s.fichaPie}>
                  <span className={s.fichaPrecio}>
                    {precioMxn(d.precioMxn)}
                  </span>
                  <div className={s.fichaAcciones}>
                    <Link
                      href={`/diplomados/${d.slug}`}
                      className={s.btnSecundario}
                    >
                      Ver detalle
                    </Link>
                    <BotonAgregar diplomado={d} compacto />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
