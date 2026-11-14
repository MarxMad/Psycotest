import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { correoVentas, enviarCorreo, plantilla, textoPlano } from "@/lib/correo";
import { parseAllowedInstruments, parseCompletedInstruments } from "@/lib/access-codes";
import { NOMBRE_INSTRUMENTO } from "@/lib/instrumentos";
import type { Instrumento } from "@/lib/storage";
import { urlDelSitio } from "@/lib/sitio";

/**
 * Correos del ciclo de una evaluación por código:
 *
 *  1. El candidato termina todas sus pruebas → a quien compró el código
 *     (que puede ser él mismo) y al equipo de psicólogos.
 *  2. El psicólogo valida todos sus informes → a quien compró el código.
 *
 * Los resultados nunca van en el correo: son datos sensibles y salen sólo
 * después de que el psicólogo los revisa. Un correo que falla no debe tumbar
 * el envío de la prueba ni la validación, por eso todo se atrapa aquí.
 */

/** A quién avisar de evaluaciones por revisar. */
function correoPsicologos(): string {
  return process.env.CORREO_PSICOLOGOS || correoVentas();
}

export type DatosAviso = {
  origen: string;
  /** Quien contesta. */
  persona: string;
  puesto?: string | null;
  empresa?: string | null;
  pruebas: Instrumento[];
  /** Quien compró el código; null si se creó desde el panel. */
  cliente: { nombre: string; email: string } | null;
  /** Compra «para mí»: quien contesta y quien pagó son la misma persona. */
  personal: boolean;
  codigoId: string;
  codigoEtiqueta: string;
};

type Correo = { asunto: string; html: string; texto: string };

function armar(c: Parameters<typeof plantilla>[1] & { boton: { texto: string; url: string } }, asunto: string): Correo {
  return { asunto, html: plantilla("psicologia", c), texto: textoPlano("psicologia", c) };
}

const saludo = (nombre?: string) => {
  const pila = nombre?.split(" ")[0];
  return pila ? `Hola, ${pila}. ` : "";
};

const filasDe = (pruebas: Instrumento[], importe?: string) =>
  pruebas.map((p) => ({ concepto: NOMBRE_INSTRUMENTO[p], importe }));

/** Al cliente: el candidato (o él mismo) terminó de contestar. */
export function correoTerminadasCliente(d: DatosAviso): Correo {
  const boton = { texto: "Ver mis evaluaciones", url: `${d.origen}/mi-cuenta/evaluaciones` };
  if (d.personal) {
    return armar(
      {
        titulo: "Recibimos tus respuestas",
        intro: `${saludo(d.cliente?.nombre)}Terminaste tu evaluación. Un psicólogo revisa ahora tus resultados y en un máximo de 72 horas te avisamos que tu informe está listo.`,
        filas: filasDe(d.pruebas),
        nota: "No hace falta que hagas nada más. Si tienes dudas, responde a este correo.",
        boton,
      },
      "Recibimos tus respuestas · Psicología Aplicada",
    );
  }
  return armar(
    {
      titulo: `${d.persona} terminó su evaluación`,
      intro: `${saludo(d.cliente?.nombre)}${d.persona}${
        d.puesto ? `, candidato a ${d.puesto},` : ""
      } contestó todas sus pruebas. Un psicólogo revisa ahora los resultados y en un máximo de 72 horas te avisamos que el informe está listo.`,
      filas: filasDe(d.pruebas),
      nota: "Puedes seguir el avance de cada candidato en tu cuenta.",
      boton,
    },
    `${d.persona} terminó su evaluación · Psicología Aplicada`,
  );
}

/** Al equipo: hay una evaluación por revisar y validar. */
export function correoPorRevisar(d: DatosAviso): Correo {
  const n = d.pruebas.length;
  return armar(
    {
      titulo: `Por revisar: ${d.persona}`,
      intro: `${d.persona}${d.puesto ? ` (${d.puesto})` : ""}${
        d.empresa ? `, de ${d.empresa},` : ""
      } terminó ${n === 1 ? "su prueba" : `sus ${n} pruebas`} con el código «${d.codigoEtiqueta}». Ya están calificadas; falta revisar y validar los informes.`,
      filas: filasDe(d.pruebas),
      nota: d.cliente
        ? `Al validar todos, avisamos a ${d.cliente.email} que el informe está listo.`
        : "El código se creó desde el panel: nadie más recibe aviso.",
      boton: { texto: "Abrir en el panel", url: `${d.origen}/admin/pruebas/codigos/${d.codigoId}` },
    },
    `Evaluación por revisar · ${d.persona}`,
  );
}

