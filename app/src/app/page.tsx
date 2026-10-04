import type { Metadata } from "next";
import { CHANNELS, channelPublicUrl, type ChannelId } from "@/lib/channels";
import h from "./hub.module.css";

export const metadata: Metadata = {
  title: "Martín Hernández González — Certificación, evaluación y formación",
  description:
    "Certificación de competencias laborales, evaluación y selección de personal, capacitación y consultoría organizacional.",
};

const ORDEN: ChannelId[] = ["ceduct", "psicologia", "ige", "martin"];

/**
 * Índice de marcas.
 *
 * Es la puerta del dominio principal: reparte al visitante hacia el sitio
 * que le corresponde. No lleva cifras del negocio ni accesos al panel —
 * cualquiera puede verla.
 */
export default function IndicePage() {
  return (
    <div className={h.pagina}>
      <header className={h.cabecera}>
        <div className={h.cabeceraInterior}>
          <div>
            <p className={h.eyebrow}>Cuatro líneas de trabajo</p>
            <h1 className={h.titulo}>Martín Hernández González</h1>
          </div>
        </div>
      </header>

      <main className={h.principal}>
        <p className={h.intro}>
          Certificamos competencias, evaluamos candidatos, formamos equipos y acompañamos a la
          dirección. Elige por dónde empezar.
        </p>

        <ul className={h.lista}>
          {ORDEN.map((id) => {
            const canal = CHANNELS[id];
            return (
              <li key={id} className={h.fila} data-canal={id}>
                <div className={h.filaTexto}>
                  <p className={h.rol}>{canal.accentLabel}</p>
                  <h2 className={h.nombre}>{canal.name}</h2>
                  <p className={h.descripcion}>{canal.description}</p>
                </div>

                <div className={h.acciones}>
                  <a className={h.accionPrimaria} href={channelPublicUrl(id)}>
                    Entrar
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
