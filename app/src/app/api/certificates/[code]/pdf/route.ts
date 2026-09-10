import { NextResponse } from "next/server";
import { pdf } from "@react-pdf/renderer";
import { getReadyDb } from "@/db/index";
import { findCertificateByCode, qrDataUrl } from "@/lib/certificates";
import { ConstanciaPdfDocument } from "@/lib/constancia-pdf";

export async function GET(
  _request: Request,
  props: { params: Promise<{ code: string }> },
) {
  try {
    await getReadyDb();
    const params = await props.params;
    const found = await findCertificateByCode(params.code);
    if (!found?.certificate || found.certificate.revokedAt) {
      return NextResponse.json({ error: "Constancia no encontrada" }, { status: 404 });
    }

    const dictamen = (found.certificate.dictamenJson || {}) as Record<string, unknown>;
    const verificationUrl =
      (dictamen.verificationUrl as string) ||
      `${process.env.NEXT_PUBLIC_APP_URL || ""}/verificar/${found.certificate.verificationCode}`;

    const qr = await qrDataUrl(verificationUrl);
    const blob = await pdf(
      ConstanciaPdfDocument({
        data: {
          folio: found.certificate.folio,
          participantName: found.user?.nombre || "Participante",
          courseTitle: found.course?.title || "Curso",
          programCode: (dictamen.programCode as string) || "EC",
          programTitle: (dictamen.programTitle as string) || "Programa CONOCER",
          issuedAt: found.certificate.issuedAt,
          aprovechamientoPercent: Number(dictamen.aprovechamientoPercent || 0),
          presencePercentAvg: Number(dictamen.presencePercentAvg || 0),
          verificationUrl,
          verificationCode: found.certificate.verificationCode,
          qrDataUrl: qr,
          dictamenText: dictamen.meetsCriteria
            ? "Dictamen: cumple criterios mínimos de aprovechamiento y participación."
            : "Dictamen: emitida con observaciones; revisar expediente.",
        },
      }),
    ).toBlob();

    const buffer = Buffer.from(await blob.arrayBuffer());
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="constancia-${found.certificate.folio}.pdf"`,
      },
    });
  } catch (error) {
    console.error("constancia pdf:", error);
    return NextResponse.json({ error: "Error al generar PDF" }, { status: 500 });
  }
}
