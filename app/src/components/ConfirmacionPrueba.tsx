"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { channelPublicUrl } from "@/lib/channels";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { envioDe, reenviarSesion, type Instrumento } from "@/lib/storage";
import s from "./ConfirmacionPrueba.module.css";
import { NOMBRE_INSTRUMENTO } from "@/lib/instrumentos";

const ETIQUETAS: Record<Instrumento, string> = NOMBRE_INSTRUMENTO;

function fmt(iso: string) {
  return new Date(iso).toLocaleString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Props {
  instrumento: Instrumento;
  participante: string;
  finalizadaEn: string;
  /** Qué sigue para el candidato, si no es la revisión del psicólogo. */
  mensaje?: string;
  /** Sesión enviada desde esta pestaña: la pantalla espera a que el servidor la reciba. */
  sesionId?: string;
}

type Envio = "enviando" | "ok" | "error";

export function ConfirmacionPrueba({ instrumento, participante, finalizadaEn, mensaje, sesionId }: Props) {
  const [envio, setEnvio] = useState<Envio>(() => (sesionId && envioDe(sesionId) ? "enviando" : "ok"));

  useEffect(() => {
    const pendiente = sesionId ? envioDe(sesionId) : null;
    if (!pendiente) return;
    let vivo = true;
    pendiente.then((ok) => vivo && setEnvio(ok ? "ok" : "error"));
    return () => {
      vivo = false;
    };
  }, [sesionId]);

  async function reintentar() {
    if (!sesionId) return;
    setEnvio("enviando");
    setEnvio((await reenviarSesion(sesionId)) ? "ok" : "error");
  }

  if (envio !== "ok") {
    return (
      <main className={s.main}>
        <div className={s.card} role={envio === "error" ? "alert" : "status"}>
          {envio === "enviando" ? (
            <>
              <Loader2 className={`${s.icon} ${s.girando}`} size={48} strokeWidth={1.5} aria-hidden />
              <span className="eyebrow">Enviando</span>
              <h1>Guardando tus respuestas…</h1>
              <p className={s.lede}>No cierres esta ventana.</p>
            </>
          ) : (
            <>
              <AlertTriangle className={`${s.icon} ${s.iconoError}`} size={48} strokeWidth={1.5} aria-hidden />
              <span className="eyebrow">Falta un paso</span>
              <h1>No pudimos enviar tus respuestas</h1>
              <p className={s.lede}>
                Tus respuestas de <strong>{ETIQUETAS[instrumento]}</strong> siguen guardadas en este
                navegador. Revisa tu conexión y vuelve a intentarlo; si el problema sigue, avisa a
                quien te dio el código.
              </p>
              <button type="button" className="btn btn-primary" onClick={() => void reintentar()}>
                Reintentar envío
              </button>
            </>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className={s.main}>
      <div className={s.card}>
        <CheckCircle2 className={s.icon} size={48} strokeWidth={1.5} aria-hidden />
        <span className="eyebrow">Prueba completada</span>
        <h1>Gracias, {participante.split(" ")[0] || participante}</h1>
        <p className={s.lede}>
          Tu evaluación <strong>{ETIQUETAS[instrumento]}</strong> fue registrada correctamente.
        </p>

        <dl className={s.meta}>
          <div>
            <dt>Instrumento</dt>
            <dd>{ETIQUETAS[instrumento]}</dd>
          </div>
          <div>
            <dt>Fecha y hora</dt>
            <dd>{fmt(finalizadaEn)}</dd>
          </div>
        </dl>

        <p className={s.mensaje}>
          {mensaje ??
            "Pronto sabrás tus resultados. Un psicólogo revisará tu protocolo y te compartirá el informe cuando esté listo."}
        </p>

        <Link href={channelPublicUrl("psicologia")} className="btn btn-primary">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
