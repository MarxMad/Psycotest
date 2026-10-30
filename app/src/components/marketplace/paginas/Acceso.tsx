"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LogIn } from "lucide-react";
import { PrivyLoginButton } from "@/components/auth/PrivyLoginButton";
import { RUTAS } from "@/lib/ceduct/rutas";
import s from "../mk.module.css";
import p from "./paginas.module.css";

type Modo = "entrar" | "registro";

/**
 * Inicio de sesión / registro del alumno.
 *
 * «Entrar» usa la sesión de la plataforma (/api/auth/login). El registro va
 * por el acceso con código al correo (Privy), que crea la cuenta al vuelo; si
 * Privy no está configurado, la cuenta se crea con la primera compra.
 */
export function Acceso({
  modoInicial,
  siguiente,
  salir = false,
}: {
  modoInicial: Modo;
  siguiente: string;
  /** Viene de «Cerrar sesión»: Privy también se cierra antes de ofrecer entrar. */
  salir?: boolean;
}) {
  const router = useRouter();
  const [modo, setModo] = useState<Modo>(modoInicial);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ver, setVer] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const hayPrivy = Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError("");
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!r.ok) {
        const d = (await r.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error ?? "Correo o contraseña incorrectos.");
      }
      router.push(siguiente);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setCargando(false);
    }
  }

  return (
    <div className={`${s.contenedor} ${p.acceso}`}>
      <div className={p.accesoArte} aria-hidden>
        <p className={p.accesoCita}>
          Tu certificado, tus cursos y tu avance, <span>en un solo lugar.</span>
        </p>
        <ul>
          <li>Retoma tus cursos donde te quedaste</li>
          <li>Descarga tus constancias y certificados</li>
          <li>Consulta tus pedidos y facturas</li>
        </ul>
      </div>

      <div className={`${s.tarjeta} ${p.accesoCaja}`}>
        <div className={p.pestanas} role="tablist" aria-label="Acceso">
          <button
            type="button"
            role="tab"
            id="tab-entrar"
            aria-selected={modo === "entrar"}
            aria-controls="panel-acceso"
            onClick={() => setModo("entrar")}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            role="tab"
            id="tab-registro"
            aria-selected={modo === "registro"}
            aria-controls="panel-acceso"
            onClick={() => setModo("registro")}
          >
            Crear cuenta
          </button>
        </div>

        <div id="panel-acceso" role="tabpanel" aria-labelledby={modo === "entrar" ? "tab-entrar" : "tab-registro"}>
          {modo === "entrar" ? (
            <>
              <h1 className={p.accesoTitulo}>Bienvenido de vuelta.</h1>
              {hayPrivy && (
                <>
                  <div className={p.privy}>
                    <PrivyLoginButton next={siguiente} salir={salir} />
                  </div>
                  <p className={p.separador}><span>o con tu contraseña</span></p>
                </>
              )}
              <form className={p.formAcceso} onSubmit={entrar}>
                <label className={s.campo}>
                  <span>Correo electrónico</span>
                  <input
                    className={s.entrada}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </label>
                <label className={s.campo}>
                  <span>Contraseña</span>
                  <span className={p.clave}>
                    <input
                      className={s.entrada}
                      type={ver ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setVer((v) => !v)}
                      aria-label={ver ? "Ocultar contraseña" : "Mostrar contraseña"}
                      aria-pressed={ver}
                    >
                      {ver ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
                    </button>
                  </span>
                </label>
                {error && <p className={s.error} role="alert">{error}</p>}
                <button type="submit" className={`${s.btn} ${s.btnPrimario} ${s.btnGrande} ${s.btnBloque}`} disabled={cargando}>
                  <LogIn size={18} aria-hidden /> {cargando ? "Entrando…" : "Entrar"}
                </button>
              </form>
              <p className={p.accesoPie}>
                ¿Primera vez? <button type="button" onClick={() => setModo("registro")}>Crea tu cuenta</button>
              </p>
            </>
          ) : (
            <>
              <h1 className={p.accesoTitulo}>Crea tu cuenta.</h1>
              <p className={s.lead}>
                Sin contraseñas que recordar: te enviamos un código a tu correo cada vez que entras.
              </p>
              {hayPrivy ? (
                <div className={p.privy}>
                  <PrivyLoginButton next={siguiente} salir={salir} />
                </div>
              ) : (
                <p className={p.nota}>
                  Tu cuenta se crea automáticamente con tu primera compra, con el correo que indiques al pagar.
                </p>
              )}
              <Link href={RUTAS.catalogo()} className={`${s.btn} ${s.btnSecundario} ${s.btnBloque}`} style={{ marginTop: 16 }}>
                Explorar el catálogo <ArrowRight size={16} aria-hidden />
              </Link>
              <p className={p.accesoPie}>
                ¿Ya tienes cuenta? <button type="button" onClick={() => setModo("entrar")}>Inicia sesión</button>
              </p>
            </>
          )}
        </div>
        <p className={s.meta}>
          Al continuar aceptas el <Link href={RUTAS.legal}>aviso de privacidad</Link>.
        </p>
      </div>
    </div>
  );
}
