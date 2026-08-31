import { NextResponse } from "next/server";
import { getDb } from "@/db/index";
import { liveClasses } from "@/db/schema";
import { eq } from "drizzle-orm";

const db = getDb();

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const [liveClass] = await db.select().from(liveClasses).where(eq(liveClasses.id, params.id));

    if (!liveClass) {
      return NextResponse.json({ error: "Clase no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ liveClass });
  } catch (error) {
    console.error("Error fetching live class:", error);
    return NextResponse.json({ error: "Error al cargar clase" }, { status: 500 });
  }
}

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const body = await request.json();

    await db.update(liveClasses).set(body).where(eq(liveClasses.id, params.id));

    const [liveClass] = await db.select().from(liveClasses).where(eq(liveClasses.id, params.id));

    return NextResponse.json({ liveClass });
  } catch (error) {
    console.error("Error updating live class:", error);
    return NextResponse.json({ error: "Error al actualizar clase" }, { status: 500 });
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    await db.delete(liveClasses).where(eq(liveClasses.id, params.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting live class:", error);
    return NextResponse.json({ error: "Error al eliminar clase" }, { status: 500 });
  }
}
