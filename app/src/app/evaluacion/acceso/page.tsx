"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Clock, LogOut, Save, ShieldCheck } from "lucide-react";
import { FadeIn } from "@/components/motion";
import { LogoPsi } from "@/components/channels/psico/LogoPsi";
import type { Instrumento } from "@/lib/storage";
import { psycotest } from "@/lib/routes";
import { useApplicantSession } from "@/lib/applicant-client";
import s from "./acceso.module.css";
import { NOMBRE_INSTRUMENTO } from "@/lib/instrumentos";

const PRUEBAS: Record<Instrumento, { nombre: string; tint: string; href: string }> = {
  papi: { nombre: NOMBRE_INSTRUMENTO.papi, tint: "var(--papi)", href: psycotest.papi },
  hartman: { nombre: NOMBRE_INSTRUMENTO.hartman, tint: "var(--hartman)", href: psycotest.hartman },
  mabe: { nombre: NOMBRE_INSTRUMENTO.mabe, tint: "var(--mabe)", href: psycotest.mabe },
  cleaver: { nombre: NOMBRE_INSTRUMENTO.cleaver, tint: "var(--cleaver)", href: psycotest.cleaver },
  lifo: { nombre: NOMBRE_INSTRUMENTO.lifo, tint: "var(--lifo)", href: psycotest.lifo },
  socioeconomico: {
    nombre: NOMBRE_INSTRUMENTO.socioeconomico,
    tint: "var(--socioeconomico)",
    href: psycotest.socioeconomico,
  },
};

const ERRORES: Record<string, string> = {
  sesion: "Tu sesión expiró. Ingresa de nuevo tu código.",
  prueba: "Tu código no incluye esa prueba.",
  completada: "Ya completaste esa prueba con este código.",
};

function AccesoInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "";
  const errorParam = params.get("error");
  const { session, loading, setSession } = useApplicantSession();

  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [puesto, setPuesto] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (errorParam && ERRORES[errorParam]) setError(ERRORES[errorParam]);
  }, [errorParam]);

  useEffect(() => {
    if (!loading && session && next.startsWith("/")) {
      router.replace(next);
    }
  }, [loading, session, next, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError("");
    try {
      const res = await fetch("/api/acceso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo, nombre, empresa, puesto }),
      });
      const raw = await res.text();
      let data: { error?: string; session?: typeof session } = {};
      if (raw) {
        try {
          data = JSON.parse(raw);
        } catch {
          setError("Respuesta inválida del servidor.");
          return;
        }
      }
      if (!res.ok) {
        setError(data.error ?? "No se pudo validar el código");
        return;
      }
      if (data.session) setSession(data.session);
      if (next.startsWith("/")) router.push(next);
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setEnviando(false);
    }
  }

  async function salir() {
    await fetch("/api/acceso", { method: "DELETE" });
    setSession(null);
    router.refresh();
  }

  if (loading) {
    return (
      <main className={s.main}>
        <p className={s.muted}>Verificando acceso…</p>
      </main>
    );
  }

  if (session) {
    const pendientes = session.allowed.filter((i) => !session.completed.includes(i));
    const hechas = session.allowed.length - pendientes.length;
    return (
      <main className={s.main}>
        <FadeIn className={s.tablero}>
          <div className={s.tableroCabeza}>
            <div>
              <span className="eyebrow">Acceso autorizado</span>
              <h1>Hola, {session.nombre.split(" ")[0]}</h1>
              {session.label && <p className={s.sub}>{session.label}</p>}
            </div>
            <div className={s.avance} aria-label={`${hechas} de ${session.allowed.length} pruebas completadas`}>
              <strong>
                {hechas}/{session.allowed.length}
              </strong>
              <span>completadas</span>
            </div>
          </div>

          <ol className={s.grid}>
            {session.allowed.map((slug, i) => {
              const done = session.completed.includes(slug);
              const p = PRUEBAS[slug];
              return (
                <li key={slug}>
                  <Link
                    href={done ? "#" : p.href}
                    className={s.testCard}
                    data-done={done}
                    style={{ ["--tint" as string]: p.tint }}
                    aria-disabled={done}
                    onClick={(e) => done && e.preventDefault()}
                  >
                    <span className={s.testNum} aria-hidden>
                      {done ? <Check size={16} strokeWidth={2.5} /> : String(i + 1).padStart(2, "0")}
                    </span>
                    <strong>{p.nombre}</strong>
                    <span className={s.testEstado}>
                      {done ? (
                        "Completada"
                      ) : (
                        <>
                          Iniciar <ArrowRight size={15} aria-hidden />
                        </>
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>

          <p className={s.mensaje}>
            {pendientes.length === 0
              ? "Completaste todas las pruebas de tu código. Gracias: el psicólogo responsable revisará tus resultados."
              : "Elige una prueba pendiente. Puedes hacerlas en el orden que prefieras; tu avance se guarda."}
          </p>

          <button type="button" className={s.salir} onClick={salir}>
            <LogOut size={15} aria-hidden /> Salir
          </button>
        </FadeIn>
      </main>
    );
  }

  return (
    <main className={s.main}>
      <FadeIn className={s.tarjeta}>
        <aside className={s.lado}>
          <LogoPsi className={s.ladoLogo} color="#ffffff" />
          <p className={s.ladoMarca}>Sociedad de Psicología Aplicada A. C.</p>
          <h2 className={s.ladoTitulo}>Tu evaluación, en buenas manos.</h2>
          <ul className={s.ladoLista}>
            <li>
              <ShieldCheck size={18} aria-hidden />
              <span>
                <strong>Confidencial.</strong> Solo el psicólogo responsable ve tus respuestas.
              </span>
            </li>
            <li>
              <Save size={18} aria-hidden />
              <span>
                <strong>Tu avance se guarda.</strong> Si se corta la conexión, retomas donde ibas.
              </span>
            </li>
            <li>
              <Clock size={18} aria-hidden />
              <span>
                <strong>Sin prisa.</strong> No hay respuestas buenas ni malas: contesta con sinceridad.
              </span>
            </li>
          </ul>
        </aside>

        <div className={s.formulario}>
          <span className="eyebrow">Acceso del aplicante</span>
          <h1>Ingresa tu código</h1>
          <p className={s.sub}>
            Tu empresa o el psicólogo te dio un código de acceso. Con él entras a las pruebas que te
            corresponden.
          </p>

          <form className={s.form} onSubmit={onSubmit}>
            <label>
              Código de acceso
              <input
                className={s.codigo}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                placeholder="XXXX-XXXX-XXXX"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                required
              />
            </label>
            <label>
              Nombre completo
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Como aparece en tu identificación"
                autoComplete="name"
                required
              />
            </label>
            <div className={s.fila}>
              <label>
                <span>
                  Puesto <em>(opcional)</em>
                </span>
                <input value={puesto} onChange={(e) => setPuesto(e.target.value)} placeholder="Ej. Analista" />
              </label>
              <label>
                <span>
                  Empresa <em>(opcional)</em>
                </span>
                <input
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  placeholder="Si no viene en el código"
                  autoComplete="organization"
                />
              </label>
            </div>
            {error && (
              <p className={s.error} role="alert">
                {error}
              </p>
            )}
            <button type="submit" className={s.entrar} disabled={enviando}>
              {enviando ? "Validando…" : "Acceder a las pruebas"}
              {!enviando && <ArrowRight size={18} aria-hidden />}
            </button>
          </form>
          <p className={s.ayuda}>
            ¿No tienes código? Pídeselo a la empresa que te evalúa o al psicólogo que te atiende.
          </p>
        </div>
      </FadeIn>
    </main>
  );
}

export default function AccesoPage() {
  return (
    <Suspense fallback={<main className={s.main}><p className={s.muted}>Cargando…</p></main>}>
      <AccesoInner />
    </Suspense>
  );
}
