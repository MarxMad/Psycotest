"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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
  // Cada marca tiene su propia pantalla de acceso: al cerrar se queda en ella.
  const ruta = usePathname() || "/login";
  const { ready, authenticated, logout } = usePrivy();
  const [canjeando, setCanjeando] = useState(false);
  /** Arranca cerrado cuando venimos de «Salir»: bloquea el canje desde el primer render. */
  const [cerrando, setCerrando] = useState(Boolean(salir));
  const [error, setError] = useState<string | null>(null);

  /**
   * `logout` cambia de identidad en cada render del proveedor de Privy. Si
   * entrara en las dependencias del efecto de salida, cerrar la sesión
   * provocaría otro render, el efecto volvería a dispararse y Privy recibiría
   * una avalancha de peticiones: primero 429 —y un error de CORS, porque esa
   * respuesta no trae cabeceras— y luego 400, con la sesión ya destruida. Se
   * guarda en una referencia para que los efectos dependan sólo del estado.
   */
  const logoutRef = useRef(logout);
  logoutRef.current = logout;

  /** Evita dos canjes a la vez: el automático y el de «onComplete». */
  const canjeEnCurso = useRef(false);

  const canjearSesion = useCallback(async (manual: boolean) => {
    if (canjeEnCurso.current) return;
    canjeEnCurso.current = true;
    setCanjeando(true);
    setError(null);
    try {
      const token = await getAccessToken();
      const r = await fetch("/api/auth/privy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, next, manual }),
      });
      const d = await r.json();
      // Salió a propósito: la sesión de Privy que quedaba se cierra en
      // silencio y el botón espera a que la persona decida entrar.
      if (r.status === 409 && d.code === "SALIDA") {
        await logoutRef.current().catch(() => {});
        return;
      }
      if (!r.ok) throw new Error(d.error ?? "No se pudo iniciar sesión");
      // El servidor ya validó el destino contra el rol; no se sobreescribe.
      router.push(d.next);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      // La identidad quedó abierta en Privy pero no hay sesión en la app:
      // se cierra para que el siguiente intento empiece limpio.
      await logoutRef.current().catch(() => {});
    } finally {
      canjeEnCurso.current = false;
      setCanjeando(false);
    }
  }, [next, router]);

  const canjearRef = useRef(canjearSesion);
  canjearRef.current = canjearSesion;

  /**
   * Estable a propósito: Privy la recibe en cada render.
   *
   * Privy también la llama al montar si su sesión ya estaba abierta
   * (`wasAlreadyAuthenticated`). Ese caso no es un «Entrar»: lo atiende el
   * efecto de abajo, que respeta el cierre en curso. Antes se canjeaba aquí
   * sin mirar nada, y al volver de «Salir» la persona entraba de nuevo sola.
   */
  const alEntrar = useCallback(({ wasAlreadyAuthenticated }: { wasAlreadyAuthenticated: boolean }) => {
    if (wasAlreadyAuthenticated) return;
    void canjearRef.current(true);
  }, []);
  const { login } = useLogin({ onComplete: alEntrar });

  /**
   * Red de seguridad: si el SDK no llega a estar listo —no carga, el app id
   * está mal— el botón se quedaría deshabilitado para siempre. A los cinco
   * segundos se desbloquea: sin sesión de Privy que cerrar, no hay bucle.
   */
  useEffect(() => {
    if (!salir) return;
    const limite = setTimeout(() => setCerrando(false), 5000);
    return () => clearTimeout(limite);
  }, [salir]);

  /** Un solo cierre por visita, pase lo que pase con los renders. */
  const cerroPrivy = useRef(false);

  /**
   * Venimos de pulsar «Salir»: antes de nada, se cierra también la sesión de
   * Privy. Si no, el canje de abajo volvía a entrar al instante y «Salir»
   * dejaba a la persona exactamente donde estaba, una y otra vez.
   */
  useEffect(() => {
    if (!salir || !ready || cerroPrivy.current) return;
    cerroPrivy.current = true;
    let vivo = true;

    void (async () => {
      // Sólo si hay algo que cerrar: pedirle a Privy que destruya una sesión
      // inexistente responde 400 «Error destroying session».
      if (authenticated) await logoutRef.current().catch(() => {});
      if (!vivo) return;
      setCerrando(false);
      // Se quita «salir» de la URL: ya no hay nada que cerrar, y sin esto una
      // recarga echaba de nuevo a quien acabara de entrar.
      router.replace(next ? `${ruta}?next=${encodeURIComponent(next)}` : ruta);
    })();

    return () => {
      vivo = false;
    };
  }, [salir, ready, authenticated, next, router, ruta]);

  // Si Privy ya tenía la sesión abierta, se canjea sin pedir nada.
  useEffect(() => {
    if (cerrando || !ready || !authenticated) return;
    void canjearRef.current(false);
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
        // Con Privy ya abierto, `login()` no hace nada: se canjea directo,
        // ahora sí como decisión de la persona.
        onClick={() => (authenticated ? void canjearRef.current(true) : login())}
        disabled={canjeando}
      >
        {canjeando ? "Entrando…" : "Entrar con mi correo"}
      </button>
      {error && <p className={s.error}>{error}</p>}
    </div>
  );
}
