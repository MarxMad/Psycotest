import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { APPLICANT_COOKIE, verifyApplicantToken } from "@/lib/applicant-auth";
import type { Instrumento } from "@/lib/storage";

const COOKIE = "psycotest_session";
const TEST_PATHS = ["/papi", "/hartman", "/mabe"] as const;

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    return new TextEncoder().encode("dev-secret-psycotest-min16");
  }
  return new TextEncoder().encode(s);
}

function instrumentFromPath(pathname: string): Instrumento | null {
  for (const p of TEST_PATHS) {
    if (pathname === p || pathname.startsWith(`${p}/`)) return p.slice(1) as Instrumento;
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const instrumento = instrumentFromPath(pathname);
  if (instrumento) {
    const token = request.cookies.get(APPLICANT_COOKIE)?.value;
    if (!token) {
      const acceso = new URL("/acceso", request.url);
      acceso.searchParams.set("next", pathname);
      return NextResponse.redirect(acceso);
    }

    const session = await verifyApplicantToken(token);
    if (!session) {
      const acceso = new URL("/acceso", request.url);
      acceso.searchParams.set("next", pathname);
      acceso.searchParams.set("error", "sesion");
      const res = NextResponse.redirect(acceso);
      res.cookies.delete(APPLICANT_COOKIE);
      return res;
    }

    if (!session.allowed.includes(instrumento)) {
      const acceso = new URL("/acceso", request.url);
      acceso.searchParams.set("error", "prueba");
      return NextResponse.redirect(acceso);
    }

    if (session.completed.includes(instrumento)) {
      const acceso = new URL("/acceso", request.url);
      acceso.searchParams.set("error", "completada");
      return NextResponse.redirect(acceso);
    }

    return NextResponse.next();
  }

  if (!pathname.startsWith("/admin") && !pathname.startsWith("/participantes")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE)?.value;
  if (!token) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  try {
    await jwtVerify(token, secret());
    return NextResponse.next();
  } catch {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/participantes/:path*",
    "/papi",
    "/papi/:path*",
    "/hartman",
    "/hartman/:path*",
    "/mabe",
    "/mabe/:path*",
  ],
};
