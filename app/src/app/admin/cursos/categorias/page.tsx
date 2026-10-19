"use client";

import { useCallback, useEffect, useState } from "react";
import { FolderTree, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card, CardHeader } from "@/components/admin/Card";
import { Badge, DataTable, type Columna } from "@/components/admin/DataTable";
import s from "./categorias.module.css";

type Categoria = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
  cursos: number;
};

export default function CategoriasPage() {
  const [cats, setCats] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [creando, setCreando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const r = await fetch("/api/course-categories");
      if (!r.ok) throw new Error("No se pudieron cargar las categorías");
      const d = await r.json();
      setCats(d.categories ?? []);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return;
    setCreando(true);
    setError(null);
    setAviso(null);
    try {
      const r = await fetch("/api/course-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nombre, description: descripcion, sortOrder: cats.length }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "No se pudo crear la categoría");
      setCats((prev) => [...prev, d.category]);
      setNombre("");
      setDescripcion("");
      setAviso(`Categoría "${d.category.name}" creada.`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCreando(false);
    }
  }

  async function renombrar(c: Categoria, name: string) {
    if (!name.trim() || name === c.name) return;
    setError(null);
    try {
      const r = await fetch(`/api/course-categories/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "No se pudo actualizar");
      setCats((prev) => prev.map((x) => (x.id === c.id ? { ...x, name } : x)));
      setAviso("Categoría actualizada.");
    } catch (e) {
      setError((e as Error).message);
      void cargar();
    }
  }

  async function eliminar(c: Categoria) {
    setError(null);
    setAviso(null);
    try {
      const r = await fetch(`/api/course-categories/${c.id}`, { method: "DELETE" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "No se pudo eliminar");
      setCats((prev) => prev.filter((x) => x.id !== c.id));
      setAviso(`Categoría "${c.name}" eliminada.`);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const columnas: Columna<Categoria>[] = [
    {
      header: "Nombre",
      cell: (c) => (
        <input
          className={s.inlineInput}
          defaultValue={c.name}
          onBlur={(e) => renombrar(c, e.target.value)}
          aria-label={`Nombre de ${c.name}`}
        />
      ),
    },
    {
      header: "Identificador",
      cell: (c) => <code className={s.code}>{c.slug}</code>,
    },
    {
      header: "Cursos",
      cell: (c) =>
        c.cursos > 0 ? <Badge tone="info">{c.cursos}</Badge> : <span className={s.sub}>0</span>,
      align: "center",
    },
    {
      header: "",
      cell: (c) => (
        <button
          type="button"
          className={s.borrar}
          onClick={() => eliminar(c)}
          disabled={c.cursos > 0}
          title={
            c.cursos > 0
              ? "Mueve primero los cursos de esta categoría"
              : `Eliminar ${c.name}`
          }
          aria-label={`Eliminar ${c.name}`}
        >
          <Trash2 size={15} aria-hidden />
        </button>
      ),
      align: "end",
    },
  ];

  return (
    <div className={s.container}>
      <PageHeader
        title="Categorías de cursos"
        subtitle="Agrupa el catálogo por escuela o área de conocimiento"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Cursos", href: "/admin/cursos" },
          { label: "Categorías" },
        ]}
      />

      {error && <div className={s.error}>{error}</div>}
      {aviso && <div className={s.aviso}>{aviso}</div>}

      <Card>
        <CardHeader title="Nueva categoría" subtitle="El identificador se genera solo a partir del nombre" />
        <form className={s.form} onSubmit={crear}>
          <label className={s.campo}>
            <span>Nombre</span>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Psicología organizacional"
              required
            />
          </label>
          <label className={s.campo}>
            <span>Descripción (opcional)</span>
            <input
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Cursos de evaluación, clima y desarrollo"
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={creando || !nombre.trim()}>
            <Plus size={16} />
            {creando ? "Creando…" : "Crear categoría"}
          </button>
        </form>
      </Card>

      <Card padding="none">
        {loading ? (
          <p className={s.cargando}>Cargando categorías…</p>
        ) : (
          <DataTable
            columns={columnas}
            rows={cats}
            rowKey={(c) => c.id}
            empty={
              <span>
                <FolderTree size={18} aria-hidden /> Aún no hay categorías. Crea la primera arriba.
              </span>
            }
          />
        )}
      </Card>
    </div>
  );
}
