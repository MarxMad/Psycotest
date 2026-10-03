import { NextResponse } from "next/server";
import { asc, count, eq } from "drizzle-orm";
import { getDb } from "@/db/index";
import { courseCategories, courses } from "@/db/schema";
import { logAudit, requireUser } from "@/lib/auth";

/** Convierte un nombre a slug: "Psicología Organizacional" → "psicologia-organizacional" */
function aSlug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function GET() {
  try {
    const db = getDb();
    const filas = await db
      .select({
        id: courseCategories.id,
        slug: courseCategories.slug,
        name: courseCategories.name,
        description: courseCategories.description,
        sortOrder: courseCategories.sortOrder,
      })
      .from(courseCategories)
      .orderBy(asc(courseCategories.sortOrder), asc(courseCategories.name));

    // Cuántos cursos cuelgan de cada categoría
    const conteos = await db
      .select({ categoryId: courses.categoryId, total: count() })
      .from(courses)
      .groupBy(courses.categoryId);
    const porCategoria = new Map(conteos.map((c) => [c.categoryId, Number(c.total)]));

    return NextResponse.json({
      categories: filas.map((c) => ({ ...c, cursos: porCategoria.get(c.id) ?? 0 })),
    });
  } catch (error) {
    console.error("[api/course-categories] GET", error);
    return NextResponse.json({ error: "Error al cargar las categorías" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let actor;
  try {
    actor = await requireUser(["admin", "psicologo"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json()) as {
    name?: string;
    description?: string;
    sortOrder?: number;
  };

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
  }

  const slug = aSlug(name);
  if (!slug) {
    return NextResponse.json(
      { error: "El nombre debe incluir al menos una letra o número" },
      { status: 400 },
    );
  }

  try {
    const db = getDb();
    const [existente] = await db
      .select({ id: courseCategories.id })
      .from(courseCategories)
      .where(eq(courseCategories.slug, slug))
      .limit(1);
    if (existente) {
      return NextResponse.json({ error: `Ya existe una categoría "${name}"` }, { status: 409 });
    }

    const id = `cat-${slug}-${Date.now().toString(36)}`;
    const fila = {
      id,
      slug,
      name,
      description: body.description?.trim() || null,
      sortOrder: Number.isFinite(body.sortOrder) ? Number(body.sortOrder) : 0,
    };
    await db.insert(courseCategories).values(fila);
    await logAudit(actor.id, "create", "course_category", id, { name });

    return NextResponse.json({ category: { ...fila, cursos: 0 } }, { status: 201 });
  } catch (error) {
    console.error("[api/course-categories] POST", error);
    return NextResponse.json({ error: "Error al crear la categoría" }, { status: 500 });
  }
}
