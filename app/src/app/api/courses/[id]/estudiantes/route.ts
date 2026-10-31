import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db/index";
import { enrollments, users } from "@/db/schema";
import { requireStaff } from "@/lib/auth";

/** Inscritos de un curso con su nombre y correo, los más recientes primero. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireStaff();
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const filas = await getDb()
      .select({
        id: enrollments.id,
        status: enrollments.status,
        progressPercent: enrollments.progressPercent,
        enrolledAt: enrollments.enrolledAt,
        completedAt: enrollments.completedAt,
        createdAt: enrollments.createdAt,
        userId: users.id,
        nombre: users.nombre,
        email: users.email,
      })
      .from(enrollments)
      .innerJoin(users, eq(enrollments.userId, users.id))
      .where(eq(enrollments.courseId, id))
      .orderBy(desc(enrollments.createdAt));

    return NextResponse.json({ estudiantes: filas });
  } catch (error) {
    console.error("[api/courses/:id/estudiantes]", error);
    return NextResponse.json({ error: "Error al cargar estudiantes" }, { status: 500 });
  }
}
