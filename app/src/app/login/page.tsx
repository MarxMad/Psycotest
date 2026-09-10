"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { AmbientBackground } from "@/components/AmbientBackground";
import { APP_NAME } from "@/lib/brand";
import s from "./login.module.css";

type LoginUser = { id: string; email: string; nombre: string; rol: string };

function homeForRole(rol: string) {
  return rol === "admin" ? "/admin" : "/consultorio/cursos";
}

function resolveNext(rol: string, next: string | null) {
  const fallback = homeForRole(rol);
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  if (next.startsWith("/admin") || next.startsWith("/participantes")) {
    return rol === "admin" ? next : fallback;
  }
  return next;
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const nextParam = params.get("next");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Correo o contraseña incorrectos");
      return;
    }
    const data = (await res.json()) as { user?: LoginUser };
    const rol = data.user?.rol ?? "psicologo";
    router.push(resolveNext(rol, nextParam));
    router.refresh();
  }

  return (
    <motion.form
      className={s.card}
      onSubmit={onSubmit}
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className="eyebrow">{APP_NAME}</span>
      <h1>Inicio de sesión</h1>
      <p className={s.sub}>
        Portal único para miembros. Según tu cuenta entrarás al panel de administración o a tus
        cursos.
      </p>

      <label>
        Correo
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          required
        />
      </label>
      <label>
        Contraseña
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </label>

      <AnimatePresence>
        {error && (
          <motion.p
            className={s.error}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <motion.button
        type="submit"
        className="btn btn-primary"
        disabled={loading}
        whileTap={{ scale: 0.98 }}
      >
        {loading ? "Entrando…" : "Entrar"}
      </motion.button>

      <p className={s.hint}>
        Admin: <code>admin@sistemapsic.local</code> / <code>sistemapsic2026</code>
        <br />
        Alumno demo: <code>alumno@sistemapsic.local</code> / <code>alumno2026</code>
      </p>
      <Link href="/" className={s.back}>
        ← Volver al inicio
      </Link>
    </motion.form>
  );
}

export default function LoginPage() {
  return (
    <>
      <AmbientBackground />
      <main className={s.main}>
        <Suspense fallback={<div className={s.card}>Cargando…</div>}>
          <LoginForm />
        </Suspense>
      </main>
    </>
  );
}
