import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowRight, ArrowUpRight, Lock } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { CHANNELS, channelPublicUrl, getChannelFromHost, type ChannelId } from "@/lib/channels";
import { SECCIONES_ALUMNO, canalDelArea } from "@/lib/area-alumno";
import { LOGO_DE_MARCA } from "@/lib/logos-marca";
import { resumenDelAlumno, type CursoDelAlumno, type ResumenAlumno } from "@/lib/resumen-alumno";
import { Avance } from "./Secciones";
import s from "./inicio.module.css";

export const dynamic = "force-dynamic";

const MARCAS: ChannelId[] = ["psicologia", "ceduct", "ige"];

/** Qué vende cada marca, en palabras de quien compra. */
const QUE_OFRECE: Record<ChannelId, { texto: string; catalogo: string; cta: string }> = {
  psicologia: {
    texto: "Pruebas psicométricas en línea con informe de un psicólogo.",
    catalogo: "/#cotizador",
    cta: "Cotizar evaluaciones",
  },
  ceduct: {
    texto: "Diplomados y certificación de competencias con validez oficial.",
    catalogo: "/diplomados",
    cta: "Ver diplomados",
  },
  ige: {
    texto: "Cursos y capacitación para equipos de trabajo.",
    catalogo: "/cursos",
    cta: "Ver cursos",
  },
  martin: { texto: "", catalogo: "/", cta: "" },
};

type Cifra = { valor: string; etiqueta: string };

function cifrasDe(canal: ChannelId, r: ResumenAlumno, cursos: CursoDelAlumno[]): Cifra[] {
  const promedio = cursos.length
    ? Math.round(cursos.reduce((n, c) => n + c.porcentaje, 0) / cursos.length)
    : 0;
  if (canal === "psicologia") {
    const lista: Cifra[] = [
      { valor: String(r.evaluaciones.codigos), etiqueta: r.evaluaciones.codigos === 1 ? "Código activo" : "Códigos activos" },
      { valor: `${r.evaluaciones.usadas}/${r.evaluaciones.capacidad}`, etiqueta: "Aplicaciones usadas" },
      { valor: String(r.evaluaciones.terminadas), etiqueta: "Pruebas terminadas" },
    ];
    if (cursos.length) lista.push({ valor: String(cursos.length), etiqueta: "Diplomados" });
    return lista;
  }
  if (canal === "ceduct") {
    return [
      { valor: String(cursos.length), etiqueta: cursos.length === 1 ? "Programa" : "Programas" },
      { valor: String(r.expedientes.total), etiqueta: "Expedientes de certificación" },
      { valor: String(r.constancias), etiqueta: r.constancias === 1 ? "Constancia" : "Constancias" },
    ];
  }
  return [
    { valor: String(cursos.length), etiqueta: cursos.length === 1 ? "Curso" : "Cursos" },
    { valor: `${promedio}%`, etiqueta: "Avance promedio" },
    { valor: String(cursos.reduce((n, c) => n + c.hechas, 0)), etiqueta: "Lecciones completadas" },
  ];
}

