"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, MessageCircle } from "lucide-react";
import { whatsapp } from "@/lib/contacto";
import s from "./RutaRapida.module.css";

type Ruta = {
  id: string;
  chip: string;
  texto: string;
  principal: { label: string; href: string; externo?: boolean };
  secundario: { label: string; href: string; externo?: boolean };
};

/**
 * Tres preguntas resueltas sin cambiar de página: quien llega sabe en un
 * toque cuál es su camino y tiene el botón de ese camino debajo.
 */
function rutas(total: number): Ruta[] {
  const cuantos = total > 0 ? `${total} diplomado${total === 1 ? "" : "s"}` : "los diplomados";
  return [
    {
      id: "formarme",
      chip: "Quiero formarme",
      texto:
        "Eliges un diplomado, lo cursas en línea o presencial y sales con la constancia del estándar que preparaste. Inscripción abierta ahora.",
      principal: { label: `Ver ${cuantos}`, href: "#diplomados" },
      secundario: {
        label: "Preguntar cuál me toca",
        href: whatsapp("Hola, quiero formarme. ¿Cuál diplomado me conviene?"),
        externo: true,
      },
    },
    {
      id: "certificarme",
      chip: "Ya sé hacerlo",
      texto:
        "Si llevas años en el oficio no tienes que volver a tomar un curso: vas directo a evaluación, reúnes evidencias y obtienes el mismo certificado.",
      principal: { label: "Cómo me certifico", href: "#certificaciones" },
      secundario: {
        label: "Agendar la llamada de 15 min",
        href: whatsapp("Hola, ya tengo experiencia y quiero certificarme directo. ¿Cómo empiezo?"),
        externo: true,
      },
    },
    {
      id: "equipo",
      chip: "Es para mi equipo",
      texto:
        "Armamos la generación para tu plantilla, en tu sede o en línea, con un expediente por persona y el seguimiento del grupo en un solo tablero.",
      principal: {
        label: "Hablar de un grupo",
        href: whatsapp("Hola, quiero certificar a un equipo. ¿Me pasan condiciones para grupo?"),
        externo: true,
      },
      secundario: { label: "Ver qué certificamos", href: "#estandares" },
    },
  ];
}

export function RutaRapida({ total = 0 }: { total?: number }) {
  const opciones = rutas(total);
  const [activa, setActiva] = useState(opciones[0].id);
  const reduce = useReducedMotion();
  const grupo = useId();
  const ruta = opciones.find((r) => r.id === activa) ?? opciones[0];

  return (
    <div className={s.caja}>
      <p className={s.titulo}>
        <span className={s.pulso} aria-hidden />
        Encuentra tu ruta en diez segundos
      </p>

      <div className={s.chips} role="tablist" aria-label="Elige tu situación">
        {opciones.map((r) => {
          const selec = r.id === activa;
          return (
            <button
              key={r.id}
              type="button"
              role="tab"
              id={`${grupo}-${r.id}`}
              aria-selected={selec}
              aria-controls={`${grupo}-panel`}
              className={`${s.chip} ${selec ? s.chipActivo : ""}`}
              onClick={() => setActiva(r.id)}
            >
              {selec && (
                <motion.span
                  className={s.chipFondo}
                  layoutId={`${grupo}-fondo`}
                  transition={
                    reduce
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 420, damping: 34 }
                  }
                  aria-hidden
                />
              )}
              <span className={s.chipTexto}>{r.chip}</span>
            </button>
          );
        })}
      </div>

      <div
        className={s.panel}
        id={`${grupo}-panel`}
        role="tabpanel"
        aria-labelledby={`${grupo}-${ruta.id}`}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={ruta.id}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className={s.respuesta}>{ruta.texto}</p>
            <div className={s.acciones}>
              <a
                className={s.ctaPrincipal}
                href={ruta.principal.href}
                {...(ruta.principal.externo
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {ruta.principal.label}
                <ArrowRight size={16} aria-hidden />
              </a>
              <a
                className={s.ctaSecundario}
                href={ruta.secundario.href}
                {...(ruta.secundario.externo
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {ruta.secundario.externo && <MessageCircle size={15} aria-hidden />}
                {ruta.secundario.label}
              </a>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
