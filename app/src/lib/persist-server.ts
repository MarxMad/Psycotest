import type { Sesion } from "./storage";

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
  cambios: { notasPsicologo?: string; interpretacion?: string; aprobada?: boolean },
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
