import { NextResponse } from "next/server";
import { clearSessionCookie, createSessionToken, setSessionCookie, signIn } from "@/lib/auth";

export async function POST(request: Request) {
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
}

export async function DELETE() {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
