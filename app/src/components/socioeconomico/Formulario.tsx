"use client";

import { Plus, Trash2 } from "lucide-react";
import type { Campo, Fila, Seccion, Valor, ValoresSeccion } from "@/data/socioeconomico";
import { filasDe, texto } from "@/lib/socioeconomico";
import s from "./socioeconomico.module.css";

/**
 * Pinta una sección del estudio como formulario. La misma pieza la usan el
 * candidato (su parte) y el investigador (la suya) desde el panel.
 */
export function FormularioSeccion({
  seccion,
  valores,
  onChange,
  prefijo = "",
}: {
  seccion: Seccion;
  valores: ValoresSeccion;
  onChange: (next: ValoresSeccion) => void;
  /** Distingue los `id` de los controles cuando hay dos formularios en la página. */
  prefijo?: string;
}) {
  const pon = (id: string, v: Valor | Fila[]) => onChange({ ...valores, [id]: v });
  const base = `${prefijo}${seccion.id}`;

  return (
    <div className={s.seccion}>
      {seccion.campos && (
        <div className={s.rejilla}>
          {seccion.campos.map((c) => (
            <Control key={c.id} campo={c} valor={valores[c.id] as Valor} onChange={(v) => pon(c.id, v)} idBase={base} />
          ))}
        </div>
      )}

      {seccion.lista && (
        <ListaEditable seccion={seccion} valores={valores} onChange={(filas) => pon(seccion.lista!.id, filas)} idBase={base} />
      )}

      {seccion.camposFinales && (
        <div className={s.rejilla}>
          {seccion.camposFinales.map((c) => (
            <Control key={c.id} campo={c} valor={valores[c.id] as Valor} onChange={(v) => pon(c.id, v)} idBase={base} />
          ))}
        </div>
      )}
    </div>
  );
}

function ListaEditable({
  seccion,
  valores,
  onChange,
  idBase,
}: {
  seccion: Seccion;
  valores: ValoresSeccion;
  onChange: (filas: Fila[]) => void;
  idBase: string;
}) {
  const lista = seccion.lista!;
  const guardadas = filasDe(valores, seccion);
  // Las listas con mínimo arrancan con esos renglones ya puestos.
  const filas: Fila[] =
    guardadas.length >= lista.min
      ? guardadas
      : [...guardadas, ...Array.from({ length: lista.min - guardadas.length }, (): Fila => ({}))];

  const cambiarFila = (i: number, fila: Fila) => onChange(filas.map((f, j) => (j === i ? fila : f)));

  return (
    <div className={s.lista}>
      {filas.map((fila, i) => (
        <fieldset key={i} className={s.fila}>
          <legend>
            {lista.elemento} {i + 1}
          </legend>
          {filas.length > lista.min && (
            <button
              type="button"
              className={s.quitar}
              onClick={() => onChange(filas.filter((_, j) => j !== i))}
              aria-label={`Quitar ${lista.elemento.toLowerCase()} ${i + 1}`}
            >
              <Trash2 size={15} aria-hidden /> Quitar
            </button>
          )}
          <div className={s.rejilla}>
            {lista.campos.map((c) => (
              <Control
                key={c.id}
                campo={c}
                valor={fila[c.id]}
                onChange={(v) => cambiarFila(i, { ...fila, [c.id]: v })}
                idBase={`${idBase}-${i}`}
              />
            ))}
          </div>
        </fieldset>
      ))}
      {filas.length < lista.max && (
        <button type="button" className={`btn ${s.agregar}`} onClick={() => onChange([...filas, {}])}>
          <Plus size={15} aria-hidden /> Agregar {lista.elemento.toLowerCase()}
        </button>
      )}
    </div>
  );
}

const TIPO_INPUT: Partial<Record<Campo["tipo"], string>> = {
  fecha: "date",
  hora: "time",
  numero: "number",
  telefono: "tel",
  correo: "email",
};

