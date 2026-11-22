import Link from "next/link";
import { asegurarSeccion } from "../guardia";
import { NOMBRE_INSTRUMENTO, NOMBRE_CORTO } from "@/lib/instrumentos";
import { fechaCorta, fechaHora } from "@/lib/formato";
import { ETIQUETA_ESTADO, panelDeEmpresa, type EstadoCodigo } from "@/lib/panel-empresa";
import { HORAS_PARA_CONTESTAR } from "@/lib/pruebas-catalogo";
import type { Instrumento } from "@/lib/storage";
import { Encabezado, Vacio } from "../Secciones";
import { CopiarCodigo } from "./CopiarCodigo";
import s from "./evaluaciones.module.css";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ tab?: string; prueba?: string; estado?: string }> };

const TONO: Record<EstadoCodigo, string> = {
  disponible: "ok",
  "en-curso": "aviso",
  terminado: "neutro",
  "tiempo-agotado": "alerta",
  vencido: "alerta",
  desactivado: "alerta",
};

/**
 * Panel de la empresa: cuántas pruebas le quedan, quién las ha contestado y
 * con qué resultados. Dos pestañas: Códigos y Aplicantes. Solo ve lo emitido
 * bajo sus propios códigos; nunca el panel completo.
 */
export default async function MisEvaluacionesPage({ searchParams }: Props) {
  const { user } = await asegurarSeccion("/mi-cuenta/evaluaciones");
  const { tab, prueba, estado } = await searchParams;
  const pestaña = tab === "aplicantes" ? "aplicantes" : "codigos";

  const { codigos, disponibles, aplicantes } = await panelDeEmpresa(user.id);
  const totalDisponibles = Object.values(disponibles).reduce((n, v) => n + (v ?? 0), 0);
  const contestadas = aplicantes.reduce(
    (n, a) => n + a.pruebas.filter((p) => p.estado === "firmado" || p.estado === "en-revision").length,
    0,
  );
  const firmadas = aplicantes.reduce((n, a) => n + a.pruebas.filter((p) => p.estado === "firmado").length, 0);

  if (codigos.length === 0) {
    return (
      <>
        <Encabezado titulo="Mis evaluaciones" texto="Tus códigos de evaluación, quién los usó y sus resultados." />
        <Vacio
          titulo="Todavía no tienes códigos"
          texto="Cuando compres pruebas, aquí verás cuántas te quedan, quién las ha contestado, sus puntajes y los informes en PDF."
          accion={
            <Link className="btn btn-primary" href="/#cotizador">
              Comprar pruebas
            </Link>
          }
        />
      </>
    );
  }

  const filtradas = codigos.filter(
    (c) =>
      (!prueba || c.pruebas.includes(prueba as Instrumento)) && (!estado || c.estado === estado),
  );
  const libresVisibles = filtradas.filter((c) => c.estado === "disponible" && c.completo);
  const enlace = (q: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ tab: pestaña, prueba, estado, ...q })) if (v) p.set(k, v);
    return `/mi-cuenta/evaluaciones?${p.toString()}`;
  };

  return (
    <>
      <Encabezado
        titulo="Mis evaluaciones"
        texto={`Cada código abre una prueba para una persona. Desde que lo activa tiene ${HORAS_PARA_CONTESTAR} horas para contestar; el informe lo firma un psicólogo.`}
      />

      <div className={s.cifras}>
        <div className={s.cifra}>
          <strong>{totalDisponibles}</strong>
          <span>pruebas disponibles</span>
        </div>
        <div className={s.cifra}>
          <strong>{aplicantes.length}</strong>
          <span>{aplicantes.length === 1 ? "aplicante" : "aplicantes"}</span>
        </div>
        <div className={s.cifra}>
          <strong>{contestadas}</strong>
          <span>pruebas contestadas</span>
        </div>
        <div className={s.cifra}>
          <strong>{firmadas}</strong>
          <span>informes firmados</span>
        </div>
      </div>

      <div className={s.disponibles} aria-label="Pruebas disponibles por tipo">
        {(Object.keys(NOMBRE_INSTRUMENTO) as Instrumento[])
          .filter((i) => codigos.some((c) => c.pruebas.includes(i)))
          .map((i) => (
            <Link
              key={i}
              href={enlace({ tab: "codigos", prueba: prueba === i ? undefined : i, estado: "disponible" })}
              className={s.chip}
              data-activo={prueba === i}
            >
              <span>{NOMBRE_INSTRUMENTO[i]}</span>
              <strong>{disponibles[i] ?? 0}</strong>
            </Link>
          ))}
      </div>

      <nav className={s.pestanas} aria-label="Secciones">
        <Link href={enlace({ tab: "codigos" })} className={s.pestana} aria-current={pestaña === "codigos" ? "page" : undefined}>
          Códigos <span>{codigos.length}</span>
        </Link>
        <Link
          href="/mi-cuenta/evaluaciones?tab=aplicantes"
          className={s.pestana}
          aria-current={pestaña === "aplicantes" ? "page" : undefined}
        >
          Aplicantes <span>{aplicantes.length}</span>
        </Link>
      </nav>

      {pestaña === "codigos" ? (
        <section>
          <div className={s.filtros}>
            {(["", "disponible", "en-curso", "terminado", "tiempo-agotado", "vencido"] as const).map((e) => (
              <Link
                key={e || "todos"}
                href={enlace({ estado: e || undefined })}
                className={s.filtro}
                data-activo={(estado ?? "") === e}
              >
                {e ? ETIQUETA_ESTADO[e] : "Todos"}
              </Link>
            ))}
            {libresVisibles.length > 1 && (
              <CopiarCodigo
                texto={libresVisibles.map((c) => `${c.pruebas.map((p) => NOMBRE_INSTRUMENTO[p]).join(", ")}: ${c.codigo}`).join("\n")}
                etiqueta={`Copiar ${libresVisibles.length} disponibles`}
              />
            )}
          </div>

          {filtradas.length === 0 ? (
            <p className={s.nada}>No hay códigos con ese filtro.</p>
          ) : (
            <div className={s.tablaCaja}>
              <table className={s.tabla}>
                <thead>
                  <tr>
                    <th>Prueba</th>
                    <th>Código</th>
                    <th>Estado</th>
                    <th>Aplicante</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((c) => (
                    <tr key={c.id}>
                      <td data-col="Prueba">
                        {c.pruebas.length > 2
                          ? `${c.pruebas.length} pruebas`
                          : c.pruebas.map((p) => NOMBRE_CORTO[p]).join(", ")}
                      </td>
                      <td data-col="Código">
                        <span className={s.codigo}>
                          <code>{c.codigo}</code>
                          {c.completo && c.estado === "disponible" && <CopiarCodigo texto={c.codigo} />}
                        </span>
                      </td>
                      <td data-col="Estado">
                        <span className={s.estado} data-tono={TONO[c.estado]}>
                          {ETIQUETA_ESTADO[c.estado]}
                        </span>
                        {c.estado === "en-curso" && c.limite && (
                          <small className={s.sub}>hasta {fechaHora(c.limite)}</small>
                        )}
                        {c.maxUsos > 1 && (
                          <small className={s.sub}>
                            {c.usos} de {c.maxUsos} usos
                          </small>
                        )}
                      </td>
                      <td data-col="Aplicante">
                        {c.persona ? (
                          <Link href={`/mi-cuenta/evaluaciones/aplicante/${encodeURIComponent(c.persona)}`}>
                            {c.persona}
                          </Link>
                        ) : (
                          <span className={s.sub}>—</span>
                        )}
                      </td>
                      <td data-col="Fecha">
                        {c.activado ? (
                          <>Activado {fechaCorta(c.activado)}</>
                        ) : c.vence ? (
                          <>Vence {fechaCorta(c.vence)}</>
                        ) : (
                          fechaCorta(c.creado)
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : aplicantes.length === 0 ? (
        <Vacio
          titulo="Nadie ha usado tus códigos aún"
          texto="En cuanto un candidato active un código, aparecerá aquí con sus tiempos, puntajes e informes."
        />
      ) : (
        <ul className={s.aplicantes}>
          {aplicantes.map((a) => {
            const hechas = a.pruebas.filter((p) => p.estado === "firmado" || p.estado === "en-revision").length;
            const firmadasA = a.pruebas.filter((p) => p.estado === "firmado").length;
            return (
              <li key={a.clave}>
                <Link href={`/mi-cuenta/evaluaciones/aplicante/${encodeURIComponent(a.nombre)}`} className={s.aplicante}>
                  <span className={s.inicial} aria-hidden>
                    {a.nombre.trim().charAt(0).toUpperCase()}
                  </span>
                  <span className={s.aplicanteTexto}>
                    <strong>{a.nombre}</strong>
                    <span>
                      {[a.puesto, a.empresa].filter(Boolean).join(" · ") || "Sin puesto indicado"}
                    </span>
                  </span>
                  <span className={s.aplicanteDatos}>
                    <span>
                      {hechas} de {a.pruebas.length} contestadas · {firmadasA} firmadas
                    </span>
                    <span className={s.sub}>Última actividad {fechaCorta(a.ultimaActividad)}</span>
                  </span>
                  <span className={s.pruebasMini}>
                    {a.pruebas.map((p) => (
                      <span key={`${p.instrumento}-${p.activado}`} data-estado={p.estado} title={NOMBRE_INSTRUMENTO[p.instrumento]}>
                        {NOMBRE_CORTO[p.instrumento]}
                      </span>
                    ))}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
