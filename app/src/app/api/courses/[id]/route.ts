import { NextResponse } from "next/server";
import { getDb } from "@/db/index";
import { courses } from "@/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { logAudit, requireUser } from "@/lib/auth";

/** Lo único que el panel puede cambiar de un curso; id, ventas y fechas no se tocan desde fuera. */
const EDITABLES = [
  "title",
  "slug",
  "subtitle",
  "description",
  "categoryId",
  "priceMxn",
  "thumbnailUrl",
  "instructorName",
  "instructorBio",
  "level",
  "modalidad",
  "estandarClave",
  "durationMinutes",
  "status",
  "inventoryLimit",
  "sortOrder",
  "requireQuizPass",
] as const;

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const db = getDb();
    const params = await props.params;
    const [course] = await db.select().from(courses).where(eq(courses.id, params.id));

    if (!course) {
      return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ course });
  } catch (error) {
    console.error("Error fetching course:", error);
    return NextResponse.json({ error: "Error al cargar curso" }, { status: 500 });
  }
}

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  let actor;
  try {
    actor = await requireUser(["admin", "psicologo"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const db = getDb();
    const params = await props.params;
    const body = (await request.json()) as Record<string, unknown>;
    const cambios: Record<string, unknown> = {};
    for (const campo of EDITABLES) {
      if (campo in body) cambios[campo] = body[campo];
    }

    if ("title" in cambios && !String(cambios.title ?? "").trim()) {
      return NextResponse.json({ error: "El título no puede quedar vacío" }, { status: 400 });
    }
    if ("slug" in cambios) {
      const slug = String(cambios.slug ?? "").trim();
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        return NextResponse.json(
          { error: "El slug solo admite minúsculas, números y guiones" },
          { status: 400 },
        );
      }
      const [otro] = await db
        .select({ id: courses.id })
        .from(courses)
        .where(and(eq(courses.slug, slug), ne(courses.id, params.id)))
        .limit(1);
      if (otro) {
        return NextResponse.json({ error: "Ya hay otro curso con ese slug" }, { status: 409 });
      }
      cambios.slug = slug;
    }
    if ("priceMxn" in cambios) {
      const precio = Number(cambios.priceMxn);
      if (!Number.isInteger(precio) || precio < 0) {
        return NextResponse.json({ error: "Precio inválido" }, { status: 400 });
      }
    }
    // El catálogo lee `published` y el cobro lee `status`: se mueven juntos.
    if ("status" in cambios) cambios.published = cambios.status === "published";

    await db
      .update(courses)
      .set({ ...cambios, updatedAt: new Date().toISOString() })
      .where(eq(courses.id, params.id));
    await logAudit(actor.id, "update", "course", params.id, cambios);

    const [course] = await db.select().from(courses).where(eq(courses.id, params.id));

    return NextResponse.json({ course });
  } catch (error) {
    console.error("Error updating course:", error);
    return NextResponse.json({ error: "Error al actualizar curso" }, { status: 500 });
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    await requireUser(["admin", "psicologo"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const db = getDb();
    const params = await props.params;
    await db.delete(courses).where(eq(courses.id, params.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json({ error: "Error al eliminar curso" }, { status: 500 });
  }
}
