import { NextResponse } from "next/server";
import { count, eq } from "drizzle-orm";
import { getDb } from "@/db/index";
import { courseCategories, courses } from "@/db/schema";
import { logAudit, requireUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  let actor;
  try {
    actor = await requireUser(["admin", "psicologo"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as {
    name?: string;
    description?: string;
    sortOrder?: number;
  };

  const cambios: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) cambios.name = body.name.trim();
  if (typeof body.description === "string") cambios.description = body.description.trim() || null;
  if (Number.isFinite(body.sortOrder)) cambios.sortOrder = Number(body.sortOrder);

  if (Object.keys(cambios).length === 0) {
    return NextResponse.json({ error: "No hay cambios que guardar" }, { status: 400 });
  }

  try {
    const db = getDb();
    await db.update(courseCategories).set(cambios).where(eq(courseCategories.id, id));
    await logAudit(actor.id, "update", "course_category", id, cambios);
    const [actualizada] = await db
      .select()
      .from(courseCategories)
      .where(eq(courseCategories.id, id))
      .limit(1);
    if (!actualizada) return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
    return NextResponse.json({ category: actualizada });
  } catch (error) {
    console.error("[api/course-categories/:id] PATCH", error);
    return NextResponse.json({ error: "Error al actualizar la categoría" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  let actor;
  try {
    actor = await requireUser(["admin"]);
  } catch {
    return NextResponse.json({ error: "Solo un administrador puede eliminar" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const db = getDb();
    // No dejar cursos huérfanos
    const [{ total }] = await db
      .select({ total: count() })
      .from(courses)
      .where(eq(courses.categoryId, id));
    if (Number(total) > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar: ${total} curso${Number(total) === 1 ? "" : "s"} usa${
            Number(total) === 1 ? "" : "n"
          } esta categoría. Muévelos primero.`,
        },
        { status: 409 },
      );
    }

    await db.delete(courseCategories).where(eq(courseCategories.id, id));
    await logAudit(actor.id, "delete", "course_category", id, null);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/course-categories/:id] DELETE", error);
    return NextResponse.json({ error: "Error al eliminar la categoría" }, { status: 500 });
  }
}
