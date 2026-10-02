import { NextResponse } from "next/server";
import { getDb } from "@/db/index";
import { users } from "@/db/schema";

export async function GET() {
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
