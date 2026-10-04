"use client";

import { useEffect, useRef } from "react";
import { animate, createSpring, stagger } from "animejs";
import { ArrowRight, KeyRound, Users } from "lucide-react";
import { evaluacion } from "@/lib/routes";
import { menosMovimiento } from "@/lib/aparicion";
import s from "./PuertasPsico.module.css";

/**
 * Las dos puertas del canal.
 *
 * Aquí llegan dos personas que no quieren lo mismo: quien trae un código de su
 * empresa y quiere contestar, y quien necesita evaluar candidatos. Antes los
 * botones de ambas estaban repartidos por toda la página —«entrar con código»,
 * «solicitar cotización», «ver la batería», «comprar»— y ninguna de las dos
 * encontraba el suyo de un vistazo. Ahora se separan desde la portada, y la de
 * quien contrata va marcada como principal porque es la que sostiene el negocio.
 */
const PUERTAS = [
  {
    id: "empresa",
    tono: "principal",
    etiqueta: "Quiero evaluar",
    icono: Users,
    titulo: "Necesito evaluar candidatos",
    texto:
      "Eliges los instrumentos, te damos los códigos y el informe interpretado en 72 horas. Precio a la vista, sin llamada previa.",
    accion: { label: "Armar mi evaluación", href: "#bateria" },
  },
  {
    id: "candidato",
    tono: "secundaria",
    etiqueta: "Traigo un código",
    icono: KeyRound,
    titulo: "Vengo a presentar mi evaluación",
    texto:
      "Entras directo con el código que te enviaron. No necesitas cuenta y puedes pausar y retomar desde cualquier dispositivo.",
    accion: { label: "Entrar con mi código", href: evaluacion.acceso },
  },
] as const;

export function PuertasPsico() {
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const nodo = caja.current;
    if (!nodo || menosMovimiento()) return;

    const puertas = Array.from(nodo.querySelectorAll<HTMLElement>("[data-puerta]"));
    puertas.forEach((p) => {
      p.style.opacity = "0";
    });

    animate(puertas, {
      opacity: [0, 1],
      translateY: [24, 0],
      duration: 680,
      delay: stagger(120, { start: 220 }),
      ease: "out(3)",
    });
  }, []);

  // El brillo sigue al cursor y el icono rebota al entrar: la tarjeta responde
  // antes del clic, que es lo que hace que se lea como un botón y no como texto.
  function seguir(e: React.PointerEvent<HTMLAnchorElement>) {
    const caja = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - caja.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - caja.top}px`);
  }

  function saludar(e: React.PointerEvent<HTMLAnchorElement>) {
    if (menosMovimiento()) return;
    const icono = e.currentTarget.querySelector<HTMLElement>("[data-icono]");
    if (!icono) return;
    animate(icono, {
      scale: [1, 1.14, 1],
      rotate: [0, -6, 0],
      duration: 620,
      ease: createSpring({ stiffness: 160, damping: 9 }),
    });
  }

  return (
    <div className={s.puertas} ref={caja}>
      {PUERTAS.map((p) => {
        const Icono = p.icono;
        return (
          <a
            key={p.id}
            href={p.accion.href}
            className={s.puerta}
            data-puerta
            data-tono={p.tono}
            onPointerMove={seguir}
            onPointerEnter={saludar}
          >
            <span className={s.brillo} aria-hidden />
            <span className={s.cuerpo}>
              <span className={s.cabecera}>
                <span className={s.icono} data-icono aria-hidden>
                  <Icono size={17} strokeWidth={1.8} />
                </span>
                <span className={s.etiqueta}>{p.etiqueta}</span>
              </span>
              <strong className={s.titulo}>{p.titulo}</strong>
              <p className={s.texto}>{p.texto}</p>
            </span>
            <span className={s.accion}>
              {p.accion.label}
              <ArrowRight size={16} aria-hidden />
            </span>
          </a>
        );
      })}
    </div>
  );
}
