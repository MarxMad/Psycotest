"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { animate, stagger } from "animejs";
import { ArrowRight, ChevronDown, Clock, PlayCircle, Radio } from "lucide-react";
import { whatsapp } from "@/lib/contacto";
import { menosMovimiento, useAparicionLista } from "@/lib/aparicion";
import s from "./RejillaCursos.module.css";

export type CursoVista = {
  id: string;
  slug: string;
  titulo: string;
  resumen: string;
  imagen: string;
  minutos: number;
  nivel: string;
  /** Centavos. Cero significa que se cotiza, no que sea gratis. */
  precio: number;
  categoriaId: string;
  categoriaNombre: string;
  formato: "vivo" | "grabado";
};

const pesos = (centavos: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(centavos / 100);

const horas = (minutos: number) => {
  if (!minutos) return null;
  const h = minutos / 60;
  return Number.isInteger(h) ? `${h} h` : `${minutos} min`;
};

/**
 * El catálogo de la academia.
 *
 * Quien llega no busca «un curso»: busca uno en vivo para su equipo o uno
 * grabado para avanzar hoy. Por eso lo primero que se puede tocar es ese
 * corte, y la rejilla se vuelve a acomodar en orden en vez de parpadear.
 */
const ASOMO = 9;

export function RejillaCursos({ cursos }: { cursos: CursoVista[] }) {
  const [filtro, setFiltro] = useState("todos");
  const [completo, setCompleto] = useState(false);
  const rejilla = useRef<HTMLDivElement>(null);
  const primera = useRef(true);
  const previo = useRef({ filtro: "todos", completo: false });
  const entrada = useAparicionLista<HTMLDivElement>({ selector: "[data-tarjeta]", separacion: 60 });

  const categorias = useMemo(() => {
    const vistas = new Map<string, { id: string; nombre: string; formato: CursoVista["formato"] }>();
    cursos.forEach((c) => {
      if (!vistas.has(c.categoriaId)) {
        vistas.set(c.categoriaId, {
          id: c.categoriaId,
          nombre: c.categoriaNombre,
          formato: c.formato,
        });
      }
    });
    return [...vistas.values()];
  }, [cursos]);

  const filtros = useMemo(
    () => [
      { id: "todos", label: "Todos", total: cursos.length },
      {
        id: "vivo",
        label: "En vivo",
        total: cursos.filter((c) => c.formato === "vivo").length,
      },
      {
        id: "grabado",
        label: "Grabados",
        total: cursos.filter((c) => c.formato === "grabado").length,
      },
      ...categorias.map((cat) => ({
        id: `cat:${cat.id}`,
        label: cat.nombre,
        total: cursos.filter((c) => c.categoriaId === cat.id).length,
      })),
    ],
    [cursos, categorias],
  );

  const delCorte = useMemo(() => {
    if (filtro === "todos") return cursos;
    if (filtro === "vivo" || filtro === "grabado") {
      return cursos.filter((c) => c.formato === filtro);
    }
    const id = filtro.slice(4);
    return cursos.filter((c) => c.categoriaId === id);
  }, [cursos, filtro]);

  // La portada asoma nueve y guarda el resto: veinte tarjetas seguidas tapan
  // todo lo que viene después.
  const visibles = completo ? delCorte : delCorte.slice(0, ASOMO);
  const faltan = delCorte.length - visibles.length;

  // Al cambiar el corte, las tarjetas que quedan entran en orden.
  useEffect(() => {
    if (primera.current) {
      primera.current = false;
      return;
    }
    const nodo = rejilla.current;
    if (!nodo || menosMovimiento()) return;

    // Abrir el resto no debería reiniciar lo que ya estaba a la vista: en ese
    // caso sólo entran las tarjetas nuevas.
    const soloNuevas = previo.current.filtro === filtro && !previo.current.completo && completo;
    previo.current = { filtro, completo };

    const todas = Array.from(nodo.querySelectorAll<HTMLElement>("[data-tarjeta]"));
    const tarjetas = soloNuevas ? todas.slice(ASOMO) : todas;
    if (!tarjetas.length) return;

    const animacion = animate(tarjetas, {
      opacity: [0, 1],
      translateY: [14, 0],
      scale: [0.98, 1],
      duration: 480,
      delay: stagger(35),
      ease: "out(3)",
    });
    return () => {
      animacion.pause();
      tarjetas.forEach((t) => {
        t.style.opacity = "";
        t.style.transform = "";
      });
    };
  }, [filtro, completo]);

  if (!cursos.length) {
    return (
      <p className={s.vacio}>
        El catálogo se está publicando. Escríbenos y te mandamos el temario completo.
      </p>
    );
  }

  return (
    <div className={s.caja}>
      <div className={s.filtros} role="group" aria-label="Filtrar el catálogo">
        {filtros.map((f) => (
          <button
            key={f.id}
            type="button"
            className={s.filtro}
            data-activo={filtro === f.id}
            aria-pressed={filtro === f.id}
            onClick={() => {
              setFiltro(f.id);
              setCompleto(false);
            }}
          >
            {f.label}
            <span className={s.cuenta}>{f.total}</span>
          </button>
        ))}
      </div>

      <div
        className={s.rejilla}
        ref={(n) => {
          rejilla.current = n;
          entrada.current = n;
        }}
      >
        {visibles.map((curso) => (
          <article key={curso.id} className={s.tarjeta} data-tarjeta>
            <div className={s.media}>
              <Image
                src={curso.imagen}
                alt=""
                fill
                sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
                className={s.foto}
              />
              <span className={s.formato} data-formato={curso.formato}>
                {curso.formato === "vivo" ? (
                  <Radio size={13} aria-hidden />
                ) : (
                  <PlayCircle size={13} aria-hidden />
                )}
                {curso.formato === "vivo" ? "En vivo" : "Grabado"}
              </span>
            </div>

            <div className={s.cuerpo}>
              <p className={s.categoria}>{curso.categoriaNombre}</p>
              <h3 className={s.titulo}>{curso.titulo}</h3>
              <p className={s.resumen}>{curso.resumen}</p>

              <ul className={s.meta}>
                {horas(curso.minutos) && (
                  <li>
                    <Clock size={13} aria-hidden />
                    {horas(curso.minutos)}
                  </li>
                )}
                <li>{curso.nivel}</li>
              </ul>

              <div className={s.acciones}>
                {curso.precio > 0 ? (
                  <a className={s.principal} href={`/cursos/${curso.slug}`}>
                    Comprar · {pesos(curso.precio)}
                    <ArrowRight size={15} aria-hidden />
                  </a>
                ) : (
                  <a
                    className={s.principal}
                    href={whatsapp(
                      `Hola, quiero cotizar el curso «${curso.titulo}» (${
                        curso.formato === "vivo" ? "en vivo" : "grabado"
                      }).`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Cotizar
                    <ArrowRight size={15} aria-hidden />
                  </a>
                )}
                <a className={s.secundaria} href={`/cursos/${curso.slug}`}>
                  Ver temario
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>

      {faltan > 0 && (
        <div className={s.masCaja}>
          <button type="button" className={s.mas} onClick={() => setCompleto(true)}>
            Ver los {delCorte.length} cursos
            <ChevronDown size={16} aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
