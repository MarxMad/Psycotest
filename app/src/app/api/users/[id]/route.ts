import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db/index";
import { courses, enrollments, orders, users } from "@/db/schema";
import { logAudit, requireUser } from "@/lib/auth";
import { ROLES, type Rol } from "@/lib/auth-rutas";

type Params = { params: Promise<{ id: string }> };

/** Perfil para el panel: la cuenta, sus cursos y sus pedidos. Nunca el hash. */
export async function GET(_request: Request, { params }: Params) {
  try {
    await requireUser(["admin"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const db = getDb();
    const [u] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!u) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    const [cursos, pedidos] = await Promise.all([
      db
        .select({
          id: enrollments.id,
          status: enrollments.status,
          progressPercent: enrollments.progressPercent,
          createdAt: enrollments.createdAt,
          courseId: courses.id,
          courseTitle: courses.title,
        })
        .from(enrollments)
        .innerJoin(courses, eq(enrollments.courseId, courses.id))
        .where(eq(enrollments.userId, id))
        .orderBy(desc(enrollments.createdAt)),
      db
        .select({
          id: orders.id,
          total: orders.total,
          status: orders.status,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .where(eq(orders.userId, id))
        .orderBy(desc(orders.createdAt)),
    ]);

    return NextResponse.json({
      user: {
        id: u.id,
        email: u.email,
        nombre: u.nombre,
        rol: u.rol,
        emailVerified: u.emailVerified,
        createdAt: u.createdAt,
        // Cómo entra: con Privy, con contraseña local, o aún no ha entrado.
        acceso: u.privyId ? "correo" : u.passwordHash ? "contrasena" : "pendiente",
      },
      cursos,
      pedidos,
    });
  } catch (error) {
    console.error("[api/users/:id] GET", error);
    return NextResponse.json({ error: "Error al cargar el usuario" }, { status: 500 });
  }
}

/** Cambia el rol y/o el nombre de un usuario. Solo un admin puede hacerlo. */
export async function PATCH(request: Request, { params }: Params) {
  let actor;
  try {
    actor = await requireUser(["admin"]);
  } catch {
    return NextResponse.json({ error: "Solo un administrador puede cambiar roles" }, { status: 403 });
  }

  const { id } = await params;
  const body = (await request.json()) as { rol?: string; nombre?: string };
  const nombre = typeof body.nombre === "string" ? body.nombre.trim() : undefined;

  if (nombre === "") {
    return NextResponse.json({ error: "El nombre no puede quedar vacío" }, { status: 400 });
  }
  if (body.rol === undefined && nombre === undefined) {
    return NextResponse.json({ error: "Nada que cambiar" }, { status: 400 });
  }
  if (body.rol !== undefined && !ROLES.includes(body.rol as Rol)) {
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

    const rol = (body.rol ?? objetivo.rol) as Rol;

    // No dejar el sistema sin ningún administrador
    if (objetivo.rol === "admin" && rol !== "admin") {
      const admins = await db.select({ id: users.id }).from(users).where(eq(users.rol, "admin"));
      if (admins.length <= 1) {
        return NextResponse.json(
          { error: "No puedes quitar el último administrador: el panel quedaría sin acceso." },
          { status: 409 },
        );
      }
    }

    await db
      .update(users)
      .set({ rol, ...(nombre ? { nombre } : {}) })
      .where(eq(users.id, id));
    await logAudit(actor.id, "update", "user", id, { rol, anterior: objetivo.rol, nombre });

    return NextResponse.json({
      user: { id: objetivo.id, email: objetivo.email, nombre: nombre ?? objetivo.nombre, rol },
    });
  } catch (error) {
    console.error("[api/users/:id]", error);
    return NextResponse.json({ error: "Error al actualizar el usuario" }, { status: 500 });
  }
}
