"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ConsultorioNav } from "../ConsultorioNav";
import { BrandShell } from "../BrandShell";
import { psycotest } from "@/lib/routes";
import c from "../cursos/cursos.module.css";

function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/consultorio/cursos";
  const [mode, setMode] = useState<"login" | "register">("login");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (mode === "register") {
      const res = await fetch("/api/courses/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, nombre }),
      });
      setLoading(false);
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "No se pudo crear la cuenta");
        return;
      }
      router.push(next);
      router.refresh();
      return;
    }

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Correo o contraseña incorrectos");
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <BrandShell>
      <ConsultorioNav />
      <div className={c.authPage}>
      <form className={c.authCard} onSubmit={onSubmit}>
        <h1>{mode === "login" ? "Iniciar sesión" : "Crear cuenta"}</h1>
        <p>Accede a tus cursos grabados y lleva el registro de tu avance.</p>

        <div className={c.authTabs}>
          <button
            type="button"
            className={`${c.authTab}${mode === "login" ? ` ${c.authTabActive}` : ""}`}
            onClick={() => setMode("login")}
          >
            Entrar
          </button>
          <button
            type="button"
            className={`${c.authTab}${mode === "register" ? ` ${c.authTabActive}` : ""}`}
            onClick={() => setMode("register")}
          >
            Registrarme
          </button>
        </div>

        {mode === "register" ? (
          <label>
            Nombre completo
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} required autoComplete="name" />
          </label>
        ) : null}

        <label>
          Correo
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </label>

        {error ? <p className={c.error}>{error}</p> : null}

        <button type="submit" className={c.btnPrimary} disabled={loading}>
          {loading ? "Espera…" : mode === "login" ? "Entrar" : "Crear cuenta"}
        </button>

        <p className={c.checkoutFine} style={{ marginTop: "1rem" }}>
          ¿Eres psicólogo del panel clínico? <Link href={psycotest.login}>Acceso profesional</Link>
        </p>
      </form>
      </div>
    </BrandShell>
  );
}

export default function IngresoPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}
