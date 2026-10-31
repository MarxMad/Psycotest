import { NextResponse } from "next/server";
import { and, eq, max } from "drizzle-orm";
import { getDb } from "@/db/index";
import { courseLessons, courseModules } from "@/db/schema";
import { logAudit, requireUser } from "@/lib/auth";
import { getCourseCurriculum } from "@/lib/courses";

/*
 * Temario de un curso para el panel: módulos y sus lecciones.
 *
 * Un solo recurso con `tipo` ("modulo" | "leccion") en vez de cuatro rutas:
 * todo cuelga del curso y cada operación comprueba que el elemento le pertenece.
 */

type Params = { params: Promise<{ id: string }> };
type Tipo = "modulo" | "leccion";

const TIPOS_LECCION = ["video", "quiz", "live_replay", "reading"] as const;

function aSlug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function staff() {
  try {
    return await requireUser(["admin", "psicologo"]);
  } catch {
    return null;
  }
}

/** El módulo existe y es de este curso. */
async function moduloDelCurso(courseId: string, moduloId: string) {
  const [m] = await getDb()
    .select()
    .from(courseModules)
    .where(and(eq(courseModules.id, moduloId), eq(courseModules.courseId, courseId)))
    .limit(1);
  return m ?? null;
}

/** La lección existe y su módulo es de este curso. */
async function leccionDelCurso(courseId: string, leccionId: string) {
  const [fila] = await getDb()
    .select({ leccion: courseLessons })
    .from(courseLessons)
    .innerJoin(courseModules, eq(courseLessons.moduleId, courseModules.id))
    .where(and(eq(courseLessons.id, leccionId), eq(courseModules.courseId, courseId)))
    .limit(1);
  return fila?.leccion ?? null;
}

/** Solo los campos de lección que el panel puede escribir, ya limpios. */
function camposLeccion(body: Record<string, unknown>) {
  const c: Partial<typeof courseLessons.$inferInsert> = {};
  if (typeof body.title === "string") c.title = body.title.trim();
  if (typeof body.description === "string") c.description = body.description.trim() || null;
  if (typeof body.type === "string" && (TIPOS_LECCION as readonly string[]).includes(body.type)) {
    c.type = body.type as (typeof TIPOS_LECCION)[number];
  }
  if (typeof body.videoUrl === "string") c.videoUrl = body.videoUrl.trim() || null;
  if (typeof body.contentMarkdown === "string") c.contentMarkdown = body.contentMarkdown || null;
  if (body.durationSeconds !== undefined) c.durationSeconds = Math.max(0, Math.round(Number(body.durationSeconds) || 0));
  if (typeof body.freePreview === "boolean") c.freePreview = body.freePreview;
  if (body.sortOrder !== undefined) c.sortOrder = Math.round(Number(body.sortOrder) || 0);
  return c;
}

export async function GET(_request: Request, { params }: Params) {
  if (!(await staff())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  try {
    return NextResponse.json({ temario: await getCourseCurriculum(id) });
  } catch (error) {
    console.error("[api/courses/:id/temario] GET", error);
    return NextResponse.json({ error: "Error al cargar el temario" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: Params) {
  const actor = await staff();
  if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown> & { tipo?: Tipo };
  const titulo = typeof body.title === "string" ? body.title.trim() : "";
  if (!titulo) return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });

  try {
    const db = getDb();

    if (body.tipo === "modulo") {
      const [{ ultimo }] = await db
        .select({ ultimo: max(courseModules.sortOrder) })
        .from(courseModules)
        .where(eq(courseModules.courseId, id));
      const modulo = {
        id: `mod_${Date.now()}`,
        courseId: id,
        title: titulo,
        sortOrder: (ultimo ?? -1) + 1,
      };
      await db.insert(courseModules).values(modulo);
      await logAudit(actor.id, "create", "course_module", modulo.id, { courseId: id });
      return NextResponse.json({ modulo }, { status: 201 });
    }

    if (body.tipo === "leccion") {
      const moduloId = String(body.moduleId ?? "");
      if (!(await moduloDelCurso(id, moduloId))) {
        return NextResponse.json({ error: "Módulo no encontrado" }, { status: 404 });
      }
      const [{ ultimo }] = await db
        .select({ ultimo: max(courseLessons.sortOrder) })
        .from(courseLessons)
        .where(eq(courseLessons.moduleId, moduloId));
      const leccionId = `les_${Date.now()}`;
      const leccion = {
        type: "video" as const,
        durationSeconds: 0,
        freePreview: false,
        ...camposLeccion(body),
        id: leccionId,
        moduleId: moduloId,
        // El sufijo evita choques cuando dos lecciones se llaman igual.
        slug: `${aSlug(titulo) || "leccion"}-${leccionId.slice(-5)}`,
        title: titulo,
        sortOrder: (ultimo ?? -1) + 1,
      };
      await db.insert(courseLessons).values(leccion);
      await logAudit(actor.id, "create", "course_lesson", leccionId, { courseId: id });
      return NextResponse.json({ leccion }, { status: 201 });
    }

    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  } catch (error) {
    console.error("[api/courses/:id/temario] POST", error);
    return NextResponse.json({ error: "Error al guardar el temario" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const actor = await staff();
  if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown> & { tipo?: Tipo; itemId?: string };
  const itemId = String(body.itemId ?? "");

  try {
    const db = getDb();

    if (body.tipo === "modulo") {
      if (!(await moduloDelCurso(id, itemId))) {
        return NextResponse.json({ error: "Módulo no encontrado" }, { status: 404 });
      }
      const cambios: Partial<typeof courseModules.$inferInsert> = {};
      if (typeof body.title === "string" && body.title.trim()) cambios.title = body.title.trim();
      if (body.sortOrder !== undefined) cambios.sortOrder = Math.round(Number(body.sortOrder) || 0);
      if (Object.keys(cambios).length) {
        await db.update(courseModules).set(cambios).where(eq(courseModules.id, itemId));
      }
      await logAudit(actor.id, "update", "course_module", itemId, cambios);
      return NextResponse.json({ ok: true });
    }

    if (body.tipo === "leccion") {
      if (!(await leccionDelCurso(id, itemId))) {
        return NextResponse.json({ error: "Lección no encontrada" }, { status: 404 });
      }
      const cambios = camposLeccion(body);
      if (cambios.title === "") {
        return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });
      }
      if (Object.keys(cambios).length) {
        await db.update(courseLessons).set(cambios).where(eq(courseLessons.id, itemId));
      }
      await logAudit(actor.id, "update", "course_lesson", itemId, cambios);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  } catch (error) {
    console.error("[api/courses/:id/temario] PATCH", error);
    return NextResponse.json({ error: "Error al guardar el temario" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const actor = await staff();
  if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get("tipo");
  const itemId = searchParams.get("itemId") ?? "";

  try {
    const db = getDb();
    if (tipo === "modulo" && (await moduloDelCurso(id, itemId))) {
      // Las lecciones del módulo (y su progreso) caen en cascada.
      await db.delete(courseModules).where(eq(courseModules.id, itemId));
    } else if (tipo === "leccion" && (await leccionDelCurso(id, itemId))) {
      await db.delete(courseLessons).where(eq(courseLessons.id, itemId));
    } else {
      return NextResponse.json({ error: "Elemento no encontrado" }, { status: 404 });
    }
    await logAudit(actor.id, "delete", tipo === "modulo" ? "course_module" : "course_lesson", itemId, {
      courseId: id,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/courses/:id/temario] DELETE", error);
    return NextResponse.json(
      { error: "No se pudo borrar: puede tener avances o quizzes ligados" },
      { status: 500 },
    );
  }
}
