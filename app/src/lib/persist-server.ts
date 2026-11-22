import type { Instrumento, Sesion } from "./storage";

/**
 * Avisa que la persona empezó una prueba: el servidor guarda la hora de
 * inicio y manda los avisos. No bloquea: si falla, la prueba sigue.
 */
export function avisarInicioServidor(instrumento: Instrumento): void {
  fetch("/api/aplicacion/inicio", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ instrumento }),
    keepalive: true,
  }).catch(() => {});
}

/** Envía aplicación terminada al servidor (endpoint público, sin login del aplicante). */
export async function enviarAplicacionServidor<TResp, TCalif>(
  sesion: Sesion<TResp, TCalif>,
): Promise<boolean> {
  try {
    const res = await fetch("/api/aplicacion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: sesion.id,
        instrumento: sesion.instrumento,
        participantNombre: sesion.participante,
        puesto: sesion.puesto,
        empresa: sesion.empresa,
        respuestas: sesion.respuestas,
        iniciada: sesion.iniciada,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Persiste sesión terminada en el servidor (requiere login de psicólogo). */
export async function persistirSesionServidor<TResp, TCalif>(
  sesion: Sesion<TResp, TCalif>,
): Promise<boolean> {
  try {
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: sesion.id,
        instrumento: sesion.instrumento,
        participantNombre: sesion.participante,
        puesto: sesion.puesto,
        empresa: sesion.empresa,
        respuestas: sesion.respuestas,
        calificacion: sesion.calificacion,
        interpretacion: sesion.interpretacion,
        notasPsicologo: sesion.notasPsicologo,
        aprobada: sesion.aprobada ?? false,
        estado: sesion.aprobada ? "aprobada" : "calificada",
        iniciada: sesion.iniciada,
        terminada: sesion.terminada,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function actualizarSesionServidor(
  id: string,
  cambios: {
    notasPsicologo?: string;
    interpretacion?: string;
    aprobada?: boolean;
    jobProfileId?: string | null;
  },
): Promise<boolean> {
  try {
    const res = await fetch(`/api/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cambios),
    });
    return res.ok;
  } catch {
    return false;
  }
}
