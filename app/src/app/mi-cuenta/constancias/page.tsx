import Link from "next/link";
import { desc, eq, isNull, and } from "drizzle-orm";
import { getDb } from "@/db/index";
import { courseCertificates, courses } from "@/db/schema";
import { asegurarSeccion } from "../guardia";
import { fechaCorta } from "@/lib/formato";
import { Encabezado, Tarjeta, Tarjetas, Vacio } from "../Secciones";

export const dynamic = "force-dynamic";

export default async function MisConstanciasPage() {
  // Redirige si esta sección no es del canal de la persona.
  const { user } = await asegurarSeccion("/mi-cuenta/constancias");

  const db = getDb();
  const emitidas = await db
    .select({
      id: courseCertificates.id,
      folio: courseCertificates.folio,
      codigo: courseCertificates.verificationCode,
      emitida: courseCertificates.issuedAt,
      curso: courses.title,
    })
    .from(courseCertificates)
    .leftJoin(courses, eq(courseCertificates.courseId, courses.id))
    .where(and(eq(courseCertificates.userId, user.id), isNull(courseCertificates.revokedAt)))
    .orderBy(desc(courseCertificates.issuedAt));

  return (
    <>
      <Encabezado
        titulo="Mis constancias"
        texto="Los documentos que ya obtuviste. Cualquiera puede comprobar su validez con el código."
      />

      {emitidas.length === 0 ? (
        <Vacio
          titulo="Aún no tienes constancias"
          texto="Cuando completes un programa y se emita tu dictamen, el documento aparecerá aquí para descargarlo."
        />
      ) : (
        <Tarjetas>
          {emitidas.map((c) => (
            <Tarjeta
              key={c.id}
              meta={`Folio ${c.folio}`}
              titulo={c.curso ?? "Programa de certificación"}
              pie={
                <>
                  <a href={`/api/certificates/${c.codigo}/pdf`} target="_blank" rel="noopener noreferrer">
                    Descargar PDF →
                  </a>
                  <Link href={`/verificar/${c.codigo}`}>Verificar</Link>
                </>
              }
            >
              <p>Emitida el {fechaCorta(c.emitida)}</p>
            </Tarjeta>
          ))}
        </Tarjetas>
      )}
    </>
  );
}
