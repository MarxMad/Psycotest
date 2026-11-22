import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { pdfDeSesion } from "@/lib/informe-sesion";
import { sesionEsDelCliente } from "@/lib/panel-empresa";

type Params = { params: Promise<{ id: string }> };

/**
 * El informe en PDF para la empresa que compró el código. Si ya lo firmó un
 * psicólogo sale la versión firmada; si no, la preliminar.
 */
export async function GET(_request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });

  const { id } = await params;
  const ses = await sesionEsDelCliente(id, user.id);
  if (!ses) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  const pdf = await pdfDeSesion(ses);
  if (!pdf) return NextResponse.json({ error: "El informe todavía no está listo." }, { status: 404 });

  return new NextResponse(new Uint8Array(pdf.contenido), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${pdf.nombre}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
