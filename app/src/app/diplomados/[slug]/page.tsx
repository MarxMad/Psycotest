import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Award, Clock, GraduationCap, MapPin } from "lucide-react";
import {
  MODALIDAD_LABEL,
  NIVEL_LABEL,
  obtenerDiplomado,
  precioMxn,
  temarioDe,
} from "@/lib/diplomados";
import { BotonAgregar } from "@/components/ceduct/BotonAgregar";
import { CeductShell } from "@/components/ceduct/CeductShell";
import { Revelar } from "@/components/ceduct/Revelar";
import s from "@/components/ceduct/ceduct.module.css";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const d = await obtenerDiplomado(slug);
  if (!d) return { title: "Diplomado no encontrado" };
  return {
    title: `${d.titulo} — CEDUCT`,
    description: d.subtitulo ?? d.descripcion.slice(0, 160),
  };
}

export default async function DiplomadoPage({ params }: Props) {
  const { slug } = await params;
  const d = await obtenerDiplomado(slug);
  if (!d) notFound();

  const temario = await temarioDe(d.id);
  const quedan = d.cupo === null ? null : Math.max(0, d.cupo - d.vendidos);

  return (
    <CeductShell>
      <article className={s.detalle}>
        <nav className={s.miga} aria-label="Ruta">
          <Link href="/diplomados">Diplomados</Link>
          <span aria-hidden>/</span>
          <span>{d.titulo}</span>
        </nav>

        <div className={s.detalleRejilla}>
          <div className={s.detallePrincipal}>
            <Revelar>
              {d.categoria && <p className={s.eyebrow}>{d.categoria}</p>}
              <h1 className={s.detalleTitulo}>{d.titulo}</h1>
              {d.subtitulo && <p className={s.detalleSub}>{d.subtitulo}</p>}

              <ul className={s.detalleDatos}>
                <li>
                  <Clock size={16} aria-hidden /> {d.horas} horas
                </li>
                <li>
                  <MapPin size={16} aria-hidden /> {MODALIDAD_LABEL[d.modalidad]}
                </li>
                <li>
                  <GraduationCap size={16} aria-hidden /> {NIVEL_LABEL[d.nivel]}
                </li>
                {d.estandarClave && (
                  <li>
                    <Award size={16} aria-hidden /> Prepara para {d.estandarClave}
                  </li>
                )}
              </ul>
            </Revelar>

            <Revelar retraso={120}>
              <section className={s.bloque}>
                <h2>De qué trata</h2>
                <p className={s.parrafo}>{d.descripcion}</p>
              </section>
            </Revelar>

            {temario.length > 0 && (
              <Revelar retraso={200}>
                <section className={s.bloque}>
                  <h2>Temario</h2>
                  <ol className={s.temario}>
                    {temario.map((m, i) => (
                      <li key={m.titulo}>
                        <span className={s.temarioNum}>{String(i + 1).padStart(2, "0")}</span>
                        <div>
                          <h3>{m.titulo}</h3>
                          {m.lecciones.length > 0 && (
                            <ul>
                              {m.lecciones.map((l) => (
                                <li key={l}>{l}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              </Revelar>
            )}

            {d.estandarClave && (
              <Revelar retraso={260}>
                <section className={`${s.bloque} ${s.bloqueDestacado}`}>
                  <h2>Qué sigue después</h2>
                  <p className={s.parrafo}>
                    Al terminar puedes presentar la evaluación del estándar {d.estandarClave} con
                    CEDUCT, entidad acreditada con clave ECE 002-10. Tu constancia queda verificable
                    públicamente.
                  </p>
                  <Link href="/sites/ceduct#proceso" className={s.enlaceInterno}>
                    Ver el proceso de certificación →
                  </Link>
                </section>
              </Revelar>
            )}
          </div>

          <aside className={s.compra}>
            <div className={s.compraCaja}>
              {d.imagen && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.imagen} alt="" className={s.compraImagen} />
              )}
              <p className={s.compraPrecio}>{precioMxn(d.precioMxn)}</p>
              <p className={s.compraNota}>
                {d.horas} horas · {MODALIDAD_LABEL[d.modalidad]}
              </p>

              {quedan !== null && quedan <= 5 && quedan > 0 && (
                <p className={s.compraCupo}>Quedan {quedan} lugares</p>
              )}
              {quedan === 0 ? (
                <p className={s.compraAgotado}>Generación llena. Escríbenos para la siguiente.</p>
              ) : (
                <BotonAgregar diplomado={d} />
              )}

              <ul className={s.compraIncluye}>
                <li>Constancia al concluir</li>
                <li>Material y seguimiento de avance</li>
                <li>Acompañamiento hasta la evaluación</li>
              </ul>
            </div>
          </aside>
        </div>
      </article>
    </CeductShell>
  );
}
