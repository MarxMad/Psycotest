import { NextResponse } from "next/server";
import { getReadyDb } from "@/db/index";
import { getSessionUser, requireUser } from "@/lib/auth";
import { authErrorResponse } from "@/lib/live-classes";
import {
  listExpedientes,
  openOrGetExpediente,
} from "@/lib/expedientes";

export async function GET(request: Request) {
  try {
    await getReadyDb();
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const url = new URL(request.url);
    const courseId = url.searchParams.get("courseId") || undefined;
    const status = url.searchParams.get("status") || undefined;
    const mine = url.searchParams.get("mine") === "1";

    if (mine || user.rol !== "admin") {
      const all = await listExpedientes({ courseId, status });
      return NextResponse.json({
        expedientes: all.filter((e) => e.userId === user.id),
      });
    }

    await requireUser(["admin"]);
    const expedientes = await listExpedientes({ courseId, status });
    return NextResponse.json({ expedientes });
  } catch (error) {
    const auth = authErrorResponse(error);
    if (auth.status === 401 || auth.status === 403) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    console.error("expedientes GET:", error);
    return NextResponse.json({ error: "Error al listar expedientes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await getReadyDb();
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await request.json();
    if (!body.courseId) {
      return NextResponse.json({ error: "Falta courseId" }, { status: 400 });
    }

    const targetUserId = user.rol === "admin" && body.userId ? body.userId : user.id;
    const result = await openOrGetExpediente(targetUserId, body.courseId, body.enrollmentId);
    if (!result) return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("expedientes POST:", error);
    return NextResponse.json({ error: "Error al abrir expediente" }, { status: 500 });
  }
}
