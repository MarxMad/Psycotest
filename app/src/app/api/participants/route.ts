import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getSessionUser, logAudit, requireUser } from "@/lib/auth";

export async function GET() {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const db = getDb();
  const rows = await db.select().from(schema.participants).orderBy(desc(schema.participants.updatedAt));
  return NextResponse.json({ participants: rows });
}

export async function POST(request: Request) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json()) as {
    nombre: string;
    edad?: string;
    sexo?: string;
    estadoCivil?: string;
    estudios?: string;
    ocupacion?: string;
    empresa?: string;
    notas?: string;
  };

  if (!body.nombre?.trim()) {
    return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const id = `part-${Date.now().toString(36)}`;
  const db = getDb();

  await db.insert(schema.participants).values({
    id,
    nombre: body.nombre.trim(),
    edad: body.edad ?? null,
    sexo: body.sexo ?? null,
    estadoCivil: body.estadoCivil ?? null,
    estudios: body.estudios ?? null,
    ocupacion: body.ocupacion ?? null,
    empresa: body.empresa ?? null,
    notas: body.notas ?? null,
    createdAt: now,
    updatedAt: now,
  });

  await logAudit(user.id, "create", "participant", id, { nombre: body.nombre });
  const [created] = await db.select().from(schema.participants).where(eq(schema.participants.id, id)).limit(1);
  return NextResponse.json({ participant: created ?? { id, ...body } }, { status: 201 });
}
