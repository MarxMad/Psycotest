import Link from "next/link";
import { ArrowRight, Award, BookOpen, LogIn, PlayCircle } from "lucide-react";
import { categoriaDesdeTexto } from "@/lib/ceduct/config";
import { RUTAS } from "@/lib/ceduct/rutas";
import { Imagen } from "../Imagen";
import { Portada } from "../Portada";
import s from "../mk.module.css";
import p from "./paginas.module.css";

export type CursoInscrito = {
  id: string;
  slug: string;
  titulo: string;
  subtitulo: string | null;
  instructor: string;
  imagen: string | null;
  categoria: string | null;
  estado: string;
  porcentaje: number;
  hechas: number;
  total: number;
};

export function MisCursos({
  nombre,
  cursos,
  area,
}: {
  nombre: string | null;
  cursos: CursoInscrito[] | null;
  /**
   * Inicio de su zona de CEDUCT (expediente, constancias), o null si todavía
   * no tiene nada ahí: sin contenido, /mi-cuenta muestra la página genérica
   * de la plataforma, con las demás marcas.
   */
  area: string | null;
}) {
  // Sin sesión: invitación a entrar.
  if (cursos === null) {
    return (
      <div className={`${s.contenedor} ${p.misVacio}`}>
        <div className={`${s.tarjeta} ${p.misCaja}`}>
          <span className={p.misIcono}><LogIn size={30} aria-hidden /></span>
          <h1 className={p.titulo}>Mis cursos</h1>
          <p className={s.lead}>Inicia sesión para entrar a tus programas, ver tu avance y descargar tus constancias.</p>
          <div className={p.empresasBotones}>
            <Link href={`${RUTAS.acceso}?next=${encodeURIComponent(RUTAS.misCursos)}`} className={`${s.btn} ${s.btnPrimario} ${s.btnGrande}`}>
              Iniciar sesión <ArrowRight size={18} aria-hidden />
            </Link>
            <Link href={RUTAS.catalogo()} className={`${s.btn} ${s.btnSecundario} ${s.btnGrande}`}>
              Explorar el catálogo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const activos = cursos.filter((c) => c.estado !== "completed");
  const terminados = cursos.filter((c) => c.estado === "completed" || (c.total > 0 && c.hechas >= c.total));

  return (
    <div className={`${s.contenedor} ${p.mis}`}>
      <header className={p.misCabecera}>
        <div>
          <p className={s.eyebrow}>Mi aprendizaje</p>
          <h1 className={p.titulo}>{nombre ? `Hola, ${nombre.split(" ")[0]}.` : "Mis cursos"}</h1>
        </div>
        <ul className={p.misResumen}>
          <li><BookOpen size={18} aria-hidden /><strong>{activos.length}</strong> en curso</li>
          <li><Award size={18} aria-hidden /><strong>{terminados.length}</strong> concluidos</li>
        </ul>
      </header>

      {cursos.length === 0 ? (
        <div className={`${s.tarjeta} ${p.misCaja}`}>
          <h2 className={p.formTitulo}>Aún no tienes programas.</h2>
          <p className={s.lead}>Cuando completes una compra, tu programa aparece aquí al instante (o en cuanto se confirme tu pago).</p>
          <Link href={RUTAS.catalogo()} className={`${s.btn} ${s.btnPrimario} ${s.btnGrande}`}>
            Explorar el catálogo <ArrowRight size={18} aria-hidden />
          </Link>
        </div>
      ) : (
        <ul className={p.misLista}>
          {cursos.map((c) => {
            const pct = Math.round(c.porcentaje);
            const pendiente = c.estado === "pending";
            return (
              <li key={c.id} className={`${s.tarjeta} ${p.misCurso}`}>
                <Imagen
                  src={c.imagen}
                  alt=""
                  className={p.misMedia}
                  respaldo={<Portada slug={c.slug} categoria={categoriaDesdeTexto(c.categoria)} />}
                />
                <div className={p.misTexto}>
                  <p className={p.misInstructor}>{c.instructor}</p>
                  <h2>{c.titulo}</h2>
                  {c.total > 0 && (
                    <div className={p.barra}>
                      <div
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Avance de ${c.titulo}`}
                      >
                        <span style={{ width: `${pct}%` }} />
                      </div>
                      <small>{pct}% · {c.hechas} de {c.total} lecciones</small>
                    </div>
                  )}
                </div>
                {pendiente ? (
                  <span className={`${s.chip} ${s.chipSuave}`}>Pago en revisión</span>
                ) : (
                  <Link href={`/cursos/${c.slug}/aprender`} className={`${s.btn} ${s.btnPrimario}`}>
                    <PlayCircle size={18} aria-hidden /> {c.hechas > 0 ? "Continuar" : "Empezar"}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {area && (
        <p className={s.meta} style={{ marginTop: 32 }}>
          ¿Buscas tus constancias o expediente? Están en <Link href={area}>tu cuenta</Link>.
        </p>
      )}
    </div>
  );
}
