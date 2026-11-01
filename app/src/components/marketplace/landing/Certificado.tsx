import l from "./landing.module.css";

/*
 * El certificado del hero, hecho como documento y no como ilustración:
 * papel, marco de guilloche, folio, firmas y código de verificación.
 * Va marcado como espécimen; el nombre del titular queda en blanco
 * ("Tu nombre") para que quien lo mira se vea ahí.
 */

// Código de verificación: patrón fijo (no aleatorio) para que el render del
// servidor y el del cliente coincidan.
const QR = Array.from({ length: 121 }, (_, i) => {
  const x = i % 11;
  const y = Math.floor(i / 11);
  const esquina = (x < 3 && y < 3) || (x > 7 && y < 3) || (x < 3 && y > 7);
  if (esquina) return !(x % 10 === 1 && y % 10 === 1) && !(x === 9 && y === 1) && !(x === 1 && y === 9);
  return ((x * 7 + y * 13 + x * y) % 5) < 2;
});

function Guilloche() {
  // Dos ondas desfasadas que se repiten: el marco de seguridad de un documento oficial.
  const onda = (fase: number) =>
    Array.from({ length: 49 }, (_, i) => {
      const x = i * 10;
      const y = 6 + Math.sin(i * 0.9 + fase) * 4;
      return `${i === 0 ? "M" : "L"}${x} ${y.toFixed(2)}`;
    }).join(" ");
  return (
    <svg className={l.docGuilloche} viewBox="0 0 480 12" preserveAspectRatio="none" aria-hidden>
      <path d={onda(0)} />
      <path d={onda(Math.PI)} />
      <path d={onda(Math.PI / 2)} />
    </svg>
  );
}

export function Certificado() {
  return (
    <figure className={l.doc} aria-label="Ejemplo de certificado de competencia laboral SEP-CONOCER">
      <div className={l.docHojaAtras} aria-hidden />
      <div className={l.docHoja}>
        <div className={l.docMarco}>
          <Guilloche />
          <header className={l.docCabeza}>
            <span>Sistema Nacional de Competencias</span>
            <span className={l.docFolio}>Folio N.º 0217-2026-00418</span>
          </header>

          <p className={l.docTitulo}>Certificado de Competencia Laboral</p>
          <p className={l.docOtorga}>que acredita a</p>
          <p className={l.docNombre}>Tu nombre</p>
          <p className={l.docTexto}>
            como persona competente en el Estándar de Competencia
          </p>
          <p className={l.docEstandar}>
            <strong>EC0217.01</strong>
            <span>Impartición de cursos de formación del capital humano de manera presencial grupal</span>
          </p>

          <footer className={l.docPie}>
            <div className={l.docFirma}>
              <svg viewBox="0 0 120 30" aria-hidden>
                <path d="M8 20 C 10 6, 22 4, 18 16 C 14 26, 6 24, 14 18 C 22 12, 30 22, 34 18 C 38 14, 36 10, 40 12 C 44 16, 42 22, 48 20 C 54 18, 56 8, 60 10 C 64 13, 60 22, 66 22 C 74 22, 80 12, 88 14 C 96 16, 104 18, 114 13" />
              </svg>
              <span>Evaluador certificado</span>
            </div>
            <div className={l.docSello} aria-hidden>
              <span>ECE<br />002-10</span>
            </div>
            <div className={l.docFirma}>
              <svg viewBox="0 0 120 30" aria-hidden>
                <path d="M10 24 L 22 6 C 26 2, 28 10, 24 16 C 20 22, 30 20, 36 14 C 40 10, 42 18, 46 18 C 52 18, 52 10, 58 12 C 62 14, 60 20, 66 19 C 72 18, 74 12, 80 13 M 84 22 C 92 8, 100 10, 98 16 C 96 22, 108 18, 116 12" />
              </svg>
              <span>Entidad de certificación</span>
            </div>
            <div className={l.docQr} aria-hidden>
              {QR.map((on, i) => (
                <i key={i} data-on={on} />
              ))}
            </div>
          </footer>
          <Guilloche />
        </div>
        <span className={l.docEspecimen} aria-hidden>Espécimen</span>
      </div>
      <figcaption className={l.docLeyenda}>
        <span>Certificado SEP-CONOCER</span>
        <span>Validez nacional · no caduca · verificable en línea</span>
      </figcaption>
    </figure>
  );
}
