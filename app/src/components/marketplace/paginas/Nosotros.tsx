import Link from "next/link";
import { ArrowRight, BadgeCheck, ClipboardCheck, FileSearch, GraduationCap, Handshake, Scale, Target } from "lucide-react";
import { RESPALDO } from "@/lib/ceduct/config";
import { RUTAS } from "@/lib/ceduct/rutas";
import { Revelar } from "../Revelar";
import s from "../mk.module.css";
import p from "./paginas.module.css";

const VALORES = [
  { Icono: Target, titulo: "Competencia, no sólo teoría", texto: "Medimos lo que sabes hacer en el trabajo real, con estándares nacionales." },
  { Icono: Scale, titulo: "Evaluación imparcial", texto: "Evaluadores certificados y criterios públicos: el dictamen depende de tus evidencias." },
  { Icono: Handshake, titulo: "Acompañamiento", texto: "Desde la inscripción hasta tu certificado, alguien de CEDUCT responde por tu proceso." },
];

const PROCESO = [
  { Icono: FileSearch, titulo: "Diagnóstico", texto: "Revisamos tu experiencia contra el estándar." },
  { Icono: GraduationCap, titulo: "Alineación", texto: "Taller para preparar tus evidencias." },
  { Icono: ClipboardCheck, titulo: "Evaluación", texto: "Demuestras tu desempeño ante un evaluador." },
  { Icono: BadgeCheck, titulo: "Certificado", texto: "SEP-CONOCER emite tu certificado oficial." },
];

export function Nosotros() {
  return (
    <>
      <section className={p.heroSimple}>
        <div className={s.contenedor}>
          <p className={s.eyebrow}>Nosotros</p>
          <h1 className={p.tituloGrande}>
            Formamos y certificamos el talento que <span>mueve a México.</span>
          </h1>
          <p className={s.lead}>
            CEDUCT —Centro de Educación y Capacitación para los Trabajadores, A.C.— es una Entidad de
            Certificación y Evaluación acreditada ante CONOCER. Diseñamos diplomados prácticos y
            evaluamos competencias laborales para que la experiencia de cada persona tenga respaldo oficial.
          </p>
          <ul className={p.hechos}>
            {RESPALDO.map((r) => (
              <li key={r.dato} className={s.tarjeta}>
                <strong>{r.dato}</strong>
                <span>{r.texto}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={`${s.seccion} ${s.seccionAlt}`} aria-labelledby="valores">
        <div className={s.contenedor}>
          <Revelar className={s.cabeceraSeccion}>
            <div>
              <p className={s.eyebrow}>Lo que nos guía</p>
              <h2 id="valores" className={s.h2}>Certificar con rigor. Formar con propósito.</h2>
            </div>
          </Revelar>
          <ul className={p.valores}>
            {VALORES.map(({ Icono, titulo, texto }, i) => (
              <Revelar como="li" key={titulo} retraso={i * 90} className={`${s.tarjeta} ${p.valor}`}>
                <Icono size={28} aria-hidden />
                <h3>{titulo}</h3>
                <p>{texto}</p>
              </Revelar>
            ))}
          </ul>
        </div>
      </section>

      <section className={s.seccion} aria-labelledby="proceso">
        <div className={s.contenedor}>
          <Revelar className={s.cabeceraSeccion}>
            <div>
              <p className={s.eyebrow}>Cómo certificamos</p>
              <h2 id="proceso" className={s.h2}>De tu experiencia a un certificado oficial.</h2>
            </div>
          </Revelar>
          <ol className={p.proceso}>
            {PROCESO.map(({ Icono, titulo, texto }, i) => (
              <Revelar como="li" key={titulo} retraso={i * 90}>
                <span className={p.procesoIcono}><Icono size={24} aria-hidden /></span>
                <span className={p.procesoNum}>Paso {i + 1}</span>
                <h3>{titulo}</h3>
                <p>{texto}</p>
              </Revelar>
            ))}
          </ol>
        </div>
      </section>

      <section id="empresas" className={`${s.seccion} ${s.seccionAlt}`} aria-labelledby="empresas-titulo">
        <div className={`${s.contenedor} ${p.empresas}`}>
          <div>
            <p className={s.eyebrow}>Para empresas</p>
            <h2 id="empresas-titulo" className={s.h2}>Capacita y certifica a tu equipo.</h2>
            <p className={s.lead}>
              Grupos cerrados, calendario a la medida, una sola factura y seguimiento por colaborador.
            </p>
          </div>
          <div className={p.empresasBotones}>
            <Link href={RUTAS.empresas} className={`${s.btn} ${s.btnPrimario} ${s.btnGrande}`}>
              Solicitar propuesta <ArrowRight size={18} aria-hidden />
            </Link>
            <Link href={RUTAS.verificar} className={`${s.btn} ${s.btnSecundario} ${s.btnGrande}`}>
              Verificar un certificado
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
