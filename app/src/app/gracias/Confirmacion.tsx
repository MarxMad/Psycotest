"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Check, Clock } from "lucide-react";
import { CONTACTO, whatsapp } from "@/lib/contacto";
import { RUTAS } from "@/lib/ceduct/rutas";
import s from "@/components/marketplace/mk.module.css";
import k from "@/components/marketplace/compra/compra.module.css";

type Estado = { pagado: boolean; estado: string; total: number | null; correo: string | null };

function Cuerpo() {
  const params = useSearchParams();
  const pedido = params.get("pedido");
  const sesion = params.get("session_id");
  const [estado, setEstado] = useState<Estado | null>(null);
  const [cargando, setCargando] = useState(Boolean(sesion));

  useEffect(() => {
    if (!sesion) return;
    let vivo = true;
    void (async () => {
      try {
        const r = await fetch(`/api/stripe/estado?session_id=${encodeURIComponent(sesion)}`);
        if (!vivo) return;
        if (r.ok) setEstado(await r.json());
      } finally {
        if (vivo) setCargando(false);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [sesion]);

  // El acceso lo concede el webhook, no esta página: si tarda un momento, se
  // dice, en vez de prometer algo que todavía no ocurrió.
  const confirmado = estado?.pagado ?? false;

  return (
    <div className={`${s.contenedor} ${k.pagina}`}>
      <ol className={k.pasos} aria-label="Progreso de compra">
        <li data-hecho="true">Carrito</li>
        <li data-hecho="true">Datos y pago</li>
        <li aria-current="step">Confirmación</li>
      </ol>
      <div className={`${s.tarjeta} ${k.confirmacion}`}>
        <span className={k.confirmacionIcono} aria-hidden>
          {confirmado ? <Check size={40} strokeWidth={2.6} /> : <Clock size={40} />}
        </span>
        <h1 className={k.titulo} aria-live="polite">
          {confirmado ? "¡Pago confirmado!" : cargando ? "Confirmando tu pago…" : "Pago recibido"}
        </h1>
        {pedido && (
          <div className={k.orden}>
            <span>Número de orden</span>
            <strong>{pedido}</strong>
          </div>
        )}

        <p className={s.lead}>
          {confirmado ? (
            <>
              Gracias. Tu inscripción quedó cubierta
              {pedido ? (
                <>
                  {" "}
                  con el folio <strong>{pedido}</strong>
                </>
              ) : null}
              . Te damos de alta en el programa enseguida y recibirás el acceso
              {estado?.correo ? ` en ${estado.correo}` : " por correo"}.
            </>
          ) : (
            <>
              Estamos confirmando el cobro con el banco. Puede tardar unos minutos y, en algunos
              métodos de pago, hasta un par de días. En cuanto se confirme te damos de alta
              {pedido ? (
                <>
                  {" "}
                  (folio <strong>{pedido}</strong>)
                </>
              ) : null}
              .
            </>
          )}
        </p>

        <div className={k.vacioBotones}>
          <Link className={`${s.btn} ${s.btnPrimario} ${s.btnGrande}`} href={RUTAS.misCursos}>
            Ir a mis cursos <ArrowRight size={18} aria-hidden />
          </Link>
          <a
            className={`${s.btn} ${s.btnSecundario} ${s.btnGrande}`}
            href={whatsapp(
              pedido
                ? `Hola, acabo de pagar mi inscripción. Mi folio es ${pedido}.`
                : "Hola, acabo de pagar mi inscripción.",
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            Escribir por WhatsApp
          </a>
        </div>
        <p className={s.meta}>
          ¿Dudas? <a href={`mailto:${CONTACTO.email}`}>{CONTACTO.email}</a>
        </p>
      </div>
    </div>
  );
}

export function Confirmacion() {
  return (
    <Suspense fallback={<div className={`${s.contenedor} ${k.pagina}`}><p className={s.lead}>Cargando…</p></div>}>
      <Cuerpo />
    </Suspense>
  );
}
