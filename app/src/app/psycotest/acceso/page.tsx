"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { AmbientBackground } from "@/components/AmbientBackground";
import { FadeIn } from "@/components/motion";
import type { Instrumento } from "@/lib/storage";
import { useApplicantSession } from "@/lib/applicant-client";
import s from "./acceso.module.css";

const PRUEBAS: Record<Instrumento, { nombre: string; tint: string }> = {
  papi: { nombre: "PAPI", tint: "var(--papi)" },
  hartman: { nombre: "Hartman", tint: "var(--hartman)" },
  mabe: { nombre: "MABE", tint: "var(--mabe)" },
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
    return (
      <main className={s.main}>
        <FadeIn className={s.panel}>
          <span className="eyebrow">Acceso autorizado</span>
          <h1>Hola, {session.nombre.split(" ")[0]}</h1>
          {session.label && <p className={s.sub}>{session.label}</p>}

          <div className={s.grid}>
            {session.allowed.map((slug) => {
              const done = session.completed.includes(slug);
              const p = PRUEBAS[slug];
              return (
                <Link
                  key={slug}
                  href={done ? "#" : `/${slug}`}
                  className={s.testCard}
                  data-done={done}
                  style={{ ["--tint" as string]: p.tint }}
                  aria-disabled={done}
                  onClick={(e) => done && e.preventDefault()}
                >
                  <strong>{p.nombre}</strong>
                  <span>{done ? "Completada" : "Iniciar →"}</span>
                </Link>
              );
            })}
          </div>

          {pendientes.length === 0 ? (
            <p className={s.mensaje}>Completaste todas las pruebas de tu código. Pronto sabrás tus resultados.</p>
          ) : (
            <p className={s.mensaje}>Selecciona una prueba pendiente para comenzar.</p>
          )}

          <button type="button" className="btn" onClick={salir}>
            Cerrar sesión de aplicante
          </button>
        </FadeIn>
      </main>
    );
  }

  return (
    <>
      <AmbientBackground />
      <main className={s.main}>
        <FadeIn className={s.panel}>
          <span className={s.iconWrap}>
            <KeyRound size={28} strokeWidth={1.5} />
          </span>
          <span className="eyebrow">Acceso del aplicante</span>
          <h1>Ingresa tu código</h1>
          <p className={s.sub}>
            Tu empresa o el psicólogo te proporcionó un código de acceso. Sin él no es posible aplicar
            las pruebas.
          </p>

          <form className={s.form} onSubmit={onSubmit}>
            <label>
              Código de acceso
              <input
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                placeholder="XXXX-XXXX-XXXX"
                autoComplete="off"
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
                required
              />
            </label>
            <label>
              Puesto (opcional)
              <input value={puesto} onChange={(e) => setPuesto(e.target.value)} placeholder="Ej. Analista" />
            </label>
            <label>
              Empresa (opcional)
              <input value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Si no viene en el código" />
            </label>
            {error && <p className={s.error}>{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={enviando}>
              {enviando ? "Validando…" : "Acceder a las pruebas"}
            </button>
          </form>
        </FadeIn>
      </main>
    </>
  );
}

export default function AccesoPage() {
  return (
    <Suspense fallback={<main className={s.main}><p className={s.muted}>Cargando…</p></main>}>
      <AccesoInner />
    </Suspense>
  );
}
