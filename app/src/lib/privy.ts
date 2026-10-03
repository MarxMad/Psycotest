/**
 * Autenticación con Privy.
 *
 * Privy es la fuente de verdad de la identidad (quién inició sesión y con qué
 * correo). El rol NO vive en Privy: se resuelve aquí, contra la lista de
 * correos administradores y contra la tabla `users` de la base.
 *
 * Variables necesarias:
 *   NEXT_PUBLIC_PRIVY_APP_ID   — id público de la app (lo lee el navegador)
 *   PRIVY_APP_SECRET           — secreto de servidor, nunca al cliente
 *   ADMIN_EMAILS               — correos admin separados por coma
 */

import { PrivyClient } from "@privy-io/server-auth";
import type { AuthUser } from "@/lib/auth";

export const PRIVY_COOKIE = "privy-token";

function appId(): string {
  const v = process.env.NEXT_PUBLIC_PRIVY_APP_ID?.trim();
  if (!v) throw new Error("Falta NEXT_PUBLIC_PRIVY_APP_ID");
  return v;
}

function appSecret(): string {
  const v = process.env.PRIVY_APP_SECRET?.trim();
  if (!v) throw new Error("Falta PRIVY_APP_SECRET");
  return v;
}

/** ¿Está Privy configurado en este entorno? */
export function privyConfigurado(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_PRIVY_APP_ID?.trim() && process.env.PRIVY_APP_SECRET?.trim(),
  );
}

let cliente: PrivyClient | null = null;

export function getPrivy(): PrivyClient {
  if (!cliente) cliente = new PrivyClient(appId(), appSecret());
  return cliente;
}

/**
 * Correos con rol de administrador, desde ADMIN_EMAILS.
 * Se normalizan a minúsculas para comparar sin sorpresas.
 */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function esAdminPorCorreo(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}

export type PrivyIdentidad = {
  privyId: string;
  email: string | null;
  /** Rol derivado: admin si está en ADMIN_EMAILS */
  rolSugerido: AuthUser["rol"];
};

/**
 * Verifica el token de sesión de Privy y devuelve la identidad.
 * Devuelve null si el token falta, expiró o no es válido.
 */
export async function verificarToken(token: string | undefined): Promise<PrivyIdentidad | null> {
  if (!token || !privyConfigurado()) return null;

  try {
    const privy = getPrivy();
    const claims = await privy.verifyAuthToken(token);
    const user = await privy.getUserById(claims.userId);

    const email =
      user.email?.address ??
      user.google?.email ??
      (user.linkedAccounts.find((a) => "address" in a && typeof a.address === "string" && a.address.includes("@")) as
        | { address?: string }
        | undefined)?.address ??
      null;

    return {
      privyId: claims.userId,
      email,
      rolSugerido: esAdminPorCorreo(email) ? "admin" : "psicologo",
    };
  } catch {
    return null;
  }
}
