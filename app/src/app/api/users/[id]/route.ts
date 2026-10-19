import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/index";
import { users } from "@/db/schema";
import { logAudit, requireUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

const ROLES = ["admin", "psicologo", "aplicador"] as const;
type Rol = (typeof ROLES)[number];

/** Cambia el rol de un usuario. Solo un admin puede hacerlo. */
export async function PATCH(request: Request, { params }: Params) {
  let actor;
  try {
    actor = await requireUser(["admin"]);
  } catch {
    return NextResponse.json({ error: "Solo un administrador puede cambiar roles" }, { status: 403 });
  }

  const { id } = await params;
  const body = (await request.json()) as { rol?: string };

  if (!body.rol || !ROLES.includes(body.rol as Rol)) {
    return NextResponse.json(
      { error: `Rol inválido. Valores permitidos: ${ROLES.join(", ")}` },
      { status: 400 },
    );
  }

  try {
    const db = getDb();
    const [objetivo] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!objetivo) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // No dejar el sistema sin ningún administrador
    if (objetivo.rol === "admin" && body.rol !== "admin") {
      const admins = await db.select({ id: users.id }).from(users).where(eq(users.rol, "admin"));
      if (admins.length <= 1) {
        return NextResponse.json(
          { error: "No puedes quitar el último administrador: el panel quedaría sin acceso." },
          { status: 409 },
        );
      }
    }

    await db.update(users).set({ rol: body.rol as Rol }).where(eq(users.id, id));
    await logAudit(actor.id, "update", "user", id, { rol: body.rol, anterior: objetivo.rol });

    return NextResponse.json({
      user: { id: objetivo.id, email: objetivo.email, nombre: objetivo.nombre, rol: body.rol },
    });
  } catch (error) {
    console.error("[api/users/:id]", error);
    return NextResponse.json({ error: "Error al actualizar el usuario" }, { status: 500 });
  }
}
