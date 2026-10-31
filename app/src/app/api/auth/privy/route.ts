import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  COOKIE_SALIDA,
  createSessionToken,
  logAudit,
  resolvePostLoginPath,
  setSessionCookie,
} from "@/lib/auth";
import { privyConfigurado, verificarToken } from "@/lib/privy";
import { usuarioDesdePrivy } from "@/lib/privy-usuarios";

/**
 * Intercambia el token de Privy por la sesión propia de la aplicación.
 * El cliente lo llama una vez que Privy confirmó el acceso.
 */
export async function POST(request: Request) {
  if (!privyConfigurado()) {
    return NextResponse.json(
      { error: "Privy no está configurado en este entorno." },
      { status: 503 },
    );
  }

  const { token, next, manual } = (await request.json().catch(() => ({}))) as {
    token?: string;
    next?: string;
    /** La persona pulsó «Entrar»; si no, es el canje automático de una sesión de Privy abierta. */
    manual?: boolean;
  };

  // Quien pulsó «Salir» no vuelve a entrar solo aunque Privy siga abierto en
  // su navegador: tiene que pedirlo.
  if (!manual && (await cookies()).get(COOKIE_SALIDA)) {
    return NextResponse.json({ error: "Sesión cerrada.", code: "SALIDA" }, { status: 409 });
  }

  const identidad = await verificarToken(token);
  if (!identidad) {
    return NextResponse.json({ error: "Sesión de Privy no válida." }, { status: 401 });
  }

  if (!identidad.email) {
    return NextResponse.json(
      { error: "Tu cuenta de Privy no tiene un correo asociado. Entra con correo." },
      { status: 400 },
    );
  }

  try {
    const user = await usuarioDesdePrivy(identidad);
    if (!user) {
      return NextResponse.json({ error: "No se pudo resolver la cuenta." }, { status: 500 });
    }

    const sesion = await createSessionToken(user);
    await setSessionCookie(sesion);
    await logAudit(user.id, "login", "user", user.id, { via: "privy" });

    // El destino lo decide el servidor: es quien conoce el rol.
    return NextResponse.json({ user, next: resolvePostLoginPath(user, next) });
  } catch (error) {
    console.error("[auth/privy]", error);
    return NextResponse.json({ error: "Error al iniciar sesión." }, { status: 500 });
  }
}
