import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowRight, Lock } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { CHANNELS, channelPublicUrl, getChannelFromHost, type ChannelId } from "@/lib/channels";
import { SECCIONES_ALUMNO, canalDelArea } from "@/lib/area-alumno";
import { resumenDelAlumno, type CursoDelAlumno, type ResumenAlumno } from "@/lib/resumen-alumno";
import { Avance } from "./Secciones";
import s from "./inicio.module.css";

export const dynamic = "force-dynamic";

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

export default async function MiCuentaInicio() {
  const user = await getSessionUser();
  if (!user) redirect("/acceso?next=/mi-cuenta");

  const host = (await headers()).get("host");
  const canal = canalDelArea(getChannelFromHost(host)?.id ?? null);
  const r = await resumenDelAlumno(user.id);
  const nombre = user.nombre.split(" ")[0];

  // Dominio sin marca: el layout ya mandó a cada quien a su sitio. Si llega
  // aquí es que no tiene nada en ninguna empresa; no se nombra ninguna.
  if (canal === "martin") {
    return (
      <>
        <header className={s.saludo}>
          <p className={s.kicker}>Mi cuenta</p>
          <h1>Hola, {nombre}.</h1>
        </header>
        <SinAcceso />
      </>
    );
  }

  // ---------------------------------------------------------------- tablero de una marca
  // Psicología Aplicada solo muestra sus pruebas; los cursos son de las otras.
  const cursos = canal === "psicologia" ? [] : r.cursos.filter((c) => c.canal === canal);
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

    </>
  );
}

function SinAcceso({
  texto = "Cuando compres o alguien te invite, lo verás aquí.",
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
