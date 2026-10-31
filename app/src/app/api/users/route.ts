import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/index";
import { users } from "@/db/schema";
import { logAudit, requireUser } from "@/lib/auth";
import { ROLES, type Rol } from "@/lib/auth-rutas";

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

/**
 * Da de alta una cuenta con su rol ya asignado.
 *
 * No lleva contraseña: la persona entra con "Entrar con mi correo" (Privy) y,
 * al coincidir el correo, la cuenta se vincula conservando el rol dado aquí.
 */
export async function POST(request: Request) {
  let actor;
  try {
    actor = await requireUser(["admin"]);
  } catch {
    return NextResponse.json({ error: "Solo un administrador puede dar de alta usuarios" }, { status: 403 });
  }

  const body = (await request.json()) as { email?: string; nombre?: string; rol?: string };
  const email = body.email?.trim().toLowerCase() ?? "";
  const nombre = body.nombre?.trim() ?? "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Correo inválido" }, { status: 400 });
  }
  if (!nombre) {
    return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
  }
  if (!body.rol || !ROLES.includes(body.rol as Rol)) {
    return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
  }

  try {
    const db = getDb();
    const [existe] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existe) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con ese correo; cámbiale el rol desde su perfil.", id: existe.id },
        { status: 409 },
      );
    }

    const nuevo = {
      id: `usr-${Date.now().toString(36)}`,
      email,
      nombre,
      passwordHash: "",
      rol: body.rol as Rol,
      emailVerified: false,
      createdAt: new Date().toISOString(),
    };
    await db.insert(users).values(nuevo);
    await logAudit(actor.id, "create", "user", nuevo.id, { email, rol: nuevo.rol });

    return NextResponse.json(
      { user: { id: nuevo.id, email, nombre, rol: nuevo.rol, emailVerified: false, createdAt: nuevo.createdAt } },
      { status: 201 },
    );
  } catch (error) {
    console.error("[api/users] POST", error);
    return NextResponse.json({ error: "Error al crear el usuario" }, { status: 500 });
  }
}
