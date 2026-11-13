"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Clock, Copy } from "lucide-react";
import { AmbientBackground } from "@/components/AmbientBackground";
import { FadeIn } from "@/components/motion";
import { psycotest } from "@/lib/routes";
import { CONTACTO, whatsapp } from "@/lib/contacto";
import s from "./compra.module.css";

type Estado = {
  pagado: boolean;
  total: number | null;
  correo: string | null;
  modo: "empresa" | "persona";
  pruebas: string[];
  folio: string;
  codigos: string[];
};

const pesos = (c: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(c / 100);

/**
 * Vuelta del pago de evaluaciones. Si el pago ya entró muestra los códigos
 * (los mismos que van por correo); si es OXXO o SPEI, explica que llegan en
 * cuanto se acredite.
 */
function Cuerpo() {
  const sesion = useSearchParams().get("session_id");
  const [estado, setEstado] = useState<Estado | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);

  useEffect(() => {
    if (!sesion) {
      setError("No encontramos tu compra.");
      return;
    }
    let vivo = true;
    let intentos = 0;
    // Con tarjeta el pago se confirma en segundos; se reintenta un poco.
    async function consultar() {
      try {
        const r = await fetch(`/api/psicologia/compra?session_id=${encodeURIComponent(sesion!)}`);
        const d = await r.json();
        if (!vivo) return;
        if (!r.ok) throw new Error(d.error ?? "No encontramos tu compra.");
        setEstado(d);
        if (!d.pagado && ++intentos < 4) setTimeout(consultar, 2500);
      } catch (e) {
        if (vivo) setError((e as Error).message);
      }
    }
    void consultar();
    return () => {
      vivo = false;
    };
  }, [sesion]);

  async function copiar(texto: string) {
    await navigator.clipboard?.writeText(texto).catch(() => {});
    setCopiado(texto);
    setTimeout(() => setCopiado(null), 1600);
  }

  if (error) {
    return (
      <FadeIn className={s.panel}>
        <span className="eyebrow">Compra</span>
        <h1>Algo no cuadró</h1>
        <p className={s.sub}>
          {error} Si ya pagaste, escríbenos con tu comprobante y lo resolvemos enseguida.
        </p>
        <a className="btn btn-primary" href={whatsapp("Hola, pagué evaluaciones en línea y no veo mis códigos.")}>
          Escribir por WhatsApp
        </a>
      </FadeIn>
    );
  }

  if (!estado) {
    return (
      <FadeIn className={s.panel}>
        <p className={s.sub}>Confirmando tu pago…</p>
      </FadeIn>
    );
  }

  const persona = estado.modo === "persona";

  if (!estado.pagado) {
    return (
      <FadeIn className={s.panel}>
        <span className={s.icono} data-espera>
          <Clock size={26} />
        </span>
        <span className="eyebrow">Pedido {estado.folio}</span>
        <h1>Esperando tu pago</h1>
        <p className={s.sub}>
          Si elegiste OXXO o transferencia SPEI, {persona ? "tu código llega" : "los códigos llegan"} a{" "}
          <strong>{estado.correo ?? "tu correo"}</strong> en cuanto se acredite el pago (OXXO tarda hasta
          24 h). No tienes que hacer nada más.
        </p>
        <p className={s.pie}>¿Dudas? {CONTACTO.email}</p>
      </FadeIn>
    );
  }

  const todos = estado.codigos.join("\n");

  return (
    <FadeIn className={s.panel}>
      <span className={s.icono}>
        <Check size={26} strokeWidth={2.6} />
      </span>
      <span className="eyebrow">Pago confirmado · {estado.folio}</span>
      <h1>{persona ? "Tu código está listo" : `Tus ${estado.codigos.length} códigos están listos`}</h1>
      <p className={s.sub}>
        {estado.total != null && <>Pagaste {pesos(estado.total)}. </>}
        {persona ? "Sirve" : "Cada código sirve a un candidato, una vez,"} para: {estado.pruebas.join(", ")}.
        También {persona ? "te lo mandamos" : "te los mandamos"} a <strong>{estado.correo}</strong>.
      </p>

      <ol className={s.codigos}>
        {estado.codigos.map((c, i) => (
          <li key={c}>
            <span>{persona ? "Tu código" : `Candidato ${i + 1}`}</span>
            <code>{c}</code>
            <button type="button" onClick={() => copiar(c)} aria-label={`Copiar ${c}`}>
              {copiado === c ? <Check size={15} /> : <Copy size={15} />}
            </button>
          </li>
        ))}
      </ol>

      <div className={s.acciones}>
        {!persona && estado.codigos.length > 1 && (
          <button type="button" className="btn" onClick={() => copiar(todos)}>
            {copiado === todos ? "Copiados" : "Copiar todos"}
          </button>
        )}
        <Link className="btn btn-primary" href={psycotest.acceso}>
          {persona ? "Contestar ahora" : "Ver cómo entra un candidato"}
        </Link>
      </div>

      <p className={s.pie}>
        {persona
          ? "Contesta a tu ritmo: puedes pausar y retomar. Tu informe llega en 72 horas."
          : "Manda un código a cada candidato. Entran en esta misma página de acceso, escriben su código y contestan desde donde estén. Los informes llegan en 72 horas."}
      </p>
    </FadeIn>
  );
}

export default function CompraPage() {
  return (
    <>
      <AmbientBackground />
      <main className={s.main}>
        <Suspense fallback={null}>
          <Cuerpo />
        </Suspense>
      </main>
    </>
  );
}
