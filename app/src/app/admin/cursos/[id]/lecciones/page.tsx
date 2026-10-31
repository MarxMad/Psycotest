"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/admin/Card";
import { EmptyState } from "@/components/admin/EmptyState";
import type { Course } from "@/db/schema";
import s from "./lecciones.module.css";

type Modulo = { id: string; title: string; sortOrder: number };
type Leccion = {
  id: string;
  title: string;
  description: string | null;
  type: "video" | "quiz" | "live_replay" | "reading";
  videoUrl: string | null;
  contentMarkdown: string | null;
  durationSeconds: number;
  freePreview: boolean;
  sortOrder: number;
};
type Bloque = { module: Modulo; lessons: Leccion[] };

const TIPOS: Record<Leccion["type"], string> = {
  video: "Video",
  reading: "Lectura",
  quiz: "Quiz",
  live_replay: "Grabación de clase",
};

export default function LeccionesPage() {
  const { id } = useParams<{ id: string }>();
  const [curso, setCurso] = useState<Course | null>(null);
  const [temario, setTemario] = useState<Bloque[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [nuevoModulo, setNuevoModulo] = useState("");
  const [abierta, setAbierta] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    const res = await fetch(`/api/courses/${id}/temario`);
    if (res.ok) setTemario((await res.json()).temario ?? []);
  }, [id]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/courses/${id}`);
        if (res.ok) setCurso((await res.json()).course);
        await recargar();
      } catch (e) {
        console.error(e);
      }
      setCargando(false);
    }
    load();
  }, [id, recargar]);

  /** Envía un cambio al temario y vuelve a leerlo; el error queda a la vista. */
  async function enviar(method: string, body?: object, query = "") {
    setError("");
    const res = await fetch(`/api/courses/${id}/temario${query}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo guardar");
      return null;
    }
    const data = await res.json();
    await recargar();
    return data;
  }

  /** Intercambia el orden con el vecino; los dos se guardan con su nuevo número. */
  async function mover<T extends { id: string; sortOrder: number }>(
    tipo: "modulo" | "leccion",
    lista: T[],
    i: number,
    paso: -1 | 1,
  ) {
    const otro = lista[i + paso];
    if (!otro) return;
    const actual = lista[i];
    // Si comparten número (datos viejos), el índice desempata.
    const a = actual.sortOrder === otro.sortOrder ? i : actual.sortOrder;
    const b = actual.sortOrder === otro.sortOrder ? i + paso : otro.sortOrder;
    await enviar("PATCH", { tipo, itemId: actual.id, sortOrder: b });
    await enviar("PATCH", { tipo, itemId: otro.id, sortOrder: a });
  }

  async function agregarModulo(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevoModulo.trim()) return;
    if (await enviar("POST", { tipo: "modulo", title: nuevoModulo })) setNuevoModulo("");
  }

  async function agregarLeccion(moduleId: string) {
    const data = await enviar("POST", { tipo: "leccion", moduleId, title: "Nueva lección" });
    if (data?.leccion) setAbierta(data.leccion.id);
  }

  if (cargando) {
    return (
      <Card>
        <p className={s.muted}>Cargando temario...</p>
      </Card>
    );
  }

  if (!curso) {
    return (
      <Card>
        <EmptyState title="Curso no encontrado" description="El curso que buscas no existe" />
      </Card>
    );
  }

  return (
    <div className={s.container}>
      <PageHeader
        title="Lecciones"
        subtitle={curso.title}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Cursos", href: "/admin/cursos" },
          { label: curso.title, href: `/admin/cursos/${id}` },
          { label: "Lecciones" },
        ]}
      />

      {error && (
        <p role="alert" className={s.error}>
          {error}
        </p>
      )}

      {temario.length === 0 && (
        <Card>
          <EmptyState
            title="Sin módulos"
            description="Crea el primer módulo y agrégale lecciones."
          />
        </Card>
      )}

      {temario.map((bloque, mi) => (
        <Card key={bloque.module.id} padding="none">
          <div className={s.moduloCabeza}>
            <span className={s.numero}>{mi + 1}</span>
            <input
              className={s.moduloTitulo}
              defaultValue={bloque.module.title}
              aria-label="Título del módulo"
              onBlur={(e) => {
                const t = e.target.value.trim();
                if (t && t !== bloque.module.title) {
                  void enviar("PATCH", { tipo: "modulo", itemId: bloque.module.id, title: t });
                }
              }}
            />
            <div className={s.herramientas}>
              <button
                type="button"
                className="btn btn-sm"
                disabled={mi === 0}
                onClick={() => mover("modulo", temario.map((b) => b.module), mi, -1)}
                aria-label="Subir módulo"
              >
                <ArrowUp size={14} />
              </button>
              <button
                type="button"
                className="btn btn-sm"
                disabled={mi === temario.length - 1}
                onClick={() => mover("modulo", temario.map((b) => b.module), mi, 1)}
                aria-label="Bajar módulo"
              >
                <ArrowDown size={14} />
              </button>
              <Borrar
                etiqueta="Borrar módulo"
                aviso={bloque.lessons.length ? `y sus ${bloque.lessons.length} lecciones` : ""}
                onConfirmar={() =>
                  enviar("DELETE", undefined, `?tipo=modulo&itemId=${bloque.module.id}`)
                }
              />
            </div>
          </div>

          <ol className={s.lecciones}>
            {bloque.lessons.map((lec, li) => (
              <li key={lec.id} className={s.leccion}>
                <div className={s.leccionFila}>
                  <button
                    type="button"
                    className={s.leccionNombre}
                    onClick={() => setAbierta(abierta === lec.id ? null : lec.id)}
                    aria-expanded={abierta === lec.id}
                  >
                    <span>{lec.title}</span>
                    <span className={s.etiqueta}>{TIPOS[lec.type]}</span>
                    {lec.freePreview && <span className={s.etiqueta}>Vista previa</span>}
                  </button>
                  <div className={s.herramientas}>
                    <button
                      type="button"
                      className="btn btn-sm"
                      disabled={li === 0}
                      onClick={() => mover("leccion", bloque.lessons, li, -1)}
                      aria-label="Subir lección"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm"
                      disabled={li === bloque.lessons.length - 1}
                      onClick={() => mover("leccion", bloque.lessons, li, 1)}
                      aria-label="Bajar lección"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <Borrar
                      etiqueta="Borrar lección"
                      onConfirmar={() => enviar("DELETE", undefined, `?tipo=leccion&itemId=${lec.id}`)}
                    />
                  </div>
                </div>
                {abierta === lec.id && (
                  <EditorLeccion
                    leccion={lec}
                    onGuardar={async (cambios) => {
                      const ok = await enviar("PATCH", { tipo: "leccion", itemId: lec.id, ...cambios });
                      if (ok) setAbierta(null);
                    }}
                  />
                )}
              </li>
            ))}
          </ol>

          <div className={s.pie}>
            <button type="button" className="btn btn-sm" onClick={() => agregarLeccion(bloque.module.id)}>
              <Plus size={14} />
              Agregar lección
            </button>
          </div>
        </Card>
      ))}

      <Card>
        <form className={s.nuevoModulo} onSubmit={agregarModulo}>
          <input
            className={s.input}
            value={nuevoModulo}
            onChange={(e) => setNuevoModulo(e.target.value)}
            placeholder="Título del nuevo módulo"
            aria-label="Título del nuevo módulo"
          />
          <button type="submit" className="btn btn-primary" disabled={!nuevoModulo.trim()}>
            <Plus size={16} />
            Agregar módulo
          </button>
        </form>
      </Card>
    </div>
  );
}

