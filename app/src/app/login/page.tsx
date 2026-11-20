"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { LayoutDashboard, Lock, ShieldCheck } from "lucide-react";
import { PrivyLoginButton } from "@/components/auth/PrivyLoginButton";
import { PARAM_SALIDA } from "@/lib/salir";
import { FUENTES_CANAL } from "@/lib/channel-fonts";
import s from "./login.module.css";

/**
 * Entrada al panel de administración, sólo para el equipo (Privy: un código
 * al correo).
 *
 * No lleva marcas ni nombres: para alumnos y clientes cada empresa es una
 * plataforma distinta, y esta pantalla no debe delatar que comparten panel.
 * Si un alumno entra aquí, el servidor no le abre sesión y lo manda a «Mi
 * cuenta» en el sitio de su empresa.
 */
function Tarjeta() {
  const params = useSearchParams();
  const nextParam = params.get("next");
  // Llega de pulsar «Salir»: hay que cerrar también la sesión de Privy.
  const salir = params.get(PARAM_SALIDA) === "1";
  const privyListo = Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID);

  return (
    <div className={s.tarjeta}>
      <section className={s.lado} aria-hidden>
        <span className={s.ladoIcono}>
          <LayoutDashboard size={26} />
        </span>
        <p className={s.ladoEyebrow}>Panel de administración</p>
        <h2 className={s.ladoTitulo}>Operación, cobros y resultados en un solo lugar.</h2>
        <p className={s.ladoPie}>
          <ShieldCheck size={16} /> Cada persona ve solo las secciones de su rol.
        </p>
      </section>

      <section className={s.forma}>
        <p className={s.eyebrow}>Acceso del equipo</p>
        <h1 className={s.titulo}>Inicia sesión</h1>
        <p className={s.sub}>Entra con tu correo de trabajo. Te enviamos un código; no hay contraseñas que recordar.</p>

        {privyListo ? (
          <div className={s.privy}>
            <PrivyLoginButton next={nextParam || undefined} salir={salir} panel />
          </div>
        ) : (
          <p className={s.error} role="alert">
            El acceso no está configurado: falta NEXT_PUBLIC_PRIVY_APP_ID.
          </p>
        )}
      </section>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className={`${s.pagina} ${FUENTES_CANAL.psicologia.className}`}>
      <header className={s.barra}>
        <span className={s.barraMarca}>
          <LayoutDashboard size={20} aria-hidden />
          <span>Panel de administración</span>
        </span>
        <span className={s.sello}>
          <Lock size={14} aria-hidden /> Uso exclusivo del equipo
        </span>
      </header>

      <main className={s.main}>
        <Suspense fallback={<div className={s.tarjeta} />}>
          <Tarjeta />
        </Suspense>
      </main>
    </div>
  );
}
