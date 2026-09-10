import { NextResponse } from "next/server";
import { getReadyDb } from "@/db/index";
import { getSessionUser, requireUser } from "@/lib/auth";
import { authErrorResponse } from "@/lib/live-classes";
import {
  addEvidence,
  getExpedienteBundle,
  recalcExpedienteMetrics,
  setExpedienteStatus,
  submitEvaluation,
} from "@/lib/expedientes";
import { issueCertificate } from "@/lib/certificates";

export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    await getReadyDb();
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const params = await props.params;
    const bundle = await getExpedienteBundle(params.id);
    if (!bundle) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    if (user.rol !== "admin" && bundle.expediente.userId !== user.id) {
      return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
    }

    const metrics = await recalcExpedienteMetrics(params.id);
    return NextResponse.json({ ...bundle, metrics });
  } catch (error) {
    console.error("expediente GET:", error);
    return NextResponse.json({ error: "Error al cargar expediente" }, { status: 500 });
  }
}

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    await getReadyDb();
    const user = await requireUser(["admin"]);
    const params = await props.params;
    const body = await request.json();

    if (body.status) {
      const bundle = await setExpedienteStatus(params.id, body.status, body.notes);
      return NextResponse.json(bundle);
    }

    if (body.action === "issue_certificate") {
      const origin = new URL(request.url).origin;
      const certificate = await issueCertificate(params.id, origin);
      return NextResponse.json({ certificate });
    }

    if (body.action === "evaluation") {
      const evaluation = await submitEvaluation({
        expedienteId: params.id,
        type: body.type,
        answers: body.answers || {},
        score: body.score,
        reviewedBy: user.id,
      });
      return NextResponse.json({ evaluation });
    }

    if (body.action === "evidence") {
      const evidence = await addEvidence({
        expedienteId: params.id,
        title: body.title || "Evidencia",
        description: body.description,
        evidenceType: body.evidenceType,
        fileUrl: body.fileUrl,
        metaJson: body.metaJson,
      });
      return NextResponse.json({ evidence }, { status: 201 });
    }

    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
  } catch (error) {
    const auth = authErrorResponse(error);
    if (auth.status === 401 || auth.status === 403) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    console.error("expediente PATCH:", error);
    return NextResponse.json({ error: "Error al actualizar expediente" }, { status: 500 });
  }
}

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    await getReadyDb();
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const params = await props.params;
    const bundle = await getExpedienteBundle(params.id);
    if (!bundle) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    if (user.rol !== "admin" && bundle.expediente.userId !== user.id) {
      return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
    }

    const body = await request.json();
    const action = body.action || "evaluation";

    if (action === "evaluation") {
      const allowed = ["diagnostico", "inicial", "final", "satisfaccion"] as const;
      const type = body.type as (typeof allowed)[number];
      if (!allowed.includes(type)) {
        return NextResponse.json({ error: "Tipo de evaluación no permitido" }, { status: 400 });
      }
      const evaluation = await submitEvaluation({
        expedienteId: params.id,
        type,
        answers: body.answers || {},
        score: body.score,
      });
      return NextResponse.json({ evaluation }, { status: 201 });
    }

    if (action === "evidence") {
      const evidence = await addEvidence({
        expedienteId: params.id,
        title: body.title || "Evidencia",
        description: body.description,
        evidenceType: body.evidenceType,
        fileUrl: body.fileUrl,
        metaJson: body.metaJson,
      });
      return NextResponse.json({ evidence }, { status: 201 });
    }

    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
  } catch (error) {
    console.error("expediente POST:", error);
    return NextResponse.json({ error: "Error en expediente" }, { status: 500 });
  }
}
