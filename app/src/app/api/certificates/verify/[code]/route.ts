import { NextResponse } from "next/server";
import { getReadyDb } from "@/db/index";
import { findCertificateByCode } from "@/lib/certificates";

export async function GET(
  _request: Request,
  props: { params: Promise<{ code: string }> },
) {
  try {
    await getReadyDb();
    const params = await props.params;
    const found = await findCertificateByCode(params.code);
    if (!found?.certificate || found.certificate.revokedAt) {
      return NextResponse.json({ valid: false, error: "No encontrada" }, { status: 404 });
    }

    return NextResponse.json({
      valid: true,
      folio: found.certificate.folio,
      issuedAt: found.certificate.issuedAt,
      participant: found.user?.nombre,
      course: found.course?.title,
      dictamen: found.certificate.dictamenJson,
    });
  } catch (error) {
    console.error("verify cert:", error);
    return NextResponse.json({ error: "Error de verificación" }, { status: 500 });
  }
}