/** Al cliente: el psicólogo validó todos los informes. */
export function correoInformeListo(d: DatosAviso): Correo {
  return armar(
    {
      titulo: d.personal ? "Tu informe está listo" : `El informe de ${d.persona} está listo`,
      intro: `${saludo(d.cliente?.nombre)}${
        d.personal
          ? "Un psicólogo revisó y validó tus resultados."
          : `Un psicólogo revisó y validó los resultados de ${d.persona}.`
      }`,
      filas: filasDe(d.pruebas, "validado"),
      nota: "Por tratarse de datos personales, el informe no viaja en este correo. Nos pondremos en contacto contigo para entregártelo; si tienes prisa, responde a este correo.",
      boton: { texto: "Ver mis evaluaciones", url: `${d.origen}/mi-cuenta/evaluaciones` },
    },
    d.personal ? "Tu informe está listo · Psicología Aplicada" : `Informe listo: ${d.persona} · Psicología Aplicada`,
  );
}

async function datosDelCanje(redemptionId: string, origen: string) {
  const db = getDb();
  const [canje] = await db
    .select()
    .from(schema.accessRedemptions)
    .where(eq(schema.accessRedemptions.id, redemptionId))
    .limit(1);
  if (!canje) return null;
  const [codigo] = await db
    .select()
    .from(schema.accessCodes)
    .where(eq(schema.accessCodes.id, canje.accessCodeId))
    .limit(1);
  if (!codigo) return null;
  const [cliente] = codigo.clienteUserId
    ? await db
        .select({ email: schema.users.email, nombre: schema.users.nombre })
        .from(schema.users)
        .where(eq(schema.users.id, codigo.clienteUserId))
        .limit(1)
    : [];
  const pruebas = parseAllowedInstruments(codigo.allowedInstruments);
  const hechas = parseCompletedInstruments(canje.completedInstruments);
  const datos: DatosAviso = {
    origen,
    persona: canje.participantNombre,
    puesto: canje.puesto,
    empresa: canje.empresa,
    pruebas,
    cliente: cliente ?? null,
    // La compra «para mí» etiqueta así su código (pagos-psicologia.ts).
    personal: codigo.label.endsWith("evaluación personal"),
    codigoId: codigo.id,
    codigoEtiqueta: codigo.label,
  };
  return { datos, terminado: pruebas.length > 0 && pruebas.every((p) => hechas.includes(p)) };
}

/** Llamar después de marcar una prueba como completada. Sólo avisa al terminar la última. */
export async function avisarPruebasTerminadas(redemptionId: string, origen = urlDelSitio()) {
  try {
    const r = await datosDelCanje(redemptionId, origen);
    if (!r?.terminado) return;
    const d = r.datos;
    if (d.cliente) {
      await enviarCorreo({
        marca: "psicologia",
        para: d.cliente.email,
        ...correoTerminadasCliente(d),
        clave: `pruebas-terminadas-${redemptionId}`,
      });
    }
    await enviarCorreo({
      marca: "psicologia",
      para: correoPsicologos(),
      ...correoPorRevisar(d),
      clave: `por-revisar-${redemptionId}`,
    });
  } catch (error) {
    console.error("[avisos-evaluacion] pruebas terminadas:", error);
  }
}

/**
 * Llamar cuando una sesión pasa a validada. Avisa a quien compró sólo cuando
 * el candidato terminó todo y todas sus sesiones están validadas.
 */
export async function avisarInformeListo(redemptionId: string, origen = urlDelSitio()) {
  try {
    const r = await datosDelCanje(redemptionId, origen);
    if (!r?.terminado || !r.datos.cliente) return;
    const sesiones = await getDb()
      .select({ instrumento: schema.assessmentSessions.instrumento, aprobada: schema.assessmentSessions.aprobada })
      .from(schema.assessmentSessions)
      .where(eq(schema.assessmentSessions.accessRedemptionId, redemptionId));
    const validadas = new Set(sesiones.filter((s) => s.aprobada).map((s) => s.instrumento));
    if (!r.datos.pruebas.every((p) => validadas.has(p))) return;

    await enviarCorreo({
      marca: "psicologia",
      para: r.datos.cliente.email,
      ...correoInformeListo(r.datos),
      clave: `informe-listo-${redemptionId}`,
    });
  } catch (error) {
    console.error("[avisos-evaluacion] informe listo:", error);
  }
}
