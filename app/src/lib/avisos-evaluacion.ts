import { eq } from "drizzle-orm";
import { renderToBuffer } from "@react-pdf/renderer";
import { getDb, schema } from "@/db";
import { correoVentas, enviarCorreo, escapar, plantilla, textoPlano, type Fila } from "@/lib/correo";
import { CONTACTO, whatsapp } from "@/lib/contacto";
import { parseAllowedInstruments } from "@/lib/access-codes";
import { NOMBRE_INSTRUMENTO } from "@/lib/instrumentos";
import { InformePdfDocument } from "@/lib/informe-pdf";
import type { Instrumento } from "@/lib/storage";
import { urlDelSitio } from "@/lib/sitio";
import { fechaHora, tiemposDe } from "@/lib/tiempos-prueba";

/**
 * Correos del ciclo de una evaluación por código. Cada uno va a quien compró
 * el código (el «cliente», que en una compra personal es quien contesta) y
 * al equipo:
 *
 *  1. Empieza una prueba: aviso con la hora de inicio.
 *  2. Termina una prueba: el informe preliminar en PDF, con inicio, fin y
 *     el tiempo exacto que tardó. Al cliente se le ofrece retroalimentación
 *     detallada con Martín, con el mensaje ya escrito.
 *  3. El psicólogo valida todos los informes: aviso de informe listo.
 *
 * Un correo que falla no debe tumbar la prueba ni la validación: todo se
 * atrapa aquí y queda en el registro.
 */

/** A quién avisar del avance de las evaluaciones. */
function correoEquipo(): string {
  return process.env.CORREO_PSICOLOGOS || correoVentas();
}

const SIGLA: Partial<Record<Instrumento, string>> = {
  papi: "PAPI",
  hartman: "Hartman",
  mabe: "MABE",
  cleaver: "Cleaver",
  lifo: "LIFO",
};

