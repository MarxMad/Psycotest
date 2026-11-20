import type { Metadata } from "next";
import Link from "next/link";
import { Lock } from "lucide-react";
import { LogoPsi } from "@/components/channels/psico/LogoPsi";
import { channelPublicUrl } from "@/lib/channels";
import { clasesDeCanal, estiloDeCanal } from "@/lib/tema-canal";
import s from "./evaluacion.module.css";

export const metadata: Metadata = {
  title: {
    default: "Evaluación en línea · Psicología Aplicada",
    template: "%s · Psicología Aplicada",
  },
  robots: { index: false, follow: false },
};

/**
 * Todo el flujo del aplicante (código, pruebas, compra) viste la marca de
 * Psicología Aplicada: quien contesta debe saber en todo momento quién le
 * aplica la evaluación y que sus respuestas están a resguardo.
 */
export default function EvaluacionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${clasesDeCanal("psicologia")} ${s.tema}`} style={estiloDeCanal("psicologia")}>
      <header className={s.cabecera}>
        <a href={channelPublicUrl("psicologia")} className={s.marca}>
          <LogoPsi className={s.logo} />
          <span className={s.marcaTexto}>
            <strong>Psicología Aplicada</strong>
            <span>Evaluación psicológica en línea</span>
          </span>
        </a>
        <span className={s.seguro}>
          <Lock size={13} aria-hidden /> Conexión cifrada · Respuestas confidenciales
        </span>
      </header>

      <div className={s.contenido}>{children}</div>

      <footer className={s.pie}>
        <span>© Sociedad de Psicología Aplicada A. C.</span>
        <span className={s.pieEnlaces}>
          <Link href="/legal">Aviso de privacidad</Link>
          <a href={channelPublicUrl("psicologia", "/#contacto")}>Ayuda</a>
        </span>
      </footer>
    </div>
  );
}
