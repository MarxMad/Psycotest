import { NextResponse } from "next/server";
import {
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

  const { token, next } = (await request.json().catch(() => ({}))) as {
    token?: string;
    next?: string;
  };

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
