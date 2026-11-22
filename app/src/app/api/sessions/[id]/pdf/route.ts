import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getSession } from "@/lib/session-store";
import { pdfDeSesion } from "@/lib/informe-sesion";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireUser(["admin", "psicologo"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const row = await getSession(id);
  if (!row) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  if (!row.aprobada) {
    return NextResponse.json(
      { error: "El informe debe estar validado antes de exportar" },
      { status: 403 },
    );
  }
  if (!row.interpretacion) {
    return NextResponse.json({ error: "Sin interpretación" }, { status: 400 });
  }

  const pdf = await pdfDeSesion(row);
  if (!pdf) return NextResponse.json({ error: "Sin interpretación" }, { status: 400 });

  return new NextResponse(new Uint8Array(pdf.contenido), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${pdf.nombre}"`,
    },
  });
}
