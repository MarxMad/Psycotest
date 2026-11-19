import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { courseCategories, courseEnrollments, courses, users } from "@/db/schema";
import { logAudit } from "@/lib/auth";
import { canalDelCurso } from "@/app/cursos/canal";
import { CHANNELS } from "@/lib/channels";
import { enviarCorreo, plantilla, textoPlano, type Marca } from "@/lib/correo";
import { usuarioPorCorreo } from "@/lib/pagos";
import { urlDePlataforma } from "@/lib/sitio";

/**
 * Invitaciones a cursos desde el panel.
 *
 * El admin escribe uno o varios correos; cada persona queda inscrita (sin
 * pago: es una cortesía, una beca o un grupo de empresa ya cobrado aparte) y
 * recibe un correo de la marca del curso con el enlace para entrar. Si la
 * persona no tenía cuenta, se le crea una sin contraseña y entra con
 * «Entrar con mi correo».
 */

export const MAX_INVITACIONES = 200;

export type ResultadoInvitacion = {
  email: string;
  estado: "invitado" | "ya_inscrito" | "invalido";
  correo: "enviado" | "no_configurado" | "error" | "no_aplica";
};

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Separa una lista pegada (comas, saltos de línea, punto y coma) y quita repetidos. */
export function leerCorreos(texto: string): string[] {
  return [
    ...new Set(
      texto
        .split(/[\s,;]+/)
        .map((c) => c.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
}

export async function invitarACurso(opciones: {
  courseId: string;
  correos: string[];
  mensaje?: string;
  invitadoPor: { id: string; nombre: string };
}): Promise<{ ok: true; resultados: ResultadoInvitacion[] } | { ok: false; error: string; status: number }> {
  const db = getDb();
  const [curso] = await db
    .select({
      id: courses.id,
      titulo: courses.title,
      slug: courses.slug,
      subtitulo: courses.subtitle,
      canal: courseCategories.channelId,
    })
    .from(courses)
    .leftJoin(courseCategories, eq(courses.categoryId, courseCategories.id))
    .where(eq(courses.id, opciones.courseId))
    .limit(1);
  if (!curso) return { ok: false, error: "Curso no encontrado.", status: 404 };
  if (opciones.correos.length === 0) return { ok: false, error: "Escribe al menos un correo.", status: 400 };
  if (opciones.correos.length > MAX_INVITACIONES) {
    return { ok: false, error: `Máximo ${MAX_INVITACIONES} correos por envío.`, status: 400 };
  }

  const canal = canalDelCurso(curso.canal);
  const marca: Marca = canal;
  const enlace = urlDePlataforma(canal, `/cursos/${curso.slug}`);
  const mensaje = opciones.mensaje?.trim().slice(0, 2000);
  const resultados: ResultadoInvitacion[] = [];

  for (const email of opciones.correos) {
    if (!CORREO_VALIDO.test(email)) {
      resultados.push({ email, estado: "invalido", correo: "no_aplica" });
      continue;
    }

    const userId = await usuarioPorCorreo({ email, nombre: email.split("@")[0] });
    const ahora = new Date().toISOString();

    const [inscrito] = await db
      .select({ id: courseEnrollments.id })
      .from(courseEnrollments)
      .where(
        and(
          eq(courseEnrollments.userId, userId),
          eq(courseEnrollments.courseId, curso.id),
          eq(courseEnrollments.status, "active"),
        ),
      )
      .limit(1);

    if (!inscrito) {
      await db.insert(courseEnrollments).values({
        id: crypto.randomUUID(),
        userId,
        courseId: curso.id,
        status: "active",
        progressPercent: 0,
        enrolledAt: ahora,
        createdAt: ahora,
        updatedAt: ahora,
      });
      await logAudit(opciones.invitadoPor.id, "create", "enrollment", `${userId}:${curso.id}`, {
        via: "invitacion",
        email,
      });
    }

    const [usuario] = await db
      .select({ nombre: users.nombre, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const nombre = usuario && usuario.nombre !== email.split("@")[0] ? usuario.nombre.split(" ")[0] : "";

    const contenido = {
      titulo: `Te invitamos a «${curso.titulo}»`,
      intro: `${nombre ? `Hola, ${nombre}. ` : "Hola. "}${CHANNELS[canal].name} te inscribió en el curso «${curso.titulo}». Ya tienes acceso: entra cuando quieras y avanza a tu ritmo.`,
      parrafos: [
        ...(curso.subtitulo ? [curso.subtitulo] : []),
        ...(mensaje ? [mensaje] : []),
      ],
      boton: { texto: "Entrar al curso", url: enlace },
      nota: !usuario?.passwordHash
        ? "Para entrar, usa «Entrar con mi correo» con esta misma dirección: te llega un código y listo."
        : undefined,
    };

    const envio = await enviarCorreo({
      marca,
      para: email,
      asunto: `Invitación: ${curso.titulo}`,
      html: plantilla(marca, contenido),
      texto: textoPlano(marca, contenido),
    });

    resultados.push({
      email,
      estado: inscrito ? "ya_inscrito" : "invitado",
      correo: envio.ok ? "enviado" : "omitido" in envio && envio.omitido ? "no_configurado" : "error",
    });
  }

  return { ok: true, resultados };
}
