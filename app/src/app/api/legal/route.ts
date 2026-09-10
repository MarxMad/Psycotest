import { NextResponse } from "next/server";
import { getReadyDb } from "@/db/index";
import { getSessionUser, requireUser } from "@/lib/auth";
import { authErrorResponse } from "@/lib/live-classes";
import {
  acknowledgeLegal,
  listLegalDocuments,
} from "@/lib/legal-promo";

export async function GET() {
  try {
    await getReadyDb();
    const docs = await listLegalDocuments(true);
    return NextResponse.json({
      documents: docs.map((d) => ({
        id: d.id,
        type: d.type,
        title: d.title,
        bodyMarkdown: d.bodyMarkdown,
        version: d.version,
      })),
    });
  } catch (error) {
    console.error("legal GET:", error);
    return NextResponse.json({ error: "Error al cargar documentos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await getReadyDb();
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await request.json();
    if (!body.documentId) {
      return NextResponse.json({ error: "Falta documentId" }, { status: 400 });
    }

    const ack = await acknowledgeLegal(user.id, body.documentId, body.ipHash);
    return NextResponse.json({ acknowledgement: ack }, { status: 201 });
  } catch (error) {
    const auth = authErrorResponse(error);
    if (auth.status === 401 || auth.status === 403) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    console.error("legal POST:", error);
    return NextResponse.json({ error: "Error al acusar" }, { status: 500 });
  }
}

/** Admin: listar incluyendo inactivos */
export async function PUT() {
  try {
    await getReadyDb();
    await requireUser(["admin"]);
    const docs = await listLegalDocuments(false);
    return NextResponse.json({ documents: docs });
  } catch (error) {
    const auth = authErrorResponse(error);
    if (auth.status === 401 || auth.status === 403) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
