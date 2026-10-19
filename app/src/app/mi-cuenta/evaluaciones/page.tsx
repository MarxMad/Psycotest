import { desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/index";
import { accessCodes, accessRedemptions, assessmentSessions } from "@/db/schema";
import { asegurarSeccion } from "../guardia";
import { NOMBRE_INSTRUMENTO } from "@/lib/instrumentos";
import { fechaCorta } from "@/lib/formato";
import { Encabezado, Tarjeta, Tarjetas, Vacio } from "../Secciones";

export const dynamic = "force-dynamic";

/**
 * Resultados de los candidatos que esta empresa mandó evaluar.
 * Solo ve lo emitido bajo sus propios códigos; nunca el panel completo.
 */
export default async function MisEvaluacionesPage() {
  // Redirige si esta sección no es del canal de la persona.
  const { user } = await asegurarSeccion("/mi-cuenta/evaluaciones");

  const db = getDb();

  const misCodigos = await db
    .select({ id: accessCodes.id, etiqueta: accessCodes.label, usados: accessCodes.usedCount })
    .from(accessCodes)
    .where(eq(accessCodes.clienteUserId, user.id))
    .orderBy(desc(accessCodes.id));

  const ids = misCodigos.map((c) => c.id);

  const sesiones = ids.length
    ? await db
        .select({
          id: assessmentSessions.id,
          participante: assessmentSessions.participantNombre,
          instrumento: assessmentSessions.instrumento,
          puesto: assessmentSessions.puesto,
          aprobada: assessmentSessions.aprobada,
          fecha: assessmentSessions.actualizada,
        })
        .from(assessmentSessions)
        .where(inArray(assessmentSessions.accessCodeId, ids))
        .orderBy(desc(assessmentSessions.actualizada))
    : [];

  // Un candidato puede haber presentado varios instrumentos
  const porPersona = new Map<string, typeof sesiones>();
  for (const s of sesiones) {
    const lista = porPersona.get(s.participante) ?? [];
    lista.push(s);
    porPersona.set(s.participante, lista);
  }

  return (
    <>
      <Encabezado
        titulo="Mis evaluaciones"
        texto="Los candidatos que mandaste evaluar y el estado de su informe."
      />

      {porPersona.size === 0 ? (
        <Vacio
          titulo="Sin evaluaciones todavía"
          texto={
            ids.length === 0
              ? "Cuando contrates un proceso de evaluación, aquí verás a tus candidatos y sus resultados."
              : "Tus códigos están emitidos pero nadie los ha usado aún. En cuanto un candidato responda, aparecerá aquí."
          }
        />
      ) : (
        <Tarjetas>
          {[...porPersona.entries()].map(([nombre, pruebas]) => {
            const listas = pruebas.filter((p) => p.aprobada).length;
            return (
              <Tarjeta
                key={nombre}
                meta={pruebas[0]?.puesto ?? "Sin puesto indicado"}
                titulo={nombre}
              >
                <p>
                  {listas} de {pruebas.length}{" "}
                  {pruebas.length === 1 ? "instrumento interpretado" : "instrumentos interpretados"}
                </p>
                <ul style={{ margin: "0.7rem 0 0", padding: 0, listStyle: "none" }}>
                  {pruebas.map((p) => (
                    <li
                      key={p.id}
                      style={{ fontSize: "0.84rem", color: "var(--muted)", lineHeight: 1.6 }}
                    >
                      {NOMBRE_INSTRUMENTO[p.instrumento]} ·{" "}
                      {p.aprobada ? "informe listo" : "en revisión"} · {fechaCorta(p.fecha)}
                    </li>
                  ))}
                </ul>
              </Tarjeta>
            );
          })}
        </Tarjetas>
      )}
    </>
  );
}
