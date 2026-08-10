"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import type { Instrumento } from "@/lib/storage";
import s from "./ConfirmacionPrueba.module.css";

const ETIQUETAS: Record<Instrumento, string> = {
  papi: "PAPI",
  hartman: "Inventario de Valores Hartman",
  mabe: "MABE",
};

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
}

export function ConfirmacionPrueba({ instrumento, participante, finalizadaEn }: Props) {
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
          Pronto sabrás tus resultados. Un psicólogo revisará tu protocolo y te compartirá el informe
          cuando esté listo.
        </p>

        <Link href="/" className="btn btn-primary">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
