import Link from "next/link";
import { desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/index";
import { courseEnrollments, liveClasses } from "@/db/schema";
import { asegurarSeccion } from "../guardia";
import { fechaHora } from "@/lib/formato";
import { Encabezado, Tarjeta, Tarjetas, Vacio } from "../Secciones";

export const dynamic = "force-dynamic";

export default async function EnVivoPage() {
  // Redirige si esta sección no es del canal de la persona.
  const { user } = await asegurarSeccion("/mi-cuenta/en-vivo");

  const db = getDb();

  // Solo las clases de los cursos en los que está inscrito
  const inscripciones = await db
    .select({ courseId: courseEnrollments.courseId })
    .from(courseEnrollments)
    .where(eq(courseEnrollments.userId, user.id));

  const cursoIds = inscripciones.map((i) => i.courseId);

  const clases = cursoIds.length
    ? await db
        .select({
          id: liveClasses.id,
          titulo: liveClasses.title,
          cuando: liveClasses.scheduledAt,
          minutos: liveClasses.durationMinutes,
          estado: liveClasses.status,
          grabacion: liveClasses.recordingUrl,
        })
        .from(liveClasses)
        .where(inArray(liveClasses.courseId, cursoIds))
        .orderBy(desc(liveClasses.scheduledAt))
    : [];

  const proximas = clases.filter((c) => c.estado === "scheduled" || c.estado === "live");
  const pasadas = clases.filter((c) => c.estado === "completed");

  return (
    <>
      <Encabezado
        titulo="Clases en vivo"
        texto="Las sesiones de tus cursos. Si ya pasaron y hay grabación, puedes repetirlas."
      />

      {clases.length === 0 ? (
        <Vacio
          titulo="No hay clases programadas"
          texto="Cuando se agende una sesión de alguno de tus cursos aparecerá aquí, con su enlace para entrar."
        />
      ) : (
        <>
          {proximas.length > 0 && (
            <Tarjetas>
              {proximas.map((c) => (
                <Tarjeta
                  key={c.id}
                  meta={c.estado === "live" ? "En curso ahora" : "Próxima"}
                  titulo={c.titulo}
                  pie={
                    <Link href={`/mi-cuenta/en-vivo/${c.id}/sala`}>
                      {c.estado === "live" ? "Entrar ahora →" : "Ver detalle →"}
                    </Link>
                  }
                >
                  <p>
                    {fechaHora(c.cuando)} · {c.minutos} min
                  </p>
                </Tarjeta>
              ))}
            </Tarjetas>
          )}

          {pasadas.length > 0 && (
            <div style={{ marginTop: proximas.length ? "2.5rem" : 0 }}>
              <Encabezado titulo="Sesiones anteriores" />
              <Tarjetas>
                {pasadas.map((c) => (
                  <Tarjeta
                    key={c.id}
                    meta="Terminada"
                    titulo={c.titulo}
                    pie={
                      c.grabacion ? (
                        <a href={c.grabacion} target="_blank" rel="noopener noreferrer">
                          Ver grabación →
                        </a>
                      ) : (
                        <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                          Sin grabación disponible
                        </span>
                      )
                    }
                  >
                    <p>{fechaHora(c.cuando)}</p>
                  </Tarjeta>
                ))}
              </Tarjetas>
            </div>
          )}
        </>
      )}
    </>
  );
}
