/** Ruta pública del módulo de evaluación (antes /psycotest). */
export const EVAL_BASE = "/evaluacion";

/** @deprecated Usar EVAL_BASE */
export const PSYCOTEST_BASE = EVAL_BASE;

export const evaluacion = {
  home: EVAL_BASE,
  login: "/login",
  acceso: `${EVAL_BASE}/acceso`,
  admin: "/admin",
  codigos: "/admin/pruebas/codigos",
  participantes: `${EVAL_BASE}/participantes`,
  papi: `${EVAL_BASE}/papi`,
  hartman: `${EVAL_BASE}/hartman`,
  mabe: `${EVAL_BASE}/mabe`,
} as const;

/** @deprecated Prefer `evaluacion` */
export const psycotest = evaluacion;
