import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { liveClasses } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
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

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();

    await db.update(liveClasses).set(body).where(eq(liveClasses.id, params.id));

    const [liveClass] = await db.select().from(liveClasses).where(eq(liveClasses.id, params.id));

    return NextResponse.json({ liveClass });
  } catch (error) {
    console.error("Error updating live class:", error);
    return NextResponse.json({ error: "Error al actualizar clase" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await db.delete(liveClasses).where(eq(liveClasses.id, params.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting live class:", error);
    return NextResponse.json({ error: "Error al eliminar clase" }, { status: 500 });
  }
}