function Control({
  campo: c,
  valor,
  onChange,
  idBase,
}: {
  campo: Campo;
  valor: Valor | undefined;
  onChange: (v: Valor) => void;
  idBase: string;
}) {
  const id = `${idBase}-${c.id}`;
  const etiqueta = (
    <>
      {c.etiqueta}
      {c.requerido && <span className={s.obligatorio} aria-hidden> *</span>}
    </>
  );
  const ayuda = c.ayuda ? <small className={s.ayuda}>{c.ayuda}</small> : null;

  if (c.tipo === "opcion" || c.tipo === "sino" || c.tipo === "escala") {
    const actual = texto(valor);
    return (
      <fieldset className={s.campo} data-ancho={c.ancho ?? (c.tipo === "opcion" ? "completo" : "medio")}>
        <legend className={s.etiqueta}>{etiqueta}</legend>
        <div className={s.opciones} data-escala={c.tipo === "escala" || undefined}>
          {(c.opciones ?? []).map((o) => (
            <label key={o} className={s.opcion} data-on={actual === o || undefined}>
              <input
                type="radio"
                name={id}
                value={o}
                checked={actual === o}
                required={c.requerido}
                // Volver a pulsar la marcada la quita: así se corrige un clic de más.
                onClick={() => actual === o && onChange("")}
                onChange={() => onChange(o)}
              />
              {o}
            </label>
          ))}
        </div>
        {ayuda}
      </fieldset>
    );
  }

  if (c.tipo === "multiple") {
    const actual = Array.isArray(valor) ? valor : [];
    return (
      <fieldset className={s.campo} data-ancho={c.ancho ?? "completo"}>
        <legend className={s.etiqueta}>{etiqueta}</legend>
        <div className={s.opciones}>
          {(c.opciones ?? []).map((o) => (
            <label key={o} className={s.opcion} data-on={actual.includes(o) || undefined}>
              <input
                type="checkbox"
                checked={actual.includes(o)}
                onChange={() => onChange(actual.includes(o) ? actual.filter((x) => x !== o) : [...actual, o])}
              />
              {o}
            </label>
          ))}
        </div>
        {ayuda}
      </fieldset>
    );
  }

  return (
    <div className={s.campo} data-ancho={c.ancho ?? (c.tipo === "textoLargo" ? "completo" : "medio")}>
      <label htmlFor={id} className={s.etiqueta}>
        {etiqueta}
      </label>
      {c.tipo === "textoLargo" ? (
        <textarea id={id} rows={3} value={texto(valor)} required={c.requerido} maxLength={2000} onChange={(e) => onChange(e.target.value)} />
      ) : c.tipo === "moneda" ? (
        <span className={s.moneda}>
          <span aria-hidden>$</span>
          <input
            id={id}
            inputMode="decimal"
            value={texto(valor)}
            required={c.requerido}
            placeholder="0.00"
            onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ""))}
          />
        </span>
      ) : (
        <input
          id={id}
          type={TIPO_INPUT[c.tipo] ?? "text"}
          value={texto(valor)}
          required={c.requerido}
          maxLength={c.tipo === "texto" ? 300 : undefined}
          min={c.tipo === "numero" ? 0 : undefined}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {ayuda}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Lectura                                                             */
/* ------------------------------------------------------------------ */

/** La misma sección, para leer: sólo lo que tiene respuesta. */
export function LecturaSeccion({ seccion, valores }: { seccion: Seccion; valores: ValoresSeccion | undefined }) {
  const v = valores ?? {};
  const pares = (campos: Campo[], fuente: Fila | ValoresSeccion) =>
    campos
      .map((c) => [c.etiqueta, texto(fuente[c.id] as Valor)] as const)
      .filter(([, val]) => val !== "");

  const arriba = pares(seccion.campos ?? [], v);
  const abajo = pares(seccion.camposFinales ?? [], v);
  const filas = filasDe(v, seccion);
  const vacio = !arriba.length && !abajo.length && !filas.length;

  return (
    <div className={s.lectura}>
      {vacio && <p className={s.sinDatos}>Sin datos capturados.</p>}
      {arriba.length > 0 && <Pares pares={arriba} />}
      {filas.map((f, i) => {
        const p = pares(seccion.lista!.campos, f);
        return (
          <div key={i} className={s.lecturaFila}>
            <h4>
              {seccion.lista!.elemento} {i + 1}
            </h4>
            {p.length ? <Pares pares={p} /> : <p className={s.sinDatos}>Vacío.</p>}
          </div>
        );
      })}
      {abajo.length > 0 && <Pares pares={abajo} />}
    </div>
  );
}

function Pares({ pares }: { pares: (readonly [string, string])[] }) {
  return (
    <dl className={s.pares}>
      {pares.map(([k, val]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{val}</dd>
        </div>
      ))}
    </dl>
  );
}
