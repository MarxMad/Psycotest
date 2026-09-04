/** Ruta base del módulo clínico (PAPI, Hartman, MABE, panel). */
export const PSYCOTEST_BASE = "/psycotest";

export const psycotest = {
  home: PSYCOTEST_BASE,
  /** Panel profesional — ruta real en app/src/app/login */
  login: "/login",
  acceso: `${PSYCOTEST_BASE}/acceso`,
  /** Dashboard admin — ruta real en app/src/app/admin */
  admin: "/admin",
  codigos: "/admin/pruebas/codigos",
  participantes: `${PSYCOTEST_BASE}/participantes`,
  papi: `${PSYCOTEST_BASE}/papi`,
  hartman: `${PSYCOTEST_BASE}/hartman`,
  mabe: `${PSYCOTEST_BASE}/mabe`,
} as const;
