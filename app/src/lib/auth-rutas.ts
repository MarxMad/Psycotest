/**
 * Reglas de a dónde va cada rol. Módulo sin dependencias de servidor para
 * que la pantalla de login, el middleware, el layout del panel y el menú usen
 * exactamente la misma regla: tenerla duplicada en el cliente ya hizo que el
 * psicólogo cayera en el área de alumno en vez del panel.
 */

export type Rol = "admin" | "psicologo" | "profesor" | "aplicador" | "cliente";

/** Todos los roles, en orden de privilegio. */
export const ROLES: readonly Rol[] = ["admin", "psicologo", "profesor", "aplicador", "cliente"];

/** Nombre de cada rol para mostrar en pantalla. */
export const NOMBRE_ROL: Record<Rol, string> = {
  admin: "Administrador",
  psicologo: "Psicólogo",
  profesor: "Profesor",
  aplicador: "Aplicador",
  cliente: "Cliente / alumno",
};

/** Quienes operan la parte de Psicología Aplicada (pruebas). */
export const PERSONAL: Rol[] = ["admin", "psicologo"];

/**
 * Secciones del panel que abre cada rol. El administrador abre todo.
 *
 * - psicólogo: solo Psicología Aplicada — pruebas y participantes.
 * - profesor: solo las clases en vivo de los cursos que tiene asignados.
 *
 * Cursos, canales, expedientes, pagos, marketing y usuarios son del admin.
 */
const SECCIONES: Record<Exclude<Rol, "admin">, readonly string[]> = {
  psicologo: ["/admin/pruebas", "/admin/participantes"],
  profesor: ["/admin/clases-vivo"],
  aplicador: [],
  cliente: [],
};

/**
 * El personal opera el panel; el alumno, la empresa cliente y el aplicador,
 * no. Toda cuenta nueva nace como cliente: al panel solo se llega porque un
 * administrador lo decidió.
 */
export function operaElPanel(rol: Rol): boolean {
  return rol === "admin" || SECCIONES[rol]?.length > 0;
}

/** ¿Puede este rol abrir esta ruta del panel? */
export function puedeVerSeccion(rol: Rol, pathname: string): boolean {
  if (rol === "admin") return true;
  const propias = SECCIONES[rol] ?? [];
  return propias.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

/** Primera pantalla del panel para cada rol. */
export function inicioDelPanel(rol: Rol): string {
  if (rol === "admin") return "/admin";
  return SECCIONES[rol]?.[0] ?? "/mi-cuenta";
}

/**
 * Destino tras iniciar sesión, sin un `next` explícito.
 *
 * El alumno va a /mi-cuenta, que resuelve por sí misma a qué canal
 * pertenece y lo deja en la sección que le corresponde.
 */
export function homePathForUser(user: { rol: Rol }): string {
  return operaElPanel(user.rol) ? inicioDelPanel(user.rol) : "/mi-cuenta";
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
    if (!puedeVerSeccion(user.rol, next)) return inicioDelPanel(user.rol);
    return next;
  }

  return next;
}
