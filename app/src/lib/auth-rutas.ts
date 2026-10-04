/**
 * Reglas de a dónde va cada rol. Módulo sin dependencias de servidor para
 * que la pantalla de login y el middleware usen exactamente la misma regla:
 * tenerla duplicada en el cliente ya hizo que el psicólogo cayera en el área
 * de alumno en vez del panel.
 */

export type Rol = "admin" | "psicologo" | "aplicador";

/** El personal opera el panel; el aplicante y el alumno, no. */
export function operaElPanel(rol: Rol): boolean {
  return rol === "admin" || rol === "psicologo";
}

/** Secciones del panel reservadas al administrador. */
export const SOLO_ADMIN = ["/admin/usuarios", "/admin/pagos", "/admin/marketing"] as const;

export function esSoloAdmin(pathname: string): boolean {
  return SOLO_ADMIN.some((r) => pathname.startsWith(r));
}

/** Destino tras iniciar sesión, sin un `next` explícito. */
export function homePathForUser(user: { rol: Rol }): string {
  return operaElPanel(user.rol) ? "/admin" : "/consultorio/cursos";
}

/** Resuelve `?next=` sin permitir que alguien llegue donde no le toca. */
export function resolvePostLoginPath(
  user: { rol: Rol },
  next: string | null | undefined,
): string {
  const fallback = homePathForUser(user);

  // Solo rutas internas: evita redirigir a un dominio ajeno.
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;

  if (next.startsWith("/admin")) {
    if (!operaElPanel(user.rol)) return fallback;
    if (user.rol !== "admin" && esSoloAdmin(next)) return "/admin";
    return next;
  }

  return next;
}
