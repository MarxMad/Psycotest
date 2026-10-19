import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { MANUAL_GUIA_PSICOLOGO } from "@/lib/manuales";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const filePath = path.join(
      process.cwd(),
      "public",
      "manuales",
      "guia-del-psicologo.pdf",
    );
    const data = await readFile(filePath);
    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(data.byteLength),
        "Content-Disposition": `attachment; filename="${MANUAL_GUIA_PSICOLOGO.filename}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[manuales] guía no encontrada:", error);
    return NextResponse.json({ error: "Manual no disponible" }, { status: 404 });
  }
}
