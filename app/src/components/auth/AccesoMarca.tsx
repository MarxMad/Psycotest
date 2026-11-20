"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { PrivyLoginButton } from "@/components/auth/PrivyLoginButton";
import type { ChannelId } from "@/lib/channels";
import s from "./AccesoMarca.module.css";

type Modo = "entrar" | "registro";

/** Lo que cada marca promete del otro lado de la puerta. */
const TEXTOS: Partial<Record<ChannelId, { cita: string; resalte: string; puntos: string[] }>> = {
  ige: {
    cita: "Tus cursos y tus clases en vivo,",
    resalte: "en un solo lugar.",
    puntos: [
      "Retoma tus cursos donde te quedaste",
      "Entra a tus clases en vivo y a sus grabaciones",
      "Descarga tus constancias",
    ],
  },
  psicologia: {
    cita: "Tus evaluaciones y sus informes,",
    resalte: "en un solo lugar.",
    puntos: [
      "Consulta los resultados de tus candidatos",
      "Descarga los informes interpretados",
      "Revisa tus códigos y cuántas aplicaciones te quedan",
    ],
  },
};

/**
 * Inicio de sesión con la marca del dominio (IGE, Psicología Aplicada).
 *
 * Igual que el de CEDUCT: código al correo con Privy, que también crea la
 * cuenta, o correo y contraseña contra la sesión de la plataforma.
 */
export function AccesoMarca({
  canal,
  marca,
  logo,
  estilo,
  fuentes,
  modoInicial,
  siguiente,
  salir = false,
}: {
  canal: ChannelId;
  marca: string;
  logo: string;
  estilo: React.CSSProperties;
  fuentes: string;
  modoInicial: Modo;
  siguiente: string;
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
  const textos = TEXTOS[canal] ?? TEXTOS.ige!;

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
    <main className={`${s.pagina} ${fuentes}`} data-canal={canal} style={estilo}>
      <header className={s.barra}>
        <a href="/" className={s.marca} aria-label={`${marca}, inicio`}>
          <img src={logo} alt="" />
          <span>{marca}</span>
        </a>
        <a href="/" className={s.volver}>
          Volver al sitio
        </a>
      </header>

      <div className={s.rejilla}>
        <section className={s.arte} aria-hidden>
          <p className={s.cita}>
            {textos.cita} <span>{textos.resalte}</span>
          </p>
          <ul>
            {textos.puntos.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </section>

        <section className={s.caja}>
          <div className={s.pestanas} role="tablist" aria-label="Acceso">
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
                <h1 className={s.titulo}>Bienvenido de vuelta.</h1>
                {hayPrivy && (
                  <>
                    <div className={s.privy}>
                      <PrivyLoginButton next={siguiente} salir={salir} />
                    </div>
                    <p className={s.separador}>
                      <span>o con tu contraseña</span>
                    </p>
                  </>
                )}
                <form className={s.form} onSubmit={entrar}>
                  <label className={s.campo}>
                    <span>Correo electrónico</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="username"
                      required
                    />
                  </label>
                  <label className={s.campo}>
                    <span>Contraseña</span>
                    <span className={s.clave}>
                      <input
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
                  {error && (
                    <p className={s.error} role="alert">
                      {error}
                    </p>
                  )}
                  <button type="submit" className={s.boton} disabled={cargando}>
                    <LogIn size={18} aria-hidden /> {cargando ? "Entrando…" : "Entrar"}
                  </button>
                </form>
                <p className={s.pie}>
                  ¿Primera vez?{" "}
                  <button type="button" onClick={() => setModo("registro")}>
                    Crea tu cuenta
                  </button>
                </p>
              </>
            ) : (
              <>
                <h1 className={s.titulo}>Crea tu cuenta.</h1>
                <p className={s.lead}>
                  Sin contraseñas que recordar: te enviamos un código a tu correo cada vez que entras.
                </p>
                {hayPrivy ? (
                  <div className={s.privy}>
                    <PrivyLoginButton next={siguiente} salir={salir} />
                  </div>
                ) : (
                  <p className={s.lead}>Tu cuenta se crea con tu primera compra, con el correo que indiques al pagar.</p>
                )}
                <p className={s.pie}>
                  ¿Ya tienes cuenta?{" "}
                  <button type="button" onClick={() => setModo("entrar")}>
                    Inicia sesión
                  </button>
                </p>
              </>
            )}
          </div>
          <p className={s.meta}>
            Al continuar aceptas el <a href="/legal">aviso de privacidad</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
