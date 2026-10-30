import Link from "next/link";
import {
  Award,
  BarChart3,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  MapPin,
  ShieldCheck,
  Timer,
} from "lucide-react";
import { categoriaPorSlug } from "@/lib/ceduct/config";
import { RUTAS } from "@/lib/ceduct/rutas";
import {
  MODALIDAD_LABEL,
  NIVEL_LABEL,
  TIPO_LABEL,
  TIPO_PLURAL,
  fechaCorta,
  iniciales,
  precio,
  type Programa,
} from "@/lib/ceduct/tipos";
import { Acordeon } from "../Acordeon";
import { BotonAgregar, BotonComprarAhora } from "../BotonesCompra";
import { Imagen } from "../Imagen";
import { Portada } from "../Portada";
import { Revelar } from "../Revelar";
import { TarjetaPrograma } from "../TarjetaPrograma";
import { CertificadoMuestra } from "./CertificadoMuestra";
import s from "../mk.module.css";
import f from "./ficha.module.css";

export function Ficha({ programa: p, relacionados }: { programa: Programa; relacionados: Programa[] }) {
  const cat = categoriaPorSlug(p.categoria);
  const quedan = p.cupo === null ? null : Math.max(0, p.cupo - p.vendidos);
  const agotado = quedan === 0;
  const totalLecciones = p.temario.reduce((n, m) => n + m.lecciones.length, 0);

  const badges = [
    { Icono: Timer, label: "Duración", valor: p.duracion },
    ...(p.horas > 0 ? [{ Icono: Clock, label: "Horas", valor: `${p.horas} h` }] : []),
    { Icono: MapPin, label: "Modalidad", valor: MODALIDAD_LABEL[p.modalidad] },
    { Icono: BarChart3, label: "Nivel", valor: NIVEL_LABEL[p.nivel] },
    { Icono: CalendarDays, label: "Inicio", valor: fechaCorta(p.fechaInicio) },
  ];

  const incluye =
    p.tipo === "certificacion"
      ? ["Taller de alineación al estándar", "Revisión de evidencias", "Evaluación con evaluador certificado", "Certificado oficial SEP-CONOCER"]
      : ["Acceso a la plataforma y materiales", "Proyectos con retroalimentación", "Constancia con valor curricular", "Acompañamiento del instructor"];

  return (
    <>
      {/* -------------------------------------------------- Encabezado */}
      <header className={f.encabezado}>
        <Imagen
          src={p.imagen}
          alt=""
          prioridad
          className={f.encabezadoMedia}
          respaldo={<Portada slug={p.slug} categoria={p.categoria} etiqueta={p.estandarClave} />}
        />
        <div className={f.encabezadoVelo} aria-hidden />
        <div className={`${s.contenedor} ${f.encabezadoTexto}`}>
          <nav aria-label="Ruta de navegación" className={f.miga}>
            <ol>
              <li><Link href={RUTAS.inicio()}>Inicio</Link></li>
              <li><ChevronRight size={14} aria-hidden /><Link href={RUTAS.catalogo({ tipo: p.tipo })}>{TIPO_PLURAL[p.tipo]}</Link></li>
              <li><ChevronRight size={14} aria-hidden /><span aria-current="page">{p.titulo}</span></li>
            </ol>
          </nav>
          <div className={f.chips}>
            <span className={`${s.chip} ${p.tipo === "certificacion" ? s.chipNaranja : ""}`}>{TIPO_LABEL[p.tipo]}</span>
            <span className={`${s.chip} ${s.chipSuave}`}>{cat.nombre}</span>
            {p.estandarClave && <span className={`${s.chip} ${s.chipSuave}`}>{p.estandarClave}</span>}
          </div>
          <h1 className={f.titulo}>{p.titulo}</h1>
          {p.subtitulo && <p className={f.subtitulo}>{p.subtitulo}</p>}
        </div>
      </header>

      <div className={`${s.contenedor} ${f.badges}`}>
        <ul aria-label="Datos del programa">
          {badges.map(({ Icono, label, valor }) => (
            <li key={label}>
              <Icono size={20} aria-hidden />
              <span>
                <small>{label}</small>
                <strong>{valor}</strong>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* ------------------------------------------------------ Cuerpo */}
      <div className={`${s.contenedor} ${f.rejilla}`}>
        <div className={f.principal}>
          <Revelar className={f.bloque}>
            <h2 className={f.h2}>De qué trata</h2>
            <p className={f.parrafo}>{p.descripcion}</p>
          </Revelar>

          {p.temario.length > 0 && (
            <Revelar className={f.bloque}>
              <div className={f.bloqueCabecera}>
                <h2 className={f.h2}>Temario</h2>
                <p className={s.meta}>
                  {p.temario.length} módulos{totalLecciones ? ` · ${totalLecciones} temas` : ""}
                </p>
              </div>
              <Acordeon
                abiertoInicial={0}
                items={p.temario.map((m, i) => ({
                  numero: String(i + 1).padStart(2, "0"),
                  titulo: m.titulo,
                  extra: m.lecciones.length ? `${m.lecciones.length} temas` : undefined,
                  contenido: m.lecciones.length ? (
                    <ul className={f.lecciones}>
                      {m.lecciones.map((l) => <li key={l}>{l}</li>)}
                    </ul>
                  ) : (
                    <p>Contenido en preparación.</p>
                  ),
                }))}
              />
            </Revelar>
          )}

          {(p.dirigidoA.length > 0 || p.requisitos.length > 0) && (
            <Revelar className={`${f.bloque} ${f.dos}`}>
              {p.dirigidoA.length > 0 && (
                <section className={`${s.tarjeta} ${f.lista}`} aria-labelledby="dirigido">
                  <h2 id="dirigido" className={f.h3}>¿A quién va dirigido?</h2>
                  <ul>
                    {p.dirigidoA.map((x) => <li key={x}><Check size={18} aria-hidden />{x}</li>)}
                  </ul>
                </section>
              )}
              {p.requisitos.length > 0 && (
                <section className={`${s.tarjeta} ${f.lista}`} aria-labelledby="requisitos">
                  <h2 id="requisitos" className={f.h3}>Requisitos</h2>
                  <ul>
                    {p.requisitos.map((x) => <li key={x}><Check size={18} aria-hidden />{x}</li>)}
                  </ul>
                </section>
              )}
            </Revelar>
          )}

          {p.instructores.length > 0 && (
            <Revelar className={f.bloque}>
              <h2 className={f.h2}>{p.instructores.length > 1 ? "Instructores" : "Instructor"}</h2>
              <ul className={f.instructores}>
                {p.instructores.map((i) => (
                  <li key={i.nombre} className={s.tarjeta}>
                    {i.foto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={i.foto} alt={`Foto de ${i.nombre}`} className={f.foto} loading="lazy" />
                    ) : (
                      <span className={f.foto} role="img" aria-label={`Iniciales de ${i.nombre}`}>
                        {iniciales(i.nombre)}
                      </span>
                    )}
                    <div>
                      <h3 className={f.h3}>{i.nombre}</h3>
                      <p className={f.cargo}>{i.cargo}</p>
                      {i.bio && <p className={f.parrafo}>{i.bio}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </Revelar>
          )}

          <Revelar className={f.bloque}>
            <h2 className={f.h2}>{p.tipo === "certificacion" ? "Tu certificado" : "Tu constancia"}</h2>
            <p className={f.parrafo}>
              {p.tipo === "certificacion"
                ? "Al resultar competente recibes el certificado oficial SEP-CONOCER, con folio verificable en línea y validez en todo el país."
                : "Al acreditar el diplomado recibes una constancia digital con folio y código QR que cualquier empleador puede verificar."}
            </p>
            <CertificadoMuestra programa={p} />
          </Revelar>
        </div>

        {/* ------------------------------------------------ Compra */}
        <aside className={f.compra} aria-label="Comprar">
          <div className={`${s.tarjeta} ${f.compraCaja}`}>
            <p className={f.precio}>
              <strong>{precio(p.precioMxn)}</strong>
              {p.precioAntesMxn && p.precioAntesMxn > p.precioMxn && (
                <del><span className={s.visualmenteOculto}>Antes </span>{precio(p.precioAntesMxn)}</del>
              )}
            </p>
            {p.precioMxn > 0 && <p className={s.meta}>MXN · IVA incluido · Pago único</p>}

            {quedan !== null && quedan > 0 && quedan <= 8 && <p className={f.cupo}>Quedan {quedan} lugares</p>}

            {agotado ? (
              <p className={f.agotado}>Grupo lleno. Escríbenos para apartar lugar en el siguiente.</p>
            ) : (
              <div className={f.botones}>
                <BotonAgregar programa={p} bloque />
                <BotonComprarAhora programa={p} bloque />
              </div>
            )}

            <ul className={f.incluye}>
              {incluye.map((x) => <li key={x}><Check size={16} aria-hidden />{x}</li>)}
            </ul>
            <p className={f.garantia}>
              <ShieldCheck size={18} aria-hidden /> Pago seguro · Factura disponible
            </p>
            {p.estandarClave && (
              <p className={f.garantia}>
                <Award size={18} aria-hidden /> Alineado al estándar {p.estandarClave}
              </p>
            )}
          </div>
        </aside>
      </div>

      {/* --------------------------------------------- Relacionados */}
      {relacionados.length > 0 && (
        <section className={`${s.seccion} ${s.seccionAlt}`} aria-labelledby="rel-titulo">
          <div className={s.contenedor}>
            <div className={s.cabeceraSeccion}>
              <div>
                <p className={s.eyebrow}>También te puede interesar</p>
                <h2 id="rel-titulo" className={s.h2}>Programas relacionados.</h2>
              </div>
            </div>
            <ul className={f.relacionados}>
              {relacionados.map((r, i) => (
                <Revelar como="li" key={r.id} retraso={i * 80}>
                  <TarjetaPrograma programa={r} />
                </Revelar>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Barra de compra fija en móvil */}
      {!agotado && p.precioMxn > 0 && (
        <div className={f.barraMovil}>
          <p>
            <strong>{precio(p.precioMxn)}</strong>
            <small>IVA incluido</small>
          </p>
          <BotonAgregar programa={p} compacto />
        </div>
      )}
    </>
  );
}
