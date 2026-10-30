"use client";

import { useEffect, useRef, useState } from "react";
import l from "./landing.module.css";

/*
 * El manifiesto: entre la portada y el catálogo, la promesa dicha en grande.
 *
 * Tres frases que se relevan mientras la sección está a la vista y dos cintas
 * cruzadas con los estándares reales del catálogo: lo que se promete y con
 * qué se respalda, en la misma pantalla.
 */

const FRASES = [
  ["Reconoce", "lo que", "ya sabes"],
  ["Cursa", "lo que", "te falta"],
  ["Certifica", "tu", "oficio"],
];

function menosMovimiento() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function Cinta({ textos, clase }: { textos: string[]; clase: string }) {
  // Dos vueltas iguales: la pista se desplaza la mitad y el corte no se ve.
  return (
    <div className={`${l.cinta} ${clase}`} aria-hidden>
      <div className={l.cintaPista}>
        {[0, 1].map((vuelta) => (
          <span key={vuelta} className={l.cintaLista}>
            {textos.map((t) => (
              <span key={t}>
                {t}
                <span className={l.cintaAsterisco}>✳</span>
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Manifiesto({ estandares }: { estandares: string[] }) {
  const caja = useRef<HTMLElement>(null);
  const [i, setI] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const nodo = caja.current;
    if (!nodo) return;
    const obs = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.25 });
    obs.observe(nodo);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || menosMovimiento()) return;
    const t = window.setInterval(() => setI((n) => (n + 1) % FRASES.length), 3600);
    return () => window.clearInterval(t);
  }, [visible]);

  return (
    <section ref={caja} className={l.manifiesto} aria-labelledby="manifiesto-titulo" data-visible={visible}>
      <Cinta textos={estandares} clase={l.cintaAmarilla} />
      <Cinta textos={["Validez oficial", "SEP · CONOCER", "No caduca", "Verificable en línea", "ECE 002-10"]} clase={l.cintaNaranja} />

      <h2 id="manifiesto-titulo" className={l.oculto}>
        {FRASES.map((f) => f.join(" ")).join(". ")}.
      </h2>
      {/* `key` reinicia la animación: cada frase entra renglón por renglón desde su máscara. */}
      <p key={i} className={l.manifiestoLineas} aria-hidden>
        {FRASES[i].map((linea, k) => (
          <span key={k} className={l.manifiestoMascara}>
            <span className={l.manifiestoLinea} style={{ animationDelay: `${k * 90}ms` }}>
              {linea}
            </span>
          </span>
        ))}
      </p>

      <ol className={l.manifiestoPuntos} aria-hidden>
        {FRASES.map((f, k) => (
          <li key={f[0]} data-activo={k === i} />
        ))}
      </ol>
    </section>
  );
}
