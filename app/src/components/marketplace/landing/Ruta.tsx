import { Award, BadgeCheck, GraduationCap, Search } from "lucide-react";
import { ETAPAS, LOGROS } from "@/lib/ceduct/config";
import { Revelar } from "../Revelar";
import s from "../mk.module.css";
import l from "./landing.module.css";

/**
 * El camino a la certificación.
 *
 * La portada ya cuenta cómo se compra (`PASOS`: elige, paga, accede), pero eso
 * no explica qué se lleva nadie. Esta sección cuenta el recorrido formativo en
 * las tres etapas con las que CEDUCT lo ha explicado siempre, que es lo que
 * justifica el precio: no vendemos un curso, reconocemos un oficio.
 */

const ICONOS_ETAPA = [Search, GraduationCap, Award] as const;

export function Ruta() {
  return (
    <section className={s.seccion} aria-labelledby="ruta-titulo">
      <div className={s.contenedor}>
        <Revelar className={s.cabeceraSeccion}>
          <div>
            <p className={s.eyebrow}>El camino</p>
            <h2 id="ruta-titulo" className={s.h2}>
              De lo que ya sabes a tu certificado.
            </h2>
            <p className={l.rutaIntro}>
              No empiezas de cero. Primero reconocemos lo que ya dominas, después cursas
              únicamente lo que te falta, y al final un evaluador acreditado lo dictamina.
            </p>
          </div>
        </Revelar>

        <ol className={l.ruta}>
          {ETAPAS.map((etapa, i) => {
            const Icono = ICONOS_ETAPA[i];
            return (
              <Revelar como="li" key={etapa.ordinal} retraso={i * 100} className={l.etapa}>
                <span className={l.etapaOrdinal} aria-hidden>
                  {etapa.ordinal}
                </span>
                <span className={l.etapaIcono}>
                  <Icono size={24} aria-hidden />
                </span>
                <h3>{etapa.titulo}</h3>
                <p className={l.etapaResumen}>{etapa.resumen}</p>
                <ol className={l.etapaPasos}>
                  {etapa.pasos.map((paso) => (
                    <li key={paso.titulo} className={l.etapaPaso}>
                      <span className={l.etapaPasoTitulo}>{paso.titulo}</span>
                      <span className={l.etapaPasoTexto}>{paso.texto}</span>
                    </li>
                  ))}
                </ol>
              </Revelar>
            );
          })}
        </ol>

        <Revelar className={l.logros}>
          <h3 className={l.logrosTitulo}>Certifícate y obtén</h3>
          <ul className={l.logrosLista}>
            {LOGROS.map((logro) => (
              <li key={logro}>
                <BadgeCheck size={18} aria-hidden /> {logro}
              </li>
            ))}
          </ul>
        </Revelar>
      </div>
    </section>
  );
}
