/** Ruta base del módulo clínico (PAPI, Hartman, MABE, panel). */
export const PSYCOTEST_BASE = "/psycotest";

export const psycotest = {
  home: PSYCOTEST_BASE,
  login: `${PSYCOTEST_BASE}/login`,
  acceso: `${PSYCOTEST_BASE}/acceso`,
  admin: `${PSYCOTEST_BASE}/admin`,
  codigos: `${PSYCOTEST_BASE}/admin/codigos`,
  participantes: `${PSYCOTEST_BASE}/participantes`,
  papi: `${PSYCOTEST_BASE}/papi`,
  hartman: `${PSYCOTEST_BASE}/hartman`,
  mabe: `${PSYCOTEST_BASE}/mabe`,
} as const;
