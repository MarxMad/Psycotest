"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, MessageCircle } from "lucide-react";
import { whatsapp } from "@/lib/contacto";
import s from "./BarraAccion.module.css";

/**
 * Barra que acompaña el scroll con el botón de inscripción siempre a mano.
 *
 * Aparece cuando la portada ya salió de pantalla y se retira al llegar al
 * bloque de contacto, donde los mismos botones ya están a la vista.
 */
export function BarraAccion({ total = 0 }: { total?: number }) {
  const [visible, setVisible] = useState(false);
  const hilo = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let cuadro = 0;

    const medir = () => {
      cuadro = 0;
      const alto = document.documentElement.scrollHeight - window.innerHeight;
      const y = window.scrollY;
      const p = alto > 0 ? Math.min(1, y / alto) : 0;
      // El hilo se escribe en el DOM: un render por cuadro de scroll sobra.
      if (hilo.current) hilo.current.style.transform = `scaleX(${p.toFixed(4)})`;
      // Entra pasada la portada; se retira en el último tramo, donde vive el contacto.
      setVisible(y > window.innerHeight * 0.75 && p < 0.93);
    };

    const alScroll = () => {
      if (cuadro) return;
      cuadro = requestAnimationFrame(medir);
    };

    medir();
    window.addEventListener("scroll", alScroll, { passive: true });
    window.addEventListener("resize", alScroll, { passive: true });
    return () => {
      if (cuadro) cancelAnimationFrame(cuadro);
      window.removeEventListener("scroll", alScroll);
      window.removeEventListener("resize", alScroll);
    };
  }, []);

  return (
    <div
      className={s.barra}
      data-visible={visible ? "si" : "no"}
      role="region"
      aria-label="Acciones rápidas"
      aria-hidden={!visible}
    >
      <span ref={hilo} className={s.avance} aria-hidden />

      <div className={s.cuerpo}>
        <p className={s.dato}>
          <strong>
            {total > 0 ? `${total} diplomados` : "Diplomados"} abiertos
          </strong>
          <span>Certificación CONOCER · ECE 002-10</span>
        </p>

        <div className={s.botones}>
          <a className={s.principal} href="#diplomados" tabIndex={visible ? 0 : -1}>
            Ver diplomados
            <ArrowRight size={16} aria-hidden />
          </a>
          <a
            className={s.wa}
            href={whatsapp("Hola, quiero información de los diplomados y la certificación.")}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={visible ? 0 : -1}
          >
            <MessageCircle size={16} aria-hidden />
            <span>WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}
