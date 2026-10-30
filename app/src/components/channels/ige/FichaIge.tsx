import Image from "next/image";
import type { CSSProperties } from "react";
import { ArrowDown, ArrowRight, Check, Clock, MessageCircle, PlayCircle, Radio } from "lucide-react";
import type { schema } from "@/db";
import { CHANNELS } from "@/lib/channels";
import { whatsapp } from "@/lib/contacto";
import { formatDuration, formatLessonDuration, levelLabel } from "@/lib/courses";
import { CourseCheckout } from "@/app/cursos/CourseCheckout";
import { TarjetaCurso, type CursoVista } from "../RejillaCursos";
import { MarcaIge, Nube } from "./Arte";
import { Cabecera, DIAGNOSTICO, Pie, Suave } from "./Marco";
import m from "./Marco.module.css";
import f from "./FichaIge.module.css";

/*
 * Ficha de un curso de IGE.
 *
 * Misma casa que la portada: cabecera flotante, cielo con el tinte del
 * bloque del catálogo y la voz en Fraunces. La columna de la derecha es la
 * ficha de compra y se queda a la vista mientras se lee el temario.
 *
 * Casi todos los cursos en vivo no tienen temario cargado —se arma sobre el
 * diagnóstico—, así que la ficha no depende de él: explica cómo se imparte
 * y, si no hay módulos, lo dice y ofrece pedirlo.
 */

type Curso = typeof schema.courses.$inferSelect;
type Categoria = typeof schema.courseCategories.$inferSelect;
type Modulo = typeof schema.courseModules.$inferSelect;
type Leccion = typeof schema.courseLessons.$inferSelect;

const COMO: Record<"vivo" | "grabado", { titulo: string; texto: string }[]> = {
  vivo: [
    { titulo: "Diagnóstico breve", texto: "Antes de la primera sesión hablamos con quien dirige el área para traer los casos reales." },
    { titulo: "Sesiones con tu equipo", texto: "En tus instalaciones o en línea, con ejercicios sobre tu propia operación." },
    { titulo: "Acuerdos por escrito", texto: "Cada sesión cierra con compromisos concretos, no con apuntes." },
    { titulo: "Constancia", texto: "Al terminar, con registro de asistencia de cada participante." },
  ],
  grabado: [
    { titulo: "Clases cortas", texto: "Lecciones que caben entre una junta y otra, con ejemplos aplicados." },
    { titulo: "A tu ritmo", texto: "El avance se guarda por lección: retomas donde te quedaste." },
    { titulo: "Desde cualquier dispositivo", texto: "Computadora, tableta o teléfono, con la misma cuenta." },
    { titulo: "Constancia", texto: "Al completar el curso, desde tu cuenta." },
  ],
};

const INCLUYE: Record<"vivo" | "grabado", string[]> = {
  vivo: ["En sitio o en línea", "Temario ajustado a tu diagnóstico", "Grupo cerrado de tu organización", "Constancia con asistencia"],
  grabado: ["Acceso desde tu cuenta", "Avance guardado por lección", "En cualquier dispositivo", "Constancia al terminar"],
};