/** Borrar en dos pasos: el primer clic solo pregunta. */
function Borrar({
  etiqueta,
  aviso = "",
  onConfirmar,
}: {
  etiqueta: string;
  aviso?: string;
  onConfirmar: () => Promise<unknown>;
}) {
  const [preguntando, setPreguntando] = useState(false);
  if (!preguntando) {
    return (
      <button type="button" className="btn btn-sm" onClick={() => setPreguntando(true)} aria-label={etiqueta}>
        <Trash2 size={14} />
      </button>
    );
  }
  return (
    <span className={s.confirmar}>
      ¿Borrar{aviso ? ` ${aviso}` : ""}?
      <button
        type="button"
        className="btn btn-sm"
        onClick={async () => {
          await onConfirmar();
          setPreguntando(false);
        }}
      >
        Sí, borrar
      </button>
      <button type="button" className="btn btn-sm" onClick={() => setPreguntando(false)}>
        No
      </button>
    </span>
  );
}

function EditorLeccion({
  leccion,
  onGuardar,
}: {
  leccion: Leccion;
  onGuardar: (cambios: Partial<Leccion>) => Promise<void>;
}) {
  const [f, setF] = useState({
    title: leccion.title,
    type: leccion.type,
    description: leccion.description ?? "",
    videoUrl: leccion.videoUrl ?? "",
    contentMarkdown: leccion.contentMarkdown ?? "",
    minutos: Math.round(leccion.durationSeconds / 60).toString(),
    freePreview: leccion.freePreview,
  });
  const [guardando, setGuardando] = useState(false);

  return (
    <form
      className={s.editor}
      onSubmit={async (e) => {
        e.preventDefault();
        setGuardando(true);
        await onGuardar({
          title: f.title,
          type: f.type,
          description: f.description,
          videoUrl: f.videoUrl,
          contentMarkdown: f.contentMarkdown,
          durationSeconds: Math.round(parseFloat(f.minutos || "0") * 60),
          freePreview: f.freePreview,
        });
        setGuardando(false);
      }}
    >
      <div className={s.fila}>
        <label className={s.campo}>
          <span>Título</span>
          <input
            className={s.input}
            value={f.title}
            onChange={(e) => setF({ ...f, title: e.target.value })}
            required
          />
        </label>
        <label className={s.campo}>
          <span>Tipo</span>
          <select
            className={s.input}
            value={f.type}
            onChange={(e) => setF({ ...f, type: e.target.value as Leccion["type"] })}
          >
            {Object.entries(TIPOS).map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className={s.campo}>
        <span>Descripción</span>
        <input
          className={s.input}
          value={f.description}
          onChange={(e) => setF({ ...f, description: e.target.value })}
        />
      </label>
      {(f.type === "video" || f.type === "live_replay") && (
        <div className={s.fila}>
          <label className={s.campo}>
            <span>URL del video</span>
            <input
              className={s.input}
              type="url"
              value={f.videoUrl}
              onChange={(e) => setF({ ...f, videoUrl: e.target.value })}
              placeholder="https://..."
            />
          </label>
          <label className={s.campo}>
            <span>Duración (minutos)</span>
            <input
              className={s.input}
              type="number"
              min="0"
              step="0.5"
              value={f.minutos}
              onChange={(e) => setF({ ...f, minutos: e.target.value })}
            />
          </label>
        </div>
      )}
      {f.type === "reading" && (
        <label className={s.campo}>
          <span>Contenido (Markdown)</span>
          <textarea
            className={s.input}
            rows={8}
            value={f.contentMarkdown}
            onChange={(e) => setF({ ...f, contentMarkdown: e.target.value })}
          />
        </label>
      )}
      {f.type === "quiz" && (
        <p className={s.muted}>Las preguntas del quiz todavía no se editan desde el panel.</p>
      )}
      <label className={s.check}>
        <input
          type="checkbox"
          checked={f.freePreview}
          onChange={(e) => setF({ ...f, freePreview: e.target.checked })}
        />
        Visible sin comprar (vista previa)
      </label>
      <div className={s.pie}>
        <button type="submit" className="btn btn-primary btn-sm" disabled={guardando}>
          {guardando ? "Guardando..." : "Guardar lección"}
        </button>
      </div>
    </form>
  );
}
