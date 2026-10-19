"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Clock } from "lucide-react";
import { CONTACTO, whatsapp } from "@/lib/contacto";
import s from "@/components/ceduct/ceduct.module.css";

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
    <div className={s.detalle}>
      <div className={s.exito}>
        <span className={s.exitoIcono} aria-hidden>
          {confirmado ? <Check size={24} /> : <Clock size={24} />}
        </span>
        <h1>{confirmado ? "Pago confirmado" : cargando ? "Confirmando tu pago…" : "Pago recibido"}</h1>

        <p className={s.parrafo}>
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

        <div className={s.exitoAcciones}>
          <Link className={s.btnPrimario} href="/mi-cuenta/cursos">
            Ver mis programas
          </Link>
          <a
            className={s.btnSecundario}
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
          <a className={s.btnSecundario} href={`mailto:${CONTACTO.email}`}>
            {CONTACTO.email}
          </a>
        </div>
      </div>
    </div>
  );
}

export function Confirmacion() {
  return (
    <Suspense fallback={<div className={s.detalle}><p className={s.parrafo}>Cargando…</p></div>}>
      <Cuerpo />
    </Suspense>
  );
}
