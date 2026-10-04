import s from "./CintaEstandares.module.css";

/**
 * Banda con los estándares que se certifican, en marcha continua.
 *
 * Es decorativa: la lista real, con su botón de solicitud, vive en
 * #estandares. Aquí sólo dice de un vistazo cuánto abarca el catálogo.
 */
export function CintaEstandares({ nombres }: { nombres: string[] }) {
  if (nombres.length === 0) return null;

  // Dos filas en sentidos opuestos leen como un tablero, no como un letrero.
  const mitad = Math.ceil(nombres.length / 2);
  const filas = [nombres.slice(0, mitad), nombres.slice(mitad)].filter((f) => f.length > 0);

  return (
    <div className={s.cinta} aria-hidden>
      <span className={s.sello}>Catálogo de estándares</span>
      {filas.map((fila, i) => (
        <div key={i} className={s.carril}>
          <div className={`${s.tren} ${i % 2 ? s.trenInverso : ""}`}>
            {/* La copia duplicada es lo que hace que el bucle no tenga costura. */}
            {[0, 1].map((copia) => (
              <ul key={copia} className={s.grupo}>
                {fila.map((n) => (
                  <li key={n} className={s.item}>
                    <span className={s.punto} />
                    {n}
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
