import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import { asegurarSeccion } from "../../../guardia";
import { NOMBRE_INSTRUMENTO } from "@/lib/instrumentos";
import { fechaHora as fechaHoraLarga, duracion } from "@/lib/tiempos-prueba";
import { claveDe, panelDeEmpresa, type PruebaAplicante } from "@/lib/panel-empresa";
import s from "../../evaluaciones.module.css";

export const dynamic = "force-dynamic";

const ESTADO: Record<PruebaAplicante["estado"], { texto: string; tono: string }> = {
  pendiente: { texto: "Código activado, sin empezar", tono: "neutro" },
  contestando: { texto: "Contestando", tono: "aviso" },
  "en-revision": { texto: "Contestada · en revisión del psicólogo", tono: "aviso" },
  firmado: { texto: "Informe firmado", tono: "ok" },
  "tiempo-agotado": { texto: "Se agotaron sus 24 horas", tono: "alerta" },
};

/**
 * Resumen personal de un aplicante: cada prueba que hizo, cuándo activó el
 * código, cuándo empezó y terminó, cuánto tardó, sus puntajes y el informe en PDF.
 */
export default async function AplicantePage({ params }: { params: Promise<{ clave: string }> }) {
  const { user } = await asegurarSeccion("/mi-cuenta/evaluaciones");
  const { clave } = await params;
  const buscada = claveDe(decodeURIComponent(clave));

  const { aplicantes } = await panelDeEmpresa(user.id);
  const a = aplicantes.find((x) => x.clave === buscada);
  if (!a) notFound();

  const terminadas = a.pruebas.filter((p) => p.fin);
  const tiempoTotal = terminadas.reduce(
    (n, p) => n + (new Date(p.fin!).getTime() - new Date(p.inicio ?? p.fin!).getTime()),
    0,
  );
  const inicioGlobal = a.pruebas.map((p) => p.inicio).filter(Boolean).sort()[0] ?? null;
  const finGlobal = terminadas.map((p) => p.fin!).sort().at(-1) ?? null;

  return (
    <>
      <Link href="/mi-cuenta/evaluaciones?tab=aplicantes" className={s.volver}>
        <ArrowLeft size={15} aria-hidden /> Aplicantes
      </Link>

      <header className={s.fichaCabeza}>
        <span className={s.inicialGrande} aria-hidden>
          {a.nombre.trim().charAt(0).toUpperCase()}
        </span>
        <div>
          <h1>{a.nombre}</h1>
          <p>{[a.puesto, a.empresa].filter(Boolean).join(" · ") || "Sin puesto indicado"}</p>
        </div>
      </header>

      <dl className={s.resumen}>
        <div>
          <dt>Pruebas</dt>
          <dd>
            {terminadas.length} de {a.pruebas.length} contestadas
          </dd>
        </div>
        <div>
          <dt>Primer código activado</dt>
          <dd>{fechaHoraLarga(a.primeraActivacion)}</dd>
        </div>
        <div>
          <dt>Empezó</dt>
          <dd>{inicioGlobal ? fechaHoraLarga(inicioGlobal) : "—"}</dd>
        </div>
        <div>
          <dt>Terminó</dt>
          <dd>{finGlobal ? fechaHoraLarga(finGlobal) : "—"}</dd>
        </div>
        <div>
          <dt>Tiempo total contestando</dt>
          <dd>{terminadas.length ? duracion(new Date(0).toISOString(), new Date(tiempoTotal).toISOString()) : "—"}</dd>
        </div>
      </dl>

      <ol className={s.pruebasFicha}>
        {a.pruebas.map((p) => {
          const e = ESTADO[p.estado];
          return (
            <li key={`${p.instrumento}-${p.activado}`} className={s.pruebaFicha}>
              <div className={s.pruebaFichaCabeza}>
                <div>
                  <h2>{NOMBRE_INSTRUMENTO[p.instrumento]}</h2>
                  <span className={s.estado} data-tono={e.tono}>
                    {e.texto}
                  </span>
                </div>
                {p.sesionId && p.hayPdf && (
                  <a
                    className={s.pdf}
                    href={`/api/mi-cuenta/informes/${p.sesionId}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FileText size={15} aria-hidden />
                    {p.estado === "firmado" ? "Informe firmado (PDF)" : "Informe preliminar (PDF)"}
                  </a>
                )}
              </div>

              <dl className={s.tiempos}>
                <div>
                  <dt>Código</dt>
                  <dd>
                    <code>{p.codigo}</code>
                  </dd>
                </div>
                <div>
                  <dt>Activado</dt>
                  <dd>{fechaHoraLarga(p.activado)}</dd>
                </div>
                <div>
                  <dt>Inicio</dt>
                  <dd>{p.inicio ? fechaHoraLarga(p.inicio) : "—"}</dd>
                </div>
                <div>
                  <dt>Fin</dt>
                  <dd>{p.fin ? fechaHoraLarga(p.fin) : "—"}</dd>
                </div>
                <div>
                  <dt>Duración</dt>
                  <dd>{p.inicio && p.fin ? duracion(p.inicio, p.fin) ?? "—" : "—"}</dd>
                </div>
                {!p.fin && p.estado !== "tiempo-agotado" && (
                  <div>
                    <dt>Puede contestar hasta</dt>
                    <dd>{fechaHoraLarga(p.limite)}</dd>
                  </div>
                )}
              </dl>

              {p.puntajes.length > 0 && (
                <div className={s.puntajes}>
                  <h3>Puntajes principales</h3>
                  <ul>
                    {p.puntajes.map((x) => (
                      <li key={x.etiqueta}>
                        <span>{x.etiqueta}</span>
                        <strong>{x.valor}</strong>
                      </li>
                    ))}
                  </ul>
                  <p className={s.sub}>
                    {p.estado === "firmado"
                      ? "La lectura completa, firmada por el psicólogo, está en el informe."
                      : "Puntajes calculados al terminar. El psicólogo los revisa antes de firmar el informe."}
                  </p>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </>
  );
}
