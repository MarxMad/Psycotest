"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { AmbientBackground } from "@/components/AmbientBackground";
import { APP_NAME } from "@/lib/brand";
import { PrivyLoginButton } from "@/components/auth/PrivyLoginButton";
import { PARAM_SALIDA } from "@/lib/salir";
import s from "./login.module.css";

/**
 * El equipo entra sólo con Privy: un código al correo, sin contraseñas. El
 * botón canjea la sesión de Privy por la de la plataforma y redirige según
 * el rol.
 */
function LoginForm() {
  const params = useSearchParams();
  const nextParam = params.get("next");
  // Llega de pulsar «Salir»: hay que cerrar también la sesión de Privy.
  const salir = params.get(PARAM_SALIDA) === "1";
  const privyListo = Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID);

  return (
    <motion.div
      className={s.card}
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className="eyebrow">{APP_NAME}</span>
      <h1>Inicio de sesión</h1>

      {privyListo ? (
        <PrivyLoginButton next={nextParam || undefined} salir={salir} />
      ) : (
        <p className={s.error} role="alert">
          El acceso no está configurado: falta NEXT_PUBLIC_PRIVY_APP_ID.
        </p>
      )}
    </motion.div>
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
