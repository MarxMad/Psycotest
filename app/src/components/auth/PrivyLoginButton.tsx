"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken, useLogin, usePrivy } from "@privy-io/react-auth";
import { PrivyProvider } from "./PrivyProvider";
import s from "./PrivyLoginButton.module.css";

/**
 * Acceso con Privy. Tras confirmar la identidad, intercambia su token por la
 * sesión propia de la aplicación y manda a la persona a donde le corresponde.
 */
/**
 * Acceso con Privy, con su proveedor dentro.
 *
 * El SDK sólo se monta aquí: en el proveedor global rompía las páginas
 * públicas sobre HTTP ("Embedded wallet is only available over HTTPS") y
 * cargaba su peso en cada visita sin hacer falta.
 */
export function PrivyLoginButton({ next, salir }: { next?: string; salir?: boolean }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  if (!appId) return null;

  return (
    <PrivyProvider>
      <BotonPrivy next={next} salir={salir} />
    </PrivyProvider>
  );
}

function BotonPrivy({ next, salir }: { next?: string; salir?: boolean }) {
  const router = useRouter();
  const { ready, authenticated, logout } = usePrivy();
  const [canjeando, setCanjeando] = useState(false);
  /** Arranca cerrado cuando venimos de «Salir»: bloquea el canje desde el primer render. */
  const [cerrando, setCerrando] = useState(Boolean(salir));
  const [error, setError] = useState<string | null>(null);

  const canjearSesion = useCallback(async () => {
    setCanjeando(true);
    setError(null);
    try {
      const token = await getAccessToken();
      const r = await fetch("/api/auth/privy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, next }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "No se pudo iniciar sesión");
      // El servidor ya validó el destino contra el rol; no se sobreescribe.
      router.push(d.next);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      // La identidad quedó abierta en Privy pero no hay sesión en la app:
      // se cierra para que el siguiente intento empiece limpio.
      await logout().catch(() => {});
    } finally {
      setCanjeando(false);
    }
  }, [logout, next, router]);

  const { login } = useLogin({ onComplete: canjearSesion });

  /**
   * Venimos de pulsar «Salir»: antes de nada, se cierra también la sesión de
   * Privy. Si no, el canje de abajo volvía a entrar al instante y «Salir»
   * dejaba a la persona exactamente donde estaba, una y otra vez.
   */
  useEffect(() => {
    if (!salir) return;
    let vivo = true;

    // Si el SDK no llega a estar listo —no carga, el app id está mal— el
    // botón se quedaría deshabilitado para siempre. A los cinco segundos se
    // desbloquea: sin sesión de Privy que cerrar, no hay bucle que evitar.
    const limite = setTimeout(() => {
      if (vivo) setCerrando(false);
    }, 5000);

    if (ready) {
      void (async () => {
        await logout().catch(() => {});
        if (vivo) setCerrando(false);
      })();
    }

    return () => {
      vivo = false;
      clearTimeout(limite);
    };
  }, [salir, ready, logout]);

  // Si Privy ya tenía la sesión abierta, se canjea sin pedir nada.
  useEffect(() => {
    if (cerrando) return;
    if (ready && authenticated && !canjeando) void canjearSesion();
    // Solo al quedar listo: no re-disparar en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, authenticated, cerrando]);

  if (!ready || cerrando) {
    return (
      <button type="button" className={s.boton} disabled>
        {cerrando ? "Cerrando sesión…" : "Cargando…"}
      </button>
    );
  }

  return (
    <div className={s.wrap}>
      <button
        type="button"
        className={s.boton}
        onClick={() => login()}
        disabled={canjeando}
      >
        {canjeando ? "Entrando…" : "Entrar con mi correo"}
      </button>
      {error && <p className={s.error}>{error}</p>}
    </div>
  );
}
