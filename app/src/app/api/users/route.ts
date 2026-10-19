import { NextResponse } from "next/server";
import { getDb } from "@/db/index";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export async function GET() {
  try {
    await requireUser(["admin"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const db = getDb();
    const allUsers = await db.select().from(users);

    const sanitizedUsers = allUsers.map((user) => ({
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    }));

    return NextResponse.json({ users: sanitizedUsers });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Error al cargar usuarios" }, { status: 500 });
  }
}
