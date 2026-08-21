import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { APPLICANT_COOKIE, verifyApplicantToken } from "@/lib/applicant-auth";
import { PSYCOTEST_BASE, psycotest } from "@/lib/routes";
import type { Instrumento } from "@/lib/storage";

const COOKIE = "psycotest_session";
const TEST_PATHS = [psycotest.papi, psycotest.hartman, psycotest.mabe] as const;

/** Rutas clínicas legacy (antes en /) → /psycotest/… */
const LEGACY_PREFIXES = [
  "/login",
  "/admin",
  "/participantes",
  "/acceso",
  "/papi",
  "/hartman",
  "/mabe",
] as const;

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    return new TextEncoder().encode("dev-secret-psycotest-min16");
  }
  return new TextEncoder().encode(s);
}

function instrumentFromPath(pathname: string): Instrumento | null {
  for (const p of TEST_PATHS) {
    if (pathname === p || pathname.startsWith(`${p}/`)) return p.slice(`${PSYCOTEST_BASE}/`.length) as Instrumento;
  }
  return null;
}

function legacyRedirect(pathname: string, request: NextRequest): NextResponse | null {
  for (const prefix of LEGACY_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      const url = request.nextUrl.clone();
      url.pathname = `${PSYCOTEST_BASE}${pathname}`;
      return NextResponse.redirect(url);
    }
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const legacy = legacyRedirect(pathname, request);
  if (legacy) return legacy;

  const instrumento = instrumentFromPath(pathname);
  if (instrumento) {
    const token = request.cookies.get(APPLICANT_COOKIE)?.value;
    if (!token) {
      const acceso = new URL(psycotest.acceso, request.url);
      acceso.searchParams.set("next", pathname);
      return NextResponse.redirect(acceso);
    }

    const session = await verifyApplicantToken(token);
    if (!session) {
      const acceso = new URL(psycotest.acceso, request.url);
      acceso.searchParams.set("next", pathname);
      acceso.searchParams.set("error", "sesion");
      const res = NextResponse.redirect(acceso);
      res.cookies.delete(APPLICANT_COOKIE);
      return res;
    }

    if (!session.allowed.includes(instrumento)) {
      const acceso = new URL(psycotest.acceso, request.url);
      acceso.searchParams.set("error", "prueba");
      return NextResponse.redirect(acceso);
    }

    if (session.completed.includes(instrumento)) {
      const acceso = new URL(psycotest.acceso, request.url);
      acceso.searchParams.set("error", "completada");
      return NextResponse.redirect(acceso);
    }

    return NextResponse.next();
  }

  if (!pathname.startsWith(psycotest.admin) && !pathname.startsWith(psycotest.participantes)) {
    if (pathname.includes("/consultorio/cursos/") && pathname.includes("/aprender")) {
      const token = request.cookies.get(COOKIE)?.value;
      if (!token) {
        const ingreso = new URL("/consultorio/ingreso", request.url);
        ingreso.searchParams.set("next", pathname);
        return NextResponse.redirect(ingreso);
      }
      try {
        await jwtVerify(token, secret());
      } catch {
        const ingreso = new URL("/consultorio/ingreso", request.url);
        ingreso.searchParams.set("next", pathname);
        return NextResponse.redirect(ingreso);
      }
    }
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE)?.value;
  if (!token) {
    const login = new URL(psycotest.login, request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  try {
    await jwtVerify(token, secret());
    return NextResponse.next();
  } catch {
    const login = new URL(psycotest.login, request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }
}

export const config = {
  matcher: [
    "/login",
    "/login/:path*",
    "/admin/:path*",
    "/participantes/:path*",
    "/acceso",
    "/acceso/:path*",
    "/papi",
    "/papi/:path*",
    "/hartman",
    "/hartman/:path*",
    "/mabe",
    "/mabe/:path*",
    "/psycotest/admin/:path*",
    "/psycotest/participantes/:path*",
    "/consultorio/cursos/:path*/aprender/:path*",
    "/psycotest/papi",
    "/psycotest/papi/:path*",
    "/psycotest/hartman",
    "/psycotest/hartman/:path*",
    "/psycotest/mabe",
    "/psycotest/mabe/:path*",
  ],
};
