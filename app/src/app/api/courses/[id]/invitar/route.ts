import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { invitarACurso, leerCorreos } from "@/lib/invitaciones";

/** Inscribe a una lista de correos en el curso y les manda la invitación. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let admin;
  try {
    admin = await requireUser(["admin"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { correos?: string; mensaje?: string };

  try {
    const r = await invitarACurso({
      courseId: id,
      correos: leerCorreos(body.correos ?? ""),
      mensaje: body.mensaje,
      invitadoPor: { id: admin.id, nombre: admin.nombre },
    });
    return r.ok
      ? NextResponse.json({ resultados: r.resultados })
      : NextResponse.json({ error: r.error }, { status: r.status });
  } catch (error) {
    console.error("[api/courses/:id/invitar]", error);
    return NextResponse.json({ error: "No se pudo completar la invitación" }, { status: 500 });
  }
}
