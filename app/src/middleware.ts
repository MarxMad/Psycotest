import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { APPLICANT_COOKIE, verifyApplicantToken } from "@/lib/applicant-auth";
import type { Instrumento } from "@/lib/storage";
import { psycotest } from "@/lib/routes";
import {
  getChannelFromHost,
  isPlatformPath,
} from "@/lib/channels";

const COOKIE = "psycotest_session";

const TEST_PATHS = [
  "/papi",
  "/hartman",
  "/mabe",
  "/cleaver",
  "/psycotest/papi",
  "/psycotest/hartman",
  "/psycotest/mabe",
  "/psycotest/cleaver",
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
    if (pathname === p || pathname.startsWith(`${p}/`)) {
      const slug = p.split("/").pop();
      if (slug === "papi" || slug === "hartman" || slug === "mabe" || slug === "cleaver") {
        return slug;
      }
    }
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host");

  // --- Multi-canal: rewrite por subdominio ---
  if (!isPlatformPath(pathname) && !pathname.includes(".")) {
    const channel = getChannelFromHost(host);
    if (channel) {
      const url = request.nextUrl.clone();
      const suffix = pathname === "/" ? "" : pathname;
      url.pathname = `/sites/${channel.id}${suffix}`;
      const res = NextResponse.rewrite(url);
      res.headers.set("x-channel", channel.id);
      return res;
    }
  }

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

  if (
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/participantes") &&
    !pathname.startsWith("/psycotest/participantes")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE)?.value;
  if (!token) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  try {
    const { payload } = await jwtVerify(token, secret());
    const rol = payload.rol as string | undefined;

    // El aplicador no opera el panel: solo acompaña la aplicación de pruebas.
    if (rol !== "admin" && rol !== "psicologo") {
      return NextResponse.redirect(new URL("/consultorio/cursos", request.url));
    }

    // Secciones reservadas al administrador: personas, dinero y marca.
    const soloAdmin = ["/admin/usuarios", "/admin/pagos", "/admin/marketing"];
    if (rol !== "admin" && soloAdmin.some((r) => pathname.startsWith(r))) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    return NextResponse.next();
  } catch {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }
}

export const config = {
  matcher: [
    /*
     * Host rewrites + auth. Excluye estáticos.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|pdf|ico|mp4|webm)$).*)",
  ],
};