function dominio(url: string) {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default async function MiCuentaInicio() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/mi-cuenta");

  const host = (await headers()).get("host");
  const canal = canalDelArea(getChannelFromHost(host)?.id ?? null);
  const r = await resumenDelAlumno(user.id);
  const nombre = user.nombre.split(" ")[0];

  const otras = MARCAS.filter((m) => m !== canal && r.conteo[m] > 0);

  // ---------------------------------------------------------------- tablero del grupo
  if (canal === "martin") {
    const conAlgo = MARCAS.filter((m) => r.conteo[m] > 0);
    return (
      <>
        <header className={s.saludo}>
          <p className={s.kicker}>Mi cuenta</p>
          <h1>Hola, {nombre}.</h1>
          <p>
            {conAlgo.length
              ? "Esto es lo que tienes en cada una de nuestras escuelas. Cada una vive en su propio sitio: entra con este mismo correo."
              : "Tu cuenta está creada, pero todavía no tienes acceso a ningún curso, diplomado ni evaluación."}
          </p>
        </header>
        {!conAlgo.length && <SinAcceso />}
        <div className={s.marcas}>
          {(conAlgo.length ? conAlgo : MARCAS).map((m) => (
            <TarjetaMarca
              key={m}
              canal={m}
              tiene={r.conteo[m] > 0}
              detalle={conAlgo.length ? lineaDe(m, r) : QUE_OFRECE[m].texto}
            />
          ))}
        </div>
      </>
    );
  }

  // ---------------------------------------------------------------- tablero de una marca
  const cursos = r.cursos.filter((c) => c.canal === canal);
  const tieneAqui = r.conteo[canal] > 0;
  const oferta = QUE_OFRECE[canal];
  const secciones = SECCIONES_ALUMNO[canal];
  const enCurso = [...cursos].sort((a, b) => (a.porcentaje >= 100 ? 1 : 0) - (b.porcentaje >= 100 ? 1 : 0) || b.porcentaje - a.porcentaje);

  return (
    <>
      <header className={s.saludo}>
        <p className={s.kicker}>{CHANNELS[canal].name}</p>
        <h1>Hola, {nombre}.</h1>
        <p>
          {tieneAqui
            ? "Aquí tienes todo lo que contrataste, con tu avance al día."
            : `Todavía no tienes acceso a nada de ${CHANNELS[canal].name}.`}
        </p>
      </header>

      {tieneAqui ? (
        <>
          <dl className={s.cifras}>
            {cifrasDe(canal, r, cursos).map((c) => (
              <div key={c.etiqueta} className={s.cifra}>
                <dt>{c.etiqueta}</dt>
                <dd>{c.valor}</dd>
              </div>
            ))}
          </dl>

          {enCurso.length > 0 && (
            <section className={s.bloque}>
              <h2>Continúa donde te quedaste</h2>
              <ul className={s.continuar}>
                {enCurso.slice(0, 4).map((c) => (
                  <li key={c.id}>
                    <Link href={`/cursos/${c.slug}/aprender`} className={s.curso}>
                      <span className={s.cursoTitulo}>{c.titulo}</span>
                      {c.total > 0 ? <Avance porcentaje={c.porcentaje} /> : <span className={s.cursoMeta}>Listo para empezar</span>}
                      <span className={s.cursoIr}>
                        {c.porcentaje >= 100 ? "Repasar" : c.hechas > 0 ? "Continuar" : "Empezar"}
                        <ArrowRight size={15} aria-hidden />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className={s.bloque}>
            <h2>Tus secciones</h2>
            <div className={s.secciones}>
              {secciones.map((sec) => (
                <Link key={sec.href} href={sec.href} className={s.seccion}>
                  <strong>{sec.label}</strong>
                  <span>{sec.descripcion}</span>
                  <ArrowRight size={16} aria-hidden className={s.seccionFlecha} />
                </Link>
              ))}
            </div>
          </section>
        </>
      ) : (
        <SinAcceso
          texto={`Cuando compres ${canal === "psicologia" ? "una evaluación" : canal === "ceduct" ? "un diplomado o una certificación" : "un curso"} o te inviten, aparecerá aquí con tu avance.`}
          accion={{ href: channelPublicUrl(canal, oferta.catalogo), texto: oferta.cta }}
        />
      )}

      {otras.length > 0 && (
        <section className={s.bloque}>
          <h2>También tienes contenido en</h2>
          <p className={s.nota}>
            Cada escuela tiene su propio sitio. Al entrar, inicia sesión con este mismo correo.
          </p>
          <div className={s.marcas}>
            {otras.map((m) => (
              <TarjetaMarca key={m} canal={m} tiene detalle={lineaDe(m, r)} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

/** Una línea con lo que la persona tiene en esa marca. */
function lineaDe(canal: ChannelId, r: ResumenAlumno): string {
  const cursos = r.cursos.filter((c) => c.canal === canal).length;
  const partes: string[] = [];
  if (canal === "psicologia" && r.evaluaciones.codigos) {
    partes.push(`${r.evaluaciones.codigos} código${r.evaluaciones.codigos === 1 ? "" : "s"} de evaluación`);
  }
  if (canal === "ceduct" && r.expedientes.total) {
    partes.push(`${r.expedientes.total} expediente${r.expedientes.total === 1 ? "" : "s"} de certificación`);
  }
  if (cursos) {
    const palabra = canal === "ige" ? "curso" : canal === "ceduct" ? "programa" : "diplomado";
    partes.push(`${cursos} ${palabra}${cursos === 1 ? "" : "s"}`);
  }
  return partes.join(" · ") || "Contenido disponible";
}

function TarjetaMarca({ canal, tiene, detalle }: { canal: ChannelId; tiene: boolean; detalle: string }) {
  const url = channelPublicUrl(canal, tiene ? "/mi-cuenta" : "/");
  return (
    <a href={url} className={s.marca} data-canal={canal} style={CHANNELS[canal].theme.vars as React.CSSProperties}>
      <img src={LOGO_DE_MARCA[canal]} alt="" className={s.marcaLogo} />
      <span className={s.marcaTexto}>
        <strong>{CHANNELS[canal].name}</strong>
        <span>{detalle}</span>
        <small>{dominio(url)}</small>
      </span>
      <span className={s.marcaIr}>
        {tiene ? "Entrar" : "Conocer"} <ArrowUpRight size={15} aria-hidden />
      </span>
    </a>
  );
}

function SinAcceso({
  texto = "Cuando compres un curso, un diplomado o una evaluación —o alguien te invite— lo verás aquí.",
  accion,
}: {
  texto?: string;
  accion?: { href: string; texto: string };
}) {
  return (
    <div className={s.sinAcceso}>
      <span className={s.candado} aria-hidden>
        <Lock size={22} />
      </span>
      <div>
        <h2>No tienes acceso todavía</h2>
        <p>{texto}</p>
        <p className={s.nota}>
          ¿Ya pagaste o te invitaron? Revisa que hayas entrado con el mismo correo de la compra o de la invitación.
        </p>
      </div>
      {accion && (
        <a href={accion.href} className={s.sinAccesoBoton}>
          {accion.texto} <ArrowRight size={16} aria-hidden />
        </a>
      )}
    </div>
  );
}
