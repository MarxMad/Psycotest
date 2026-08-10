import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requireUser } from "@/lib/auth";
import { getSession } from "@/lib/session-store";
import { InformePdfDocument } from "@/lib/informe-pdf";

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

  const buffer = await renderToBuffer(
    InformePdfDocument({
      data: {
        instrumento: row.instrumento,
        participante: row.participantNombre,
        puesto: row.puesto,
        empresa: row.empresa,
        iniciada: row.iniciada,
        interpretacion: row.interpretacion,
        notasPsicologo: row.notasPsicologo,
      },
    }),
  );

  const slug = row.participantNombre.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");
  const filename = `informe-${row.instrumento}-${slug || id}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
