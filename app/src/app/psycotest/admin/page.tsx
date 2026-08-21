"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, KeyRound, Users } from "lucide-react";
import { FadeIn } from "@/components/motion";
import {
  dbSessionToMeta,
  fetchSessions,
} from "@/lib/api-client";
import { listarSesiones, type Instrumento, type MetaSesion } from "@/lib/storage";
import s from "./admin.module.css";

const ETIQUETAS: Record<Instrumento, string> = {
  papi: "PAPI",
  hartman: "Hartman",
  mabe: "MABE",
};

const COLORES: Record<Instrumento, string> = {
  papi: "var(--papi)",
  hartman: "var(--hartman)",
  mabe: "var(--mabe)",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mergeSesiones(servidor: MetaSesion[], local: MetaSesion[]): MetaSesion[] {
  const ids = new Set(servidor.map((x) => x.id));
  const extra = local.filter((x) => !ids.has(x.id));
  return [...servidor, ...extra].sort(
    (a, b) => new Date(b.iniciada).getTime() - new Date(a.iniciada).getTime(),
  );
}

export default function AdminPage() {
  const [sesiones, setSesiones] = useState<MetaSesion[]>([]);
  const [filtro, setFiltro] = useState<Instrumento | "">("");
  const [fuente, setFuente] = useState<"servidor" | "local">("servidor");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    async function load() {
      setLoading(true);
      const rows = await fetchSessions(filtro || undefined);
      if (cancel) return;
      if (rows.length > 0) {
        setSesiones(mergeSesiones(rows.map(dbSessionToMeta), listarSesiones(filtro || undefined)));
        setFuente("servidor");
      } else {
        setSesiones(listarSesiones(filtro || undefined));
        setFuente("local");
      }
      setLoading(false);
    }
    load();
    return () => {
      cancel = true;
    };
  }, [filtro]);

  const stats = {
    total: sesiones.length,
    terminadas: sesiones.filter((x) => x.terminada).length,
  };

  return (
    <main className={s.main}>
      <div className={s.wrap}>
        <FadeIn>
          <header className={s.head}>
            <div>
              <span className="eyebrow">Panel del psicólogo</span>
              <h1>Sesiones de evaluación</h1>
              <p>
                {fuente === "servidor"
                  ? "Sesiones guardadas en la base de datos del servidor."
                  : "Mostrando sesiones locales de este navegador."}
              </p>
            </div>
            <div className={s.headActions}>
              <Link href="/psycotest/admin/codigos" className="btn">
                <KeyRound size={16} />
                Códigos
              </Link>
              <Link href="/psycotest/participantes" className="btn">
                <Users size={16} />
                Participantes
              </Link>
              <Link href="/psycotest" className="btn btn-primary">
                Nueva aplicación
              </Link>
            </div>
          </header>
        </FadeIn>

        <FadeIn delay={0.08}>
          <div className={s.stats}>
            <div className={s.stat}>
              <BarChart3 size={18} className={s.statIcon} />
              <span className={s.statN}>{stats.total}</span>
              <span>Sesiones</span>
            </div>
            <div className={s.stat}>
              <span className={s.statN}>{stats.terminadas}</span>
              <span>Completadas</span>
            </div>
          </div>
        </FadeIn>

        <div className={s.filters}>
          <span>Filtrar:</span>
          {(["", "papi", "hartman", "mabe"] as const).map((f) => (
            <button
              key={f || "all"}
              type="button"
              className={filtro === f ? s.filterOn : s.filter}
              onClick={() => setFiltro(f)}
            >
              {f ? ETIQUETAS[f] : "Todas"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className={s.empty}>
            <p>Cargando sesiones…</p>
          </div>
        ) : sesiones.length === 0 ? (
          <div className={s.empty}>
            <p>No hay sesiones guardadas todavía.</p>
            <Link href="/psycotest" className="btn btn-primary">
              Aplicar una prueba
            </Link>
          </div>
        ) : (
          <div className={s.tableShell}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Instrumento</th>
                  <th>Participante</th>
                  <th>Puesto / contexto</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {sesiones.map((ses) => (
                  <tr key={ses.id}>
                    <td>
                      <span
                        className={s.badge}
                        style={{ ["--c" as string]: COLORES[ses.instrumento] }}
                      >
                        {ETIQUETAS[ses.instrumento]}
                      </span>
                    </td>
                    <td>
                      <strong>{ses.participante}</strong>
                    </td>
                    <td className={s.muted}>
                      {[ses.puesto, ses.empresa].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className={s.muted}>{fmt(ses.finalizadaEn ?? ses.iniciada)}</td>
                    <td>
                      {!ses.terminada ? (
                        <span className={s.pending}>En curso</span>
                      ) : ses.aprobada ? (
                        <span className={s.validated}>Validada</span>
                      ) : (
                        <span className={s.review}>Pendiente revisión</span>
                      )}
                    </td>
                    <td>
                      <Link href={`/psycotest/admin/${ses.id}`} className={s.link}>
                        Ver detalle →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
