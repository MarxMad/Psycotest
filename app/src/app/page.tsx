import type { Metadata } from "next";
import Link from "next/link";
import { sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import { getSessionUser } from "@/lib/auth";
import { CHANNELS, channelPublicUrl, type ChannelId } from "@/lib/channels";
import h from "./hub.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Índice de marcas",
  robots: { index: false, follow: false },
};

const ORDEN: ChannelId[] = ["ceduct", "psicologia", "ige", "martin"];

/** Sección del panel donde se administra cada marca. */
const PANEL: Record<ChannelId, { href: string; label: string }> = {
  ceduct: { href: "/admin/expedientes", label: "Expedientes" },
  psicologia: { href: "/admin/pruebas", label: "Pruebas" },
  ige: { href: "/admin/cursos", label: "Cursos" },
  martin: { href: "/admin/canales/martin", label: "Contenido" },
};

type Cifras = {
  expedientes: number;
  certificados: number;
  sesiones: number;
  codigos: number;
  cursosIge: number;
  inscritos: number;
};

async function cargarCifras(): Promise<Cifras | null> {
  try {
    // Una sola consulta: el pool es corto y seis viajes lo saturan.
    const [f] = await getDb().execute<Cifras>(sql`
      select
        (select count(*) from student_expedientes)                      as expedientes,
        (select count(*) from course_certificates
          where revoked_at is null)                                     as certificados,
        (select count(*) from assessment_sessions)                      as sesiones,
        (select count(*) from access_codes where active = true)         as codigos,
        (select count(*) from courses c
          join course_categories cat on cat.id = c.category_id
          where c.status = 'published' and cat.channel_id = 'ige')      as cursos_ige,
        (select count(*) from course_enrollments)                       as inscritos
    `);
    const n = (v: unknown) => Number(v ?? 0);
    return {
      expedientes: n(f?.expedientes),
      certificados: n(f?.certificados),
      sesiones: n(f?.sesiones),
      codigos: n(f?.codigos),
      cursosIge: n((f as unknown as Record<string, unknown>)?.cursos_ige),
      inscritos: n(f?.inscritos),
    };
  } catch (error) {
    console.error("[indice] no se pudieron leer las cifras:", error);
    return null;
  }
}

/** Qué mostrar de cada marca. Sin datos, no se inventa nada. */
function resumen(canal: ChannelId, c: Cifras | null): { valor: string; etiqueta: string }[] {
  if (!c) return [];
  switch (canal) {
    case "ceduct":
      return [
        { valor: String(c.expedientes), etiqueta: "expedientes" },
        { valor: String(c.certificados), etiqueta: "constancias" },
      ];
    case "psicologia":
      return [
        { valor: String(c.sesiones), etiqueta: "evaluaciones" },
        { valor: String(c.codigos), etiqueta: "códigos activos" },
      ];
    case "ige":
      return [
        { valor: String(c.cursosIge), etiqueta: "cursos" },
        { valor: String(c.inscritos), etiqueta: "inscritos" },
      ];
    case "martin":
      return [];
  }
}

export default async function IndicePage() {
  const user = await getSessionUser();
  const cifras = await cargarCifras();

  return (
    <div className={h.pagina}>
      <header className={h.cabecera}>
        <div className={h.cabeceraInterior}>
          <div>
            <p className={h.eyebrow}>Índice interno</p>
            <h1 className={h.titulo}>Martín Hernández González</h1>
          </div>
          <div className={h.cabeceraAcciones}>
            {user && <span className={h.quien}>{user.nombre}</span>}
            <Link href="/admin" className={h.botonPanel}>
              Panel de administración
            </Link>
          </div>
        </div>
      </header>

      <main className={h.principal}>
        <p className={h.intro}>
          Las cuatro marcas operan como sitios independientes y se administran desde un solo panel.
          Esta página no es pública.
        </p>

        <ul className={h.lista}>
          {ORDEN.map((id) => {
            const canal = CHANNELS[id];
            const datos = resumen(id, cifras);
            return (
              <li key={id} className={h.fila} data-canal={id}>
                <div className={h.filaTexto}>
                  <p className={h.rol}>{canal.accentLabel}</p>
                  <h2 className={h.nombre}>{canal.name}</h2>
                  <p className={h.descripcion}>{canal.description}</p>
                </div>

                {/* La columna se reserva aunque la marca no tenga cifras,
                    para que los botones queden alineados entre filas. */}
                <dl className={h.cifras}>
                  {datos.map((d) => (
                    <div key={d.etiqueta}>
                      <dt>{d.valor}</dt>
                      <dd>{d.etiqueta}</dd>
                    </div>
                  ))}
                </dl>

                <div className={h.acciones}>
                  <a className={h.accionPrimaria} href={channelPublicUrl(id)}>
                    Ver sitio
                  </a>
                  <Link className={h.accionSecundaria} href={PANEL[id].href}>
                    {PANEL[id].label}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>

        {!cifras && (
          <p className={h.aviso}>
            No se pudieron leer las cifras de la base en este momento. Los enlaces siguen
            funcionando.
          </p>
        )}
      </main>
    </div>
  );
}
