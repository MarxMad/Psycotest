import { NextResponse } from "next/server";
import { getDb } from "@/db/index";
import { courses } from "@/db/schema";
import { eq } from "drizzle-orm";

const db = getDb();

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
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
  try {
    const params = await props.params;
    const body = await request.json();
    const now = new Date().toISOString();

    await db
      .update(courses)
      .set({ ...body, updatedAt: now })
      .where(eq(courses.id, params.id));

    const [course] = await db.select().from(courses).where(eq(courses.id, params.id));

    return NextResponse.json({ course });
  } catch (error) {
    console.error("Error updating course:", error);
    return NextResponse.json({ error: "Error al actualizar curso" }, { status: 500 });
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    await db.delete(courses).where(eq(courses.id, params.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json({ error: "Error al eliminar curso" }, { status: 500 });
  }
}
