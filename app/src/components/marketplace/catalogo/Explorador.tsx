"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { CATEGORIAS } from "@/lib/ceduct/config";
import {
  MODALIDAD_LABEL,
  TIPO_PLURAL,
  precio,
  type Modalidad,
  type Programa,
  type TipoPrograma,
} from "@/lib/ceduct/tipos";
import { TarjetaPrograma } from "../TarjetaPrograma";
import s from "../mk.module.css";
import c from "./catalogo.module.css";

export type FiltrosIniciales = {
  q?: string;
  tipo?: string;
  categoria?: string;
  modalidad?: string;
  max?: string;
  orden?: string;
};

type Orden = "relevancia" | "precio-asc" | "precio-desc" | "inicio";

const ORDENES: { valor: Orden; label: string }[] = [
  { valor: "relevancia", label: "Destacados" },
  { valor: "precio-asc", label: "Precio: menor a mayor" },
  { valor: "precio-desc", label: "Precio: mayor a menor" },
  { valor: "inicio", label: "Próximos a iniciar" },
];

const MODALIDADES: Modalidad[] = ["online", "presencial", "mixta"];

/** Quita acentos y mayúsculas para que «diseno» encuentre «Diseño». */
function normalizar(t: string) {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function lista(valor: string | undefined): string[] {
  return (valor ?? "").split(",").map((x) => x.trim()).filter(Boolean);
}

export function Explorador({
  programas,
  iniciales,
}: {
  programas: Programa[];
  iniciales: FiltrosIniciales;
}) {
  const ruta = usePathname();

  const techo = useMemo(
    () => Math.max(100_00, ...programas.map((p) => p.precioMxn)),
    [programas],
  );
  // Paso del deslizador: $500.
  const techoRedondo = Math.ceil(techo / 500_00) * 500_00;

  const [q, setQ] = useState(iniciales.q ?? "");
  const [tipo, setTipo] = useState<TipoPrograma | "todos">(
    iniciales.tipo === "diplomado" || iniciales.tipo === "certificacion" ? iniciales.tipo : "todos",
  );
  const [categorias, setCategorias] = useState<string[]>(lista(iniciales.categoria));
  const [modalidades, setModalidades] = useState<Modalidad[]>(
    lista(iniciales.modalidad).filter((m): m is Modalidad => MODALIDADES.includes(m as Modalidad)),
  );
  const [max, setMax] = useState<number>(() => {
    const n = Number(iniciales.max) * 100;
    return Number.isFinite(n) && n > 0 ? Math.min(n, techoRedondo) : techoRedondo;
  });
  const [orden, setOrden] = useState<Orden>(
    ORDENES.some((o) => o.valor === iniciales.orden) ? (iniciales.orden as Orden) : "relevancia",
  );
  const [panelAbierto, setPanelAbierto] = useState(false);

  const qDiferida = useDeferredValue(q);

  // Los filtros viven en la URL: se pueden compartir y sobreviven al «atrás».
  useEffect(() => {
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (tipo !== "todos") p.set("tipo", tipo);
    if (categorias.length) p.set("categoria", categorias.join(","));
    if (modalidades.length) p.set("modalidad", modalidades.join(","));
    if (max < techoRedondo) p.set("max", String(Math.round(max / 100)));
    if (orden !== "relevancia") p.set("orden", orden);
    const qs = p.toString();
    // replaceState y no router.replace: cambiar un filtro no debe volver a
    // pedir la página al servidor.
    const t = setTimeout(() => window.history.replaceState(null, "", `${ruta}${qs ? `?${qs}` : ""}`), 250);
    return () => clearTimeout(t);
  }, [q, tipo, categorias, modalidades, max, orden, techoRedondo, ruta]);

  // Si el buscador del navbar cambia la URL estando aquí, se adopta.
  useEffect(() => {
    const nueva = iniciales.q ?? "";
    setQ((actual) => (actual.trim() === nueva ? actual : nueva));
  }, [iniciales.q]);

  useEffect(() => {
    if (iniciales.tipo === "diplomado" || iniciales.tipo === "certificacion") setTipo(iniciales.tipo);
    else if (!iniciales.tipo) setTipo("todos");
  }, [iniciales.tipo]);

  const visibles = useMemo(() => {
    const termino = normalizar(qDiferida.trim());
    const filtrados = programas.filter((p) => {
      if (tipo !== "todos" && p.tipo !== tipo) return false;
      if (categorias.length && !categorias.includes(p.categoria)) return false;
      if (modalidades.length && !modalidades.includes(p.modalidad)) return false;
      if (p.precioMxn > max) return false;
      if (termino) {
        const texto = normalizar(
          [p.titulo, p.subtitulo, p.descripcion, p.estandarClave, ...p.instructores.map((i) => i.nombre)]
            .filter(Boolean)
            .join(" "),
        );
        return termino.split(/\s+/).every((t) => texto.includes(t));
      }
      return true;
    });
    const ordenados = [...filtrados];
    if (orden === "precio-asc") ordenados.sort((a, b) => a.precioMxn - b.precioMxn);
    if (orden === "precio-desc") ordenados.sort((a, b) => b.precioMxn - a.precioMxn);
    if (orden === "inicio")
      ordenados.sort((a, b) => (a.fechaInicio ?? "0000").localeCompare(b.fechaInicio ?? "0000"));
    if (orden === "relevancia") ordenados.sort((a, b) => Number(b.destacado) - Number(a.destacado));
    return ordenados;
  }, [programas, qDiferida, tipo, categorias, modalidades, max, orden]);

  const conteo = (pred: (p: Programa) => boolean) => programas.filter(pred).length;
  const activos =
    (tipo !== "todos" ? 1 : 0) + categorias.length + modalidades.length + (max < techoRedondo ? 1 : 0);

  function limpiar() {
    setQ("");
    setTipo("todos");
    setCategorias([]);
    setModalidades([]);
    setMax(techoRedondo);
    setOrden("relevancia");
  }

  function alternar<T>(arr: T[], v: T): T[] {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  }

  const titulo = tipo === "todos" ? "Catálogo completo" : TIPO_PLURAL[tipo];

  return (
    <div className={`${s.contenedor} ${c.explorador}`}>
      <header className={c.cabecera}>
        <p className={s.eyebrow}>Catálogo</p>
        <h1 className={c.titulo}>{titulo}</h1>
        <div className={c.buscador}>
          <Search size={20} aria-hidden />
          <label htmlFor="buscar-catalogo" className={s.visualmenteOculto}>
            Buscar en el catálogo
          </label>
          <input
            id="buscar-catalogo"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Busca por tema, estándar (EC0217) o instructor"
            autoComplete="off"
          />
          {q && (
            <button type="button" onClick={() => setQ("")} aria-label="Borrar búsqueda" className={c.borrar}>
              <X size={18} aria-hidden />
            </button>
          )}
        </div>

        <div className={c.tipos} role="radiogroup" aria-label="Tipo de programa">
          {(["todos", "diplomado", "certificacion"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={tipo === t}
              className={c.tipo}
              onClick={() => setTipo(t)}
            >
              {t === "todos" ? "Todos" : TIPO_PLURAL[t]}
              <span>{t === "todos" ? programas.length : conteo((p) => p.tipo === t)}</span>
            </button>
          ))}
        </div>
      </header>

      <div className={c.cuerpo}>
        <button
          type="button"
          className={`${s.btn} ${s.btnSecundario} ${c.abrirFiltros}`}
          aria-expanded={panelAbierto}
          aria-controls="panel-filtros"
          onClick={() => setPanelAbierto((v) => !v)}
        >
          <SlidersHorizontal size={16} aria-hidden /> Filtros{activos ? ` (${activos})` : ""}
        </button>

        <aside id="panel-filtros" className={c.panel} data-abierto={panelAbierto} aria-label="Filtros">
          <fieldset className={c.grupo}>
            <legend>Categoría</legend>
            {CATEGORIAS.map((cat) => {
              const n = conteo((p) => p.categoria === cat.slug);
              return (
                <label key={cat.slug} className={c.opcion}>
                  <input
                    type="checkbox"
                    checked={categorias.includes(cat.slug)}
                    onChange={() => setCategorias((a) => alternar(a, cat.slug))}
                  />
                  <span className={c.marca} style={{ "--tono": cat.tono } as React.CSSProperties} aria-hidden />
                  <span className={c.opcionTexto}>{cat.nombre}</span>
                  <span className={c.opcionNum}>{n}</span>
                </label>
              );
            })}
          </fieldset>

          <fieldset className={c.grupo}>
            <legend>Modalidad</legend>
            {MODALIDADES.map((m) => (
              <label key={m} className={c.opcion}>
                <input
                  type="checkbox"
                  checked={modalidades.includes(m)}
                  onChange={() => setModalidades((a) => alternar(a, m))}
                />
                <span className={c.marca} aria-hidden />
                <span className={c.opcionTexto}>{MODALIDAD_LABEL[m]}</span>
                <span className={c.opcionNum}>{conteo((p) => p.modalidad === m)}</span>
              </label>
            ))}
          </fieldset>

          <fieldset className={c.grupo}>
            <legend>Precio máximo</legend>
            <label htmlFor="precio-max" className={c.precioValor}>
              Hasta <strong>{precio(max)}</strong>
            </label>
            <input
              id="precio-max"
              type="range"
              min={0}
              max={techoRedondo}
              step={500_00}
              value={max}
              onChange={(e) => setMax(Number(e.target.value))}
              className={c.rango}
              style={{ "--avance": `${(max / techoRedondo) * 100}%` } as React.CSSProperties}
              aria-valuetext={precio(max)}
            />
            <div className={c.rangoEscala} aria-hidden>
              <span>$0</span>
              <span>{precio(techoRedondo)}</span>
            </div>
          </fieldset>

          {activos > 0 && (
            <button type="button" className={`${s.btn} ${s.btnFantasma} ${c.limpiar}`} onClick={limpiar}>
              <X size={16} aria-hidden /> Limpiar filtros
            </button>
          )}
        </aside>

        <section className={c.resultados} aria-labelledby="titulo-resultados">
          <div className={c.barra}>
            <p id="titulo-resultados" className={c.conteo} role="status" aria-live="polite">
              <strong>{visibles.length}</strong> {visibles.length === 1 ? "programa" : "programas"}
              {qDiferida.trim() && <> para «{qDiferida.trim()}»</>}
            </p>
            <label className={c.orden}>
              <span>Ordenar</span>
              <select value={orden} onChange={(e) => setOrden(e.target.value as Orden)} className={s.entrada}>
                {ORDENES.map((o) => (
                  <option key={o.valor} value={o.valor}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {visibles.length === 0 ? (
            <div className={c.vacio}>
              <h2>No encontramos programas con esos filtros.</h2>
              <p>Prueba con otra palabra o quita algún filtro.</p>
              <button type="button" className={`${s.btn} ${s.btnPrimario}`} onClick={limpiar}>
                Ver todo el catálogo
              </button>
            </div>
          ) : (
            <ul className={c.rejilla}>
              {visibles.map((p, i) => (
                <li key={p.id} className={c.celda} style={{ "--i": Math.min(i, 8) } as React.CSSProperties}>
                  <TarjetaPrograma programa={p} prioridad={i < 3} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
