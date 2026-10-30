import { NextResponse } from "next/server";
import { clearSessionCookie, createSessionToken, logAudit, setSessionCookie, signIn } from "@/lib/auth";
import { rateLimit, resetRateLimit } from "@/lib/rate-limit";

const VENTANA = 15 * 60 * 1000;

function ipDe(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "?";
}

function demasiados(retryAfterSec?: number) {
  return NextResponse.json(
    { error: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo." },
    { status: 429, headers: { "Retry-After": String(retryAfterSec ?? 900) } },
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    if (!body.email || !body.password) {
      return NextResponse.json({ error: "Credenciales requeridas" }, { status: 400 });
    }

    // Frena la adivinanza de contraseñas: por dirección y por cuenta.
    const porIp = rateLimit(`login:ip:${ipDe(request)}`, 30, VENTANA);
    if (!porIp.ok) return demasiados(porIp.retryAfterSec);
    const claveCorreo = `login:correo:${body.email.toLowerCase().trim()}`;
    const porCorreo = rateLimit(claveCorreo, 8, VENTANA);
    if (!porCorreo.ok) return demasiados(porCorreo.retryAfterSec);

    const result = await signIn(body.email, body.password);

    if (!result.ok) {
      if (result.reason === "db_error") {
        return NextResponse.json(
          { error: result.message, code: result.code },
          { status: result.status },
        );
      }
      return NextResponse.json({ error: "Correo o contraseña incorrectos" }, { status: 401 });
    }

    resetRateLimit(claveCorreo);
    const token = await createSessionToken(result.user);
    await setSessionCookie(token);
    await logAudit(result.user.id, "login", "user", result.user.id, { via: "password" }).catch(() => {});
    return NextResponse.json({ user: result.user });
  } catch (error) {
    console.error("[psycotest] POST /api/auth/login:", error);
    return NextResponse.json({ error: "No se pudo iniciar sesión. Intente de nuevo." }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await clearSessionCookie();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[psycotest] DELETE /api/auth/login:", error);
    return NextResponse.json({ ok: true });
  }
}
