import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { createSessionToken, getSessionUser, setSessionCookie } from "@/lib/auth";
import { activateEnrollment } from "@/lib/course-access";
import { getCourseBySlug } from "@/lib/courses";

/** Registro de alumnos para acceder a cursos. */
export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string; nombre?: string };
  if (!body.email?.trim() || !body.password || !body.nombre?.trim()) {
    return NextResponse.json({ error: "Nombre, correo y contraseña requeridos" }, { status: 400 });
  }
  if (body.password.length < 8) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 });
  }

  const db = getDb();
  const email = body.email.toLowerCase().trim();
  const [exists] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (exists) {
    return NextResponse.json({ error: "Ya existe una cuenta con ese correo" }, { status: 409 });
  }

  const now = new Date().toISOString();
  const hash = await bcrypt.hash(body.password, 10);
  const id = crypto.randomUUID();

  await db.insert(schema.users).values({
    id,
    email,
    nombre: body.nombre.trim(),
    passwordHash: hash,
    rol: "alumno",
    createdAt: now,
  });

  const token = await createSessionToken({
    id,
    email,
    nombre: body.nombre.trim(),
    rol: "alumno",
  });
  await setSessionCookie(token);

  return NextResponse.json({ ok: true });
}

/** Inscripción manual en desarrollo (sin Stripe). */
export async function PUT(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "No disponible" }, { status: 403 });
  }

  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = (await request.json()) as { courseSlug?: string };
  if (!body.courseSlug) return NextResponse.json({ error: "Curso requerido" }, { status: 400 });

  const row = await getCourseBySlug(body.courseSlug);
  if (!row) return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });

  await activateEnrollment({
    userId: user.id,
    courseId: row.course.id,
    stripeSessionId: `dev_${crypto.randomUUID()}`,
  });

  return NextResponse.json({ ok: true });
}
