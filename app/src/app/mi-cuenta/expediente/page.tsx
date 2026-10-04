import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db/index";
import { certificationPrograms, studentExpedientes } from "@/db/schema";
import { asegurarSeccion } from "../guardia";
import { Avance, Encabezado, Tarjeta, Tarjetas, Vacio } from "../Secciones";

export const dynamic = "force-dynamic";

const ESTADO: Record<string, string> = {
  draft: "En preparación",
  in_progress: "En proceso",
  ready: "Listo para dictamen",
  certified: "Certificado",
  rejected: "No acreditado",
};

export default async function MiExpedientePage() {
  // Redirige si esta sección no es del canal de la persona.
  const { user } = await asegurarSeccion("/mi-cuenta/expediente");

  const db = getDb();
  const expedientes = await db
    .select({
      id: studentExpedientes.id,
      estado: studentExpedientes.status,
      aprovechamiento: studentExpedientes.aprovechamientoPercent,
      presencia: studentExpedientes.presencePercentAvg,
      programa: certificationPrograms.title,
      clave: certificationPrograms.code,
    })
    .from(studentExpedientes)
    .leftJoin(
      certificationPrograms,
      eq(studentExpedientes.programId, certificationPrograms.id),
    )
    .where(eq(studentExpedientes.userId, user.id))
    .orderBy(desc(studentExpedientes.id));

  return (
    <>
      <Encabezado
        titulo="Mi expediente"
        texto="Tu avance hacia la certificación: evidencias, permanencia y dictamen."
      />

      {expedientes.length === 0 ? (
        <Vacio
          titulo="Todavía no hay expediente abierto"
          texto="Se abre cuando inicias un proceso de certificación. Escríbenos si ya empezaste y no lo ves."
        />
      ) : (
        <Tarjetas>
          {expedientes.map((e) => (
            <Tarjeta
              key={e.id}
              meta={`${e.clave ? `${e.clave} · ` : ""}${ESTADO[e.estado] ?? e.estado}`}
              titulo={e.programa ?? "Programa de certificación"}
            >
              <p>Permanencia promedio: {e.presencia}%</p>
              <Avance porcentaje={e.aprovechamiento} />
            </Tarjeta>
          ))}
        </Tarjetas>
      )}
    </>
  );
}
