import { TIPO_LABEL, type Programa } from "@/lib/ceduct/tipos";
import { Emblema } from "../Iconos";
import f from "./ficha.module.css";

/** Patrón fijo con aspecto de código QR. Decorativo: no codifica nada. */
const QR = Array.from({ length: 81 }, (_, i) => {
  const x = i % 9;
  const y = Math.floor(i / 9);
  const esquina = (x < 3 && y < 3) || (x > 5 && y < 3) || (x < 3 && y > 5);
  return esquina ? !(x % 2 === 1 && y % 2 === 1 && (x === 1 || x === 7) && (y === 1 || y === 7)) : (x * 7 + y * 13) % 3 === 0;
});

/**
 * Diploma de muestra, hecho en HTML para que se lea nítido en cualquier
 * pantalla. Lleva la marca de agua «MUESTRA» y datos genéricos.
 */
export function CertificadoMuestra({ programa: p }: { programa: Programa }) {
  const certificacion = p.tipo === "certificacion";
  return (
    <figure className={f.certificado}>
      <div className={f.certPapel} aria-hidden="true">
        <span className={f.certAgua}>MUESTRA</span>
        <div className={f.certCabecera}>
          <Emblema className={f.certEmblema} />
          <div>
            <strong>CEDUCT A.C.</strong>
            <span>Entidad de Certificación y Evaluación · ECE 002-10</span>
          </div>
        </div>
        <p className={f.certTipo}>
          {certificacion ? "Certificado de competencia laboral" : `Constancia de ${TIPO_LABEL[p.tipo].toLowerCase()}`}
        </p>
        <p className={f.certOtorga}>Se otorga a</p>
        <p className={f.certNombre}>Nombre del participante</p>
        <p className={f.certPrograma}>
          por {certificacion ? "haber demostrado su competencia en" : "haber acreditado el"}{" "}
          <strong>{p.titulo}</strong>
          {p.horas ? ` · ${p.horas} horas` : ""}
        </p>
        <div className={f.certPie}>
          <div className={f.certFirma}>
            <span />
            <small>Dirección académica</small>
          </div>
          <div className={f.certQr}>
            {QR.map((on, i) => <i key={i} data-on={on} />)}
          </div>
          <div className={f.certFolio}>
            <small>Folio</small>
            <strong>CEDUCT-0000-MUESTRA</strong>
          </div>
        </div>
      </div>
      <figcaption className={f.certLeyenda}>
        Ejemplo ilustrativo. El documento real incluye tu nombre, folio único y código de verificación.
      </figcaption>
    </figure>
  );
}
