/**
 * Persistencia de sesiones (localStorage → mismo contrato que PostgreSQL).
 */

export type Instrumento = "papi" | "hartman" | "mabe";

export interface MetaSesion {
  id: string;
  instrumento: Instrumento;
  participante: string;
  puesto?: string;
  empresa?: string;
  iniciada: string;
  actualizada: string;
  finalizadaEn?: string;
  terminada: boolean;
  aprobada?: boolean;
}

export interface Sesion<TResp = unknown, TCalif = unknown> extends MetaSesion {
  respuestas: TResp;
  calificacion?: TCalif;
  interpretacion?: string;
  notasPsicologo?: string;
  aprobada?: boolean;
  validityFlags?: string[];
}

const PREFIJO_SESION = "psycotest:sesion:";
const PREFIJO_BORRADOR = "psycotest:borrador:";
const INDICE = "psycotest:indice";

const disponible = () => typeof window !== "undefined";

function leerIndice(): MetaSesion[] {
  if (!disponible()) return [];
  try {
    return JSON.parse(localStorage.getItem(INDICE) || "[]") as MetaSesion[];
  } catch {
    return [];
  }
}

function escribirIndice(lista: MetaSesion[]): void {
  if (!disponible()) return;
  localStorage.setItem(INDICE, JSON.stringify(lista));
}

export function nuevaSesion<T>(
  instrumento: Instrumento,
  participante: string,
  respuestas: T,
  extra?: Pick<MetaSesion, "puesto" | "empresa">,
): Sesion<T> {
  const ahora = new Date().toISOString();
  return {
    id: `${instrumento}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    instrumento,
    participante,
    puesto: extra?.puesto,
    empresa: extra?.empresa,
    iniciada: ahora,
    actualizada: ahora,
    terminada: false,
    respuestas,
  };
}

/** Guarda sesión completa e indexa para el panel admin. */
export function guardarSesion<TResp, TCalif = unknown>(sesion: Sesion<TResp, TCalif>): void {
  if (!disponible()) return;
  const actualizada: Sesion<TResp, TCalif> = {
    ...sesion,
    actualizada: new Date().toISOString(),
  };
  localStorage.setItem(PREFIJO_SESION + sesion.id, JSON.stringify(actualizada));

  const meta: MetaSesion = {
    id: actualizada.id,
    instrumento: actualizada.instrumento,
    participante: actualizada.participante,
    puesto: actualizada.puesto,
    empresa: actualizada.empresa,
    iniciada: actualizada.iniciada,
    actualizada: actualizada.actualizada,
    finalizadaEn: actualizada.finalizadaEn,
    terminada: actualizada.terminada,
    aprobada: actualizada.aprobada,
  };
  const idx = leerIndice().filter((s) => s.id !== meta.id);
  idx.unshift(meta);
  escribirIndice(idx);
}

/** Borrador en curso (una por instrumento). */
export function guardarBorrador<T>(sesion: Sesion<T>): void {
  if (!disponible()) return;
  localStorage.setItem(
    PREFIJO_BORRADOR + sesion.instrumento,
    JSON.stringify({ ...sesion, actualizada: new Date().toISOString() }),
  );
}

export function cargarBorrador<T>(instrumento: Instrumento): Sesion<T> | null {
  if (!disponible()) return null;
  const crudo = localStorage.getItem(PREFIJO_BORRADOR + instrumento);
  if (!crudo) return null;
  try {
    return JSON.parse(crudo) as Sesion<T>;
  } catch {
    return null;
  }
}

export function borrarBorrador(instrumento: Instrumento): void {
  if (!disponible()) return;
  localStorage.removeItem(PREFIJO_BORRADOR + instrumento);
}

/** @deprecated Usar guardarBorrador / guardarSesion */
export function guardar<T>(sesion: Sesion<T>): void {
  if (sesion.terminada) guardarSesion(sesion);
  else guardarBorrador(sesion);
}

/** @deprecated Usar cargarBorrador */
export function cargar<T>(instrumento: Instrumento): Sesion<T> | null {
  return cargarBorrador(instrumento);
}

/** @deprecated Usar borrarBorrador */
export function borrar(instrumento: Instrumento): void {
  borrarBorrador(instrumento);
}

export function listarSesiones(filtro?: Instrumento): MetaSesion[] {
  const lista = leerIndice();
  return filtro ? lista.filter((s) => s.instrumento === filtro) : lista;
}

export function obtenerSesion<TResp, TCalif = unknown>(
  id: string,
): Sesion<TResp, TCalif> | null {
  if (!disponible()) return null;
  const crudo = localStorage.getItem(PREFIJO_SESION + id);
  if (!crudo) {
    const borrador = leerIndice().find((s) => s.id === id);
    if (borrador) {
      const b = localStorage.getItem(PREFIJO_BORRADOR + borrador.instrumento);
      if (b) return JSON.parse(b) as Sesion<TResp, TCalif>;
    }
    return null;
  }
  try {
    return JSON.parse(crudo) as Sesion<TResp, TCalif>;
  } catch {
    return null;
  }
}

export function actualizarSesion<TResp, TCalif = unknown>(
  id: string,
  cambios: Partial<Sesion<TResp, TCalif>>,
): Sesion<TResp, TCalif> | null {
  const actual = obtenerSesion<TResp, TCalif>(id);
  if (!actual) return null;
  const next = { ...actual, ...cambios };
  guardarSesion(next);
  return next;
}

export function eliminarSesion(id: string): void {
  if (!disponible()) return;
  localStorage.removeItem(PREFIJO_SESION + id);
  escribirIndice(leerIndice().filter((s) => s.id !== id));
}

export function finalizarSesion<TResp, TCalif>(
  sesion: Sesion<TResp, TCalif>,
  calificacion: TCalif,
  interpretacion: string,
): Sesion<TResp, TCalif> {
  const ahora = new Date().toISOString();
  const next: Sesion<TResp, TCalif> = {
    ...sesion,
    terminada: true,
    finalizadaEn: ahora,
    actualizada: ahora,
    calificacion,
    interpretacion,
    aprobada: false,
  };
  guardarSesion(next);
  borrarBorrador(sesion.instrumento);
  if (typeof window !== "undefined") {
    import("./persist-server").then(({ enviarAplicacionServidor }) => {
      enviarAplicacionServidor(next);
    });
  }
  return next;
}
