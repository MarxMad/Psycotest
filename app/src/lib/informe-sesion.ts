import { eq } from "drizzle-orm";
import { renderToBuffer } from "@react-pdf/renderer";
import { getDb, schema } from "@/db";
import { InformePdfDocument, psicologoResponsable, type FirmaPsicologo } from "@/lib/informe-pdf";
import { SocioeconomicoPdfDocument } from "@/lib/socioeconomico-pdf";
import { comoRespuestas, resumirSocioeconomico } from "@/lib/socioeconomico";

type Sesion = typeof schema.assessmentSessions.$inferSelect;

/** Quién firma un informe validado: la cuenta que lo validó, o el responsable configurado. */
export async function firmaDe(ses: Sesion): Promise<FirmaPsicologo | null> {
  if (!ses.aprobada) return null;
  const responsable = psicologoResponsable();
  let nombre: string | null = null;
  if (ses.approvedById) {
    const [u] = await getDb()
      .select({ nombre: schema.users.nombre })
      .from(schema.users)
      .where(eq(schema.users.id, ses.approvedById))
      .limit(1);
    nombre = u?.nombre ?? null;
  }
  const quien = nombre || responsable.nombre;
  if (!quien) return { nombre: "Psicólogo responsable", cedula: responsable.cedula, fecha: ses.actualizada };
  // La cédula configurada es la del responsable: sólo se pone si es él quien firma.
  const cedula = !nombre || nombre === responsable.nombre ? responsable.cedula : null;
  return { nombre: quien, cedula, fecha: ses.actualizada };
}

export function nombreDeArchivo(persona: string, prueba: string, firmado = false) {
  const slug = persona
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return `informe-${prueba}-${slug || "evaluacion"}${firmado ? "-firmado" : ""}.pdf`;
}

/**
 * El PDF de una sesión. Si está validada sale firmada; si no, como
 * preliminar. Null cuando todavía no hay nada que poner en el informe.
 */
export async function pdfDeSesion(ses: Sesion): Promise<{ nombre: string; contenido: Buffer } | null> {
  if (!ses.interpretacion) return null;
  const fin = ses.finalizada ?? (ses.terminada ? ses.actualizada : null);
  const folio = ses.id.slice(-10).toUpperCase();

  if (ses.instrumento === "socioeconomico") {
    if (!ses.aprobada) return null;
    const r = comoRespuestas(ses.respuestas);
    const contenido = await renderToBuffer(
      SocioeconomicoPdfDocument({
        data: {
          participante: ses.participantNombre,
          puesto: ses.puesto,
          empresa: ses.empresa,
          iniciada: ses.iniciada,
          respuestas: r,
          resumen: resumirSocioeconomico(r),
          interpretacion: ses.interpretacion,
          notas: ses.notasPsicologo,
        },
      }),
    );
    return { nombre: nombreDeArchivo(ses.participantNombre, ses.instrumento, true), contenido };
  }

  const firma = await firmaDe(ses);
  const contenido = await renderToBuffer(
    InformePdfDocument({
      data: {
        instrumento: ses.instrumento,
        participante: ses.participantNombre,
        puesto: ses.puesto,
        empresa: ses.empresa,
        iniciada: ses.iniciada,
        finalizada: fin,
        interpretacion: ses.interpretacion,
        notasPsicologo: ses.aprobada ? ses.notasPsicologo : null,
        preliminar: !ses.aprobada,
        firma,
        folio,
      },
    }),
  );
  return { nombre: nombreDeArchivo(ses.participantNombre, ses.instrumento, ses.aprobada), contenido };
}