/** «Inventario de Personalidad (PAPI)». */
export function nombrePrueba(i: Instrumento): string {
  return SIGLA[i] ? `${NOMBRE_INSTRUMENTO[i]} (${SIGLA[i]})` : NOMBRE_INSTRUMENTO[i];
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
type Contenido = Parameters<typeof plantilla>[1];

function armar(c: Contenido, asunto: string, extraTexto?: string): Correo {
  const { extraHtml: _html, ...resto } = c;
  void _html;
  return { asunto, html: plantilla("psicologia", c), texto: textoPlano("psicologia", { ...resto, extra: extraTexto }) };
}

const saludo = (nombre?: string) => {
  const pila = nombre?.split(" ")[0];
  return pila ? `Hola, ${pila}. ` : "";
};

const filasDe = (pruebas: Instrumento[], importe?: string) =>
  pruebas.map((p) => ({ concepto: nombrePrueba(p), importe }));

function filasDeQuien(d: DatosAviso): Fila[] {
  return [
    { concepto: "Persona evaluada", importe: d.persona },
    ...(d.puesto ? [{ concepto: "Puesto", importe: d.puesto }] : []),
    ...(d.empresa ? [{ concepto: "Empresa", importe: d.empresa }] : []),
    { concepto: "Código", importe: d.codigoEtiqueta },
    { concepto: "Cliente", importe: d.cliente ? `${d.cliente.nombre} · ${d.cliente.email}` : "Creado desde el panel" },
  ];
}

/* ------------------------------------------------- retroalimentación con Martín */

/** El mensaje ya escrito para pedir retroalimentación detallada. */
export function mensajeRetroalimentacion(d: DatosAviso, prueba: Instrumento): string {
  const quien = d.cliente ? `Soy ${d.cliente.nombre} (${d.cliente.email}).` : `Soy ${d.persona}.`;
  const que = d.personal
    ? `Acabo de terminar la prueba ${nombrePrueba(prueba)} con Psicología Aplicada y me gustaría recibir retroalimentación detallada de mis resultados.`
    : `${d.persona}${d.puesto ? `, para el puesto de ${d.puesto},` : ""} acaba de terminar la prueba ${nombrePrueba(
        prueba,
      )} con Psicología Aplicada y me gustaría recibir retroalimentación detallada de sus resultados.`;
  return `Hola, Martín. ${quien} ${que}`;
}

function bloqueRetroalimentacion(mensaje: string, prueba: Instrumento): { html: string; texto: string } {
  const asunto = `Retroalimentación detallada · ${nombrePrueba(prueba)}`;
  const correo = `mailto:${CONTACTO.email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(mensaje)}`;
  const wa = whatsapp(mensaje);
  const boton = (texto: string, url: string, fondo: string) =>
    `<a href="${escapar(url)}" style="display:inline-block;margin:0 8px 8px 0;background:${fondo};color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:11px 18px;border-radius:999px">${escapar(texto)}</a>`;
  const html = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0 8px;background:#fbf3ee;border:1px solid #f1d6c8;border-radius:12px">
<tr><td style="padding:18px 20px">
  <p style="margin:0 0 6px;font-size:17px;font-weight:700;color:#111">¿Quieres retroalimentación detallada?</p>
  <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#333">El informe da una primera lectura. Para entender a fondo los resultados y qué hacer con ellos, contacta a Martín Hernández: ya te dejamos el mensaje escrito.</p>
  <p style="margin:0 0 14px;padding:12px 14px;background:#ffffff;border-radius:8px;font-size:14px;line-height:1.5;color:#444;font-style:italic">${escapar(mensaje)}</p>
  ${boton("Enviar por WhatsApp", wa, "#1f8f4e")}${boton("Enviar por correo", correo, "#b52a22")}
</td></tr></table>`;
  const texto = [
    "¿Quieres retroalimentación detallada?",
    "Para entender a fondo los resultados, contacta a Martín Hernández. Mensaje sugerido:",
    `"${mensaje}"`,
    `WhatsApp: ${wa}`,
    `Correo: ${CONTACTO.email}`,
  ].join("\n");
  return { html, texto };
}

/* ------------------------------------------------------------ 1. inicio */

export function correoInicioCliente(d: DatosAviso, prueba: Instrumento, inicio: string): Correo {
  const filas: Fila[] = [
    { concepto: "Prueba", importe: nombrePrueba(prueba) },
    { concepto: "Inicio", importe: fechaHora(inicio) },
  ];
  if (d.personal) {
    return armar(
      {
        titulo: "Comenzaste tu prueba",
        intro: `${saludo(d.cliente?.nombre)}Registramos el inicio de tu prueba. Contesta con calma: al terminar te enviamos tu informe a este correo.`,
        filas,
        nota: "Si no fuiste tú quien empezó la prueba, responde a este correo.",
      },
      `Comenzaste: ${nombrePrueba(prueba)} · Psicología Aplicada`,
    );
  }
  return armar(
    {
      titulo: `${d.persona} comenzó su prueba`,
      intro: `${saludo(d.cliente?.nombre)}${d.persona}${
        d.puesto ? `, para el puesto de ${d.puesto},` : ""
      } empezó a contestar. Al terminar te enviamos su informe a este correo.`,
      filas,
      boton: { texto: "Ver mis evaluaciones", url: `${d.origen}/mi-cuenta/evaluaciones` },
    },
    `${d.persona} comenzó: ${nombrePrueba(prueba)} · Psicología Aplicada`,
  );
}

export function correoInicioEquipo(d: DatosAviso, prueba: Instrumento, inicio: string): Correo {
  return armar(
    {
      titulo: `Inició: ${d.persona}`,
      intro: `${d.persona} comenzó la prueba ${nombrePrueba(prueba)}.`,
      filas: [...filasDeQuien(d), { concepto: "Prueba", importe: nombrePrueba(prueba) }, { concepto: "Inicio", importe: fechaHora(inicio) }],
      boton: { texto: "Abrir en el panel", url: `${d.origen}/admin/pruebas/codigos/${d.codigoId}` },
    },
    `Inició ${nombrePrueba(prueba)} · ${d.persona}`,
  );
}

/* -------------------------------------------------------------- 2. fin */

type Fin = {
  prueba: Instrumento;
  inicio: string;
  fin: string;
  /** Hay informe en PDF adjunto. */
  conInforme: boolean;
  alertas: string[];
  sesionId: string;
};

function filasDeTiempo(f: Fin): Fila[] {
  const t = tiemposDe(f.inicio, f.fin);
  return [
    { concepto: "Prueba", importe: nombrePrueba(f.prueba) },
    { concepto: "Inicio", importe: t?.inicio ?? fechaHora(f.inicio) },
    { concepto: "Fin", importe: t?.fin ?? "—" },
    { concepto: "Tiempo de respuesta", importe: t?.duracion ?? "sin dato" },
  ];
}

export function correoFinCliente(d: DatosAviso, f: Fin): Correo {
  const retro = bloqueRetroalimentacion(mensajeRetroalimentacion(d, f.prueba), f.prueba);
  const sobreInforme = f.conInforme
    ? "Te adjuntamos el informe con la interpretación de los resultados. Se genera al terminar; un psicólogo lo revisa y, si hay ajustes, te enviamos la versión validada."
    : "Recibimos las respuestas. Un especialista completa ahora el estudio y te avisamos cuando el informe esté listo.";
  return armar(
    {
      titulo: d.personal ? "Terminaste tu prueba" : `${d.persona} terminó su prueba`,
      intro: `${saludo(d.cliente?.nombre)}${
        d.personal ? "Terminaste de contestar." : `${d.persona}${d.puesto ? `, para el puesto de ${d.puesto},` : ""} terminó de contestar.`
      } ${sobreInforme}`,
      filas: filasDeTiempo(f),
      extraHtml: f.conInforme ? retro.html : undefined,
      nota: "Por tratarse de datos personales, guarda este correo en un lugar seguro y no lo reenvíes.",
    },
    d.personal
      ? `Tu informe: ${nombrePrueba(f.prueba)} · Psicología Aplicada`
      : `Informe de ${d.persona}: ${nombrePrueba(f.prueba)} · Psicología Aplicada`,
    f.conInforme ? retro.texto : undefined,
  );
}

export function correoFinEquipo(d: DatosAviso, f: Fin): Correo {
  return armar(
    {
      titulo: `Terminó: ${d.persona}`,
      intro: `${d.persona} terminó la prueba ${nombrePrueba(f.prueba)}.${
        f.conInforme ? " El informe preliminar va adjunto; falta revisarlo y validarlo." : " Falta completar y validar el estudio."
      }`,
      parrafos: f.alertas.length ? [`Alertas de validez: ${f.alertas.join(" · ")}`] : undefined,
      filas: [...filasDeQuien(d), ...filasDeTiempo(f)],
      nota: d.cliente
        ? `${d.cliente.email} recibió el informe preliminar y la invitación a pedir retroalimentación con Martín.`
        : "El código se creó desde el panel: nadie más recibe el informe.",
      boton: { texto: "Revisar y validar", url: `${d.origen}/admin/pruebas/sesiones/${f.sesionId}` },
    },
    `Terminó ${nombrePrueba(f.prueba)} · ${d.persona}`,
  );
}

/* ---------------------------------------------------------- 3. validado */

/** Al cliente: el psicólogo validó todos los informes. */
export function correoInformeListo(d: DatosAviso): Correo {
  return armar(
    {
      titulo: d.personal ? "Tu informe está validado" : `El informe de ${d.persona} está validado`,
      intro: `${saludo(d.cliente?.nombre)}${
        d.personal
          ? "Un psicólogo revisó y validó tus resultados."
          : `Un psicólogo revisó y validó los resultados de ${d.persona}.`
      }`,
      filas: filasDe(d.pruebas, "validado"),
      nota: "Si quieres la versión validada del informe o una retroalimentación detallada, responde a este correo.",
      boton: { texto: "Ver mis evaluaciones", url: `${d.origen}/mi-cuenta/evaluaciones` },
    },
    d.personal ? "Tu informe está validado · Psicología Aplicada" : `Informe validado: ${d.persona} · Psicología Aplicada`,
  );
}

/* ------------------------------------------------------------- datos */

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
  const hechas = (canje.completedInstruments ?? []) as Instrumento[];
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

/* ------------------------------------------------------------- envíos */

/** Llamar cuando la persona pulsa «Comenzar». Las claves evitan avisos repetidos. */
export async function avisarInicioPrueba(
  redemptionId: string,
  prueba: Instrumento,
  inicio: string,
  origen = urlDelSitio(),
) {
  try {
    const r = await datosDelCanje(redemptionId, origen);
    if (!r) return;
    const d = r.datos;
    if (d.cliente) {
      await enviarCorreo({
        marca: "psicologia",
        para: d.cliente.email,
        ...correoInicioCliente(d, prueba, inicio),
        clave: `inicio-cliente-${redemptionId}-${prueba}`,
      });
    }
    await enviarCorreo({
      marca: "psicologia",
      para: correoEquipo(),
      ...correoInicioEquipo(d, prueba, inicio),
      clave: `inicio-equipo-${redemptionId}-${prueba}`,
      responderA: d.cliente?.email,
    });
  } catch (error) {
    console.error("[avisos-evaluacion] inicio:", error);
  }
}

function nombreDeArchivo(persona: string, prueba: Instrumento) {
  const slug = persona
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return `informe-${prueba}-${slug || "evaluacion"}.pdf`;
}

/** Llamar después de guardar una prueba terminada. Manda el informe de esa prueba. */
export async function avisarPruebaTerminada(sesionId: string, origen = urlDelSitio()) {
  try {
    const [ses] = await getDb()
      .select()
      .from(schema.assessmentSessions)
      .where(eq(schema.assessmentSessions.id, sesionId))
      .limit(1);
    if (!ses?.accessRedemptionId) return;
    const r = await datosDelCanje(ses.accessRedemptionId, origen);
    if (!r) return;
    const d = r.datos;
    const prueba = ses.instrumento as Instrumento;
    const fin = ses.finalizada ?? ses.actualizada;

    // El estudio socioeconómico no tiene interpretación hasta que el
    // investigador completa su parte: ese no lleva informe.
    const conInforme = prueba !== "socioeconomico" && Boolean(ses.interpretacion);
    const adjuntos = conInforme
      ? [
          {
            nombre: nombreDeArchivo(ses.participantNombre, prueba),
            contenido: (
              await renderToBuffer(
                InformePdfDocument({
                  data: {
                    instrumento: prueba,
                    participante: ses.participantNombre,
                    puesto: ses.puesto,
                    empresa: ses.empresa,
                    iniciada: ses.iniciada,
                    finalizada: fin,
                    interpretacion: ses.interpretacion!,
                    preliminar: true,
                  },
                }),
              )
            ).toString("base64"),
          },
        ]
      : undefined;

    const f: Fin = {
      prueba,
      inicio: ses.iniciada,
      fin,
      conInforme,
      alertas: (ses.validityFlags as string[] | null) ?? [],
      sesionId: ses.id,
    };

    if (d.cliente) {
      await enviarCorreo({
        marca: "psicologia",
        para: d.cliente.email,
        ...correoFinCliente(d, f),
        adjuntos,
        clave: `fin-cliente-${ses.id}`,
      });
    }
    await enviarCorreo({
      marca: "psicologia",
      para: correoEquipo(),
      ...correoFinEquipo(d, f),
      adjuntos,
      clave: `fin-equipo-${ses.id}`,
      responderA: d.cliente?.email,
    });
  } catch (error) {
    console.error("[avisos-evaluacion] prueba terminada:", error);
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