function iniciales(nombre: string) {
  return nombre
    .split(/\s+/)
    .filter((p) => p.length > 2)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function FichaIge({
  base,
  course,
  category,
  curriculum,
  lessonCount,
  enrolled,
  stripeReady,
  priceLabel,
  thumb,
  focus,
  tinte,
  relacionados,
}: {
  base: string;
  course: Curso;
  category: Categoria | null;
  curriculum: { module: Modulo; lessons: Leccion[] }[];
  lessonCount: number;
  enrolled: boolean;
  stripeReady: boolean;
  priceLabel: string;
  thumb: string;
  focus: string;
  tinte: string;
  relacionados: { curso: CursoVista; tinte: string }[];
}) {
  const formato = course.modalidad === "online" ? "grabado" : "vivo";
  const IconoFormato = formato === "vivo" ? Radio : PlayCircle;
  const cotizar = whatsapp(`Hola, quiero cotizar el curso «${course.title}» para mi equipo.`);
  const consultar =
    course.priceMxn > 0 || formato === "vivo" ? cotizar : whatsapp(`Hola, me interesa el curso grabado «${course.title}».`);

  const datos = [
    { etiqueta: "Formato", valor: formato === "vivo" ? "En vivo" : "Grabado" },
    course.durationMinutes > 0 ? { etiqueta: "Duración", valor: formatDuration(course.durationMinutes) } : null,
    { etiqueta: "Nivel", valor: levelLabel(course.level) },
    lessonCount > 0 ? { etiqueta: "Clases", valor: String(lessonCount) } : null,
    course.estandarClave ? { etiqueta: "Estándar", valor: course.estandarClave } : null,
  ].filter((d): d is { etiqueta: string; valor: string } => d !== null);

  let numero = 0;

  return (
    <div className={`${m.tema} ${f.pagina}`} style={{ "--tinte": tinte } as CSSProperties}>
      <Suave />
      <Cabecera base={base} />

      <main>
        {/* ---------- portada ---------- */}
        <section className={f.portada}>
          <span className={`${m.nube} ${f.nubeA}`}>
            <Nube tono="lila" />
          </span>
          <span className={`${m.nube} ${f.nubeB}`}>
            <Nube tono="durazno" />
          </span>

          <div className={f.portadaCaja}>
            <nav className={f.migas} aria-label="Ruta">
              <a href={`${base}#academia`}>Cursos</a>
              <span aria-hidden>/</span>
              <span>{category?.name ?? "Catálogo"}</span>
            </nav>

            <div className={f.portadaRejilla}>
              <div>
                <p className={f.pildora}>
                  <IconoFormato size={13} aria-hidden />
                  {formato === "vivo" ? "En vivo" : "Grabado"}
                  <span aria-hidden>·</span>
                  {focus}
                </p>
                <h1 className={f.titulo}>{course.title}</h1>
                {course.subtitle && <p className={f.subtitulo}>{course.subtitle}</p>}
                <a className={f.bajar} href="#detalle">
                  Ver qué incluye
                  <ArrowDown size={15} aria-hidden />
                </a>
              </div>

              <figure className={f.foto}>
                <Image src={thumb} alt="" fill sizes="(max-width: 900px) 100vw, 46vw" priority className={f.fotoImg} />
                <MarcaIge className={f.fotoMarca} tinta="#1f2a3d" />
              </figure>
            </div>

            <dl className={f.datos}>
              {datos.map((d) => (
                <div key={d.etiqueta}>
                  <dt>{d.etiqueta}</dt>
                  <dd>{d.valor}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ---------- cuerpo y ficha de compra ---------- */}
        <div className={f.cuerpo} id="detalle">
          <article className={f.articulo}>
            <section>
              <p className={f.eyebrow}>De qué se trata</p>
              <p className={f.entrada}>{course.description}</p>
            </section>

            <section>
              <p className={f.eyebrow}>Cómo se imparte</p>
              <ol className={f.como}>
                {COMO[formato].map((paso, k) => (
                  <li key={paso.titulo}>
                    <span className={f.comoNum}>{String(k + 1).padStart(2, "0")}</span>
                    <h3>{paso.titulo}</h3>
                    <p>{paso.texto}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section id="temario">
              <p className={f.eyebrow}>Temario</p>
              {curriculum.length === 0 ? (
                <div className={f.temarioVacio}>
                  <h3>Se arma sobre tu diagnóstico</h3>
                  <p>
                    El temario con objetivos, duración y materiales se entrega en la propuesta, ajustado a lo que tu
                    equipo necesita resolver.
                  </p>
                  <a className={m.botonTintaChico} href={whatsapp(`Hola, ¿me comparten el temario de «${course.title}»?`)} target="_blank" rel="noopener noreferrer">
                    Pedir el temario
                  </a>
                </div>
              ) : (
                <>
                  <p className={f.temarioResumen}>
                    {lessonCount} clases · {formatDuration(course.durationMinutes)} · avance guardado automáticamente
                  </p>
                  <div className={f.modulos}>
                    {curriculum.map((bloque, k) => (
                      <details key={bloque.module.id} className={f.modulo} open={k === 0}>
                        <summary>
                          <span className={f.moduloNum}>Módulo {k + 1}</span>
                          <span className={f.moduloTitulo}>{bloque.module.title}</span>
                          <span className={f.moduloCuenta}>{bloque.lessons.length} clases</span>
                        </summary>
                        <ol>
                          {bloque.lessons.map((leccion) => {
                            numero += 1;
                            return (
                              <li key={leccion.id}>
                                <span className={f.leccionNum}>{numero}</span>
                                <span className={f.leccionTexto}>
                                  <strong>{leccion.title}</strong>
                                  {leccion.description && <span>{leccion.description}</span>}
                                </span>
                                <span className={f.leccionMeta}>
                                  {leccion.freePreview && <span className={f.gratis}>Gratis</span>}
                                  <Clock size={12} aria-hidden />
                                  {formatLessonDuration(leccion.durationSeconds)}
                                </span>
                              </li>
                            );
                          })}
                        </ol>
                      </details>
                    ))}
                  </div>
                </>
              )}
            </section>

            <section>
              <p className={f.eyebrow}>Quién lo imparte</p>
              <div className={f.instructor}>
                <span className={f.avatar} aria-hidden>
                  {iniciales(course.instructorName) || "IG"}
                </span>
                <div>
                  <h3>{course.instructorName}</h3>
                  <p>{course.instructorBio || CHANNELS.ige.description}</p>
                </div>
              </div>
            </section>
          </article>

          <aside className={f.lateral}>
            <div className={f.ficha}>
              <div className={f.fichaFoto}>
                <Image src={thumb} alt="" fill sizes="360px" className={f.fotoImg} />
              </div>
              {course.priceMxn > 0 ? (
                <CourseCheckout
                  courseSlug={course.slug}
                  priceLabel={priceLabel}
                  stripeReady={stripeReady}
                  enrolled={enrolled}
                  estilos={f}
                />
              ) : (
                <div className={f.checkoutBox}>
                  <p className={f.priceTag}>{formato === "vivo" ? "Precio por grupo" : "Precio a consultar"}</p>
                  <a className={f.btnPrimary} href={consultar} target="_blank" rel="noopener noreferrer">
                    {formato === "vivo" ? "Pedir cotización" : "Pedir información"}
                  </a>
                  <p className={f.checkoutHint}>
                    {formato === "vivo"
                      ? "Nos dices cuántas personas y en qué modalidad; te respondemos con un costo cerrado."
                      : "Escríbenos y te mandamos el precio y el acceso."}
                  </p>
                </div>
              )}
              <ul className={f.incluye}>
                {INCLUYE[formato].map((item) => (
                  <li key={item}>
                    <Check size={14} aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
              {course.priceMxn > 0 && (
                <a className={f.fichaGrupo} href={cotizar} target="_blank" rel="noopener noreferrer">
                  <MessageCircle size={14} aria-hidden />
                  ¿Para todo tu equipo? Cotiza por grupo
                </a>
              )}
            </div>
          </aside>
        </div>

        {/* ---------- para el equipo y relacionados ---------- */}
        <section className={f.oscuro}>
          <div className={f.oscuroCaja}>
            <div className={f.equipo}>
              <div>
                <p className={f.eyebrow}>Para tu organización</p>
                <h2>Este curso, con tu gente y tus casos.</h2>
                <p>
                  Lo llevamos a tus instalaciones o lo damos en línea para un grupo cerrado. Si no sabes por dónde
                  empezar, primero medimos.
                </p>
              </div>
              <div className={f.equipoAcciones}>
                <a className={m.botonDurazno} href={cotizar} target="_blank" rel="noopener noreferrer">
                  <MessageCircle size={16} aria-hidden />
                  Cotizar para mi equipo
                </a>
                <a className={f.botonClaro} href={DIAGNOSTICO} target="_blank" rel="noopener noreferrer">
                  Agendar diagnóstico
                </a>
              </div>
            </div>

            {relacionados.length > 0 && (
              <div className={f.relacionados}>
                <div className={f.relacionadosCabeza}>
                  <h2>Sigue con</h2>
                  <a href={`${base}#academia`}>
                    Ver el catálogo
                    <ArrowRight size={15} aria-hidden />
                  </a>
                </div>
                <div className={f.relacionadosRejilla}>
                  {relacionados.map(({ curso, tinte: t }) => (
                    <TarjetaCurso key={curso.id} curso={curso} tinte={t} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <Pie channel={CHANNELS.ige} base={base} />
    </div>
  );
}
