import { NextResponse } from "next/server";
import { clearSessionCookie, createSessionToken, setSessionCookie, signIn } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    if (!body.email || !body.password) {
      return NextResponse.json({ error: "Credenciales requeridas" }, { status: 400 });
    }

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

    const token = await createSessionToken(result.user);
    await setSessionCookie(token);
    return NextResponse.json({ user: result.user });
  } catch (error) {
    console.error("[psycotest] POST /api/auth/login:", error);
    const message =
      error instanceof Error ? error.message : "No se pudo iniciar sesión. Intente de nuevo.";
    return NextResponse.json({ error: message }, { status: 500 });
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
