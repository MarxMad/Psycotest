/**
 * Video en vivo con LiveKit: la sala es nuestra, no un iframe de terceros.
 *
 * Aquí vive todo lo que toca el servidor de LiveKit: los pases de entrada
 * (tokens firmados con los permisos de cada quien), la moderación, la
 * grabación y la lectura de los avisos que manda el servidor (webhooks).
 *
 * Variables de entorno:
 *   LIVEKIT_URL         wss://… del servidor (LiveKit Cloud o propio)
 *   LIVEKIT_API_KEY     clave de API
 *   LIVEKIT_API_SECRET  secreto de API
 * Grabación (opcional, cualquier almacenamiento compatible con S3,
 * p. ej. Supabase Storage):
 *   LIVEKIT_GRABACION_S3_BUCKET, LIVEKIT_GRABACION_S3_REGION,
 *   LIVEKIT_GRABACION_S3_ENDPOINT, LIVEKIT_GRABACION_S3_ACCESS_KEY,
 *   LIVEKIT_GRABACION_S3_SECRET, LIVEKIT_GRABACION_URL_PUBLICA
 */

import {
  AccessToken,
  EgressClient,
  EncodedFileOutput,
  EncodedFileType,
  RoomServiceClient,
  S3Upload,
  TrackSource,
  WebhookReceiver,
} from "livekit-server-sdk";
import type { AuthUser } from "@/lib/auth";

export type RolEnSala = "anfitrion" | "alumno";

/** Atributos que viajan con cada participante y lee la interfaz. */
export type AtributosSala = {
  rol: RolEnSala;
  /** "1" mientras tiene la mano levantada. */
  mano?: string;
};

function credenciales() {
  const url = process.env.LIVEKIT_URL?.trim();
  const key = process.env.LIVEKIT_API_KEY?.trim();
  const secret = process.env.LIVEKIT_API_SECRET?.trim();
  if (!url || !key || !secret) return null;
  return { url, key, secret };
}

export function livekitConfigurado(): boolean {
  return credenciales() !== null;
}

function exigir() {
  const c = credenciales();
  if (!c) throw new Error("LIVEKIT_NO_CONFIGURADO");
  return c;
}

/** La API de servidor habla HTTP(S); el navegador, WebSocket. */
function urlHttp(url: string): string {
  return url.replace(/^ws(s?):\/\//, "http$1://");
}

// --------------------------------------------------------------------------
// Nombres de sala
// --------------------------------------------------------------------------

const PREFIJO = "clase_";
const SEPARADOR = "__";

/**
 * La sala principal de una clase y las de división cuelgan del mismo id, así
 * que de cualquier aviso del servidor sabemos a qué clase pertenece. No hace
 * falta que sean secretos: sin un pase firmado por nosotros nadie entra.
 */
export function salaDeClase(liveClassId: string, breakoutRoomId?: string | null): string {
  return breakoutRoomId
    ? `${PREFIJO}${liveClassId}${SEPARADOR}${breakoutRoomId}`
    : `${PREFIJO}${liveClassId}`;
}

export function leerSala(
  nombre: string,
): { liveClassId: string; breakoutRoomId: string | null } | null {
  if (!nombre.startsWith(PREFIJO)) return null;
  const resto = nombre.slice(PREFIJO.length);
  const [liveClassId, breakoutRoomId] = resto.split(SEPARADOR);
  if (!liveClassId) return null;
  return { liveClassId, breakoutRoomId: breakoutRoomId || null };
}

// --------------------------------------------------------------------------
// Pases de entrada
// --------------------------------------------------------------------------

/**
 * Pase firmado para entrar a una sala.
 *
 * - Anfitrión (admin o profesor de la clase): publica todo, modera y graba.
 * - Alumno: cámara y micrófono; pantalla solo en salas de división, donde se
 *   trabaja en equipo. Puede levantar la mano (atributos propios) y chatear.
 *
 * La identidad es el id de usuario: entrar desde otra pestaña saca a la
 * anterior en vez de duplicar a la persona, y la asistencia cuadra.
 */
export async function crearPase(opciones: {
  user: AuthUser;
  sala: string;
  rol: RolEnSala;
  enDivision: boolean;
}): Promise<{ token: string; serverUrl: string }> {
  const { url, key, secret } = exigir();
  const { user, sala, rol, enDivision } = opciones;
  const anfitrion = rol === "anfitrion";

  const atributos: AtributosSala = { rol };
  const at = new AccessToken(key, secret, {
    identity: user.id,
    name: user.nombre,
    attributes: atributos as Record<string, string>,
    ttl: "6h",
  });

  const fuentesAlumno = [TrackSource.CAMERA, TrackSource.MICROPHONE];
  if (enDivision) fuentesAlumno.push(TrackSource.SCREEN_SHARE, TrackSource.SCREEN_SHARE_AUDIO);

  at.addGrant({
    room: sala,
    roomJoin: true,
    canSubscribe: true,
    canPublish: true,
    canPublishData: true,
    canUpdateOwnMetadata: true,
    canPublishSources: anfitrion ? undefined : fuentesAlumno,
    roomAdmin: anfitrion,
    roomRecord: anfitrion,
  });

  return { token: await at.toJwt(), serverUrl: url };
}

// --------------------------------------------------------------------------
// Moderación
// --------------------------------------------------------------------------

function salas(): RoomServiceClient {
  const { url, key, secret } = exigir();
  return new RoomServiceClient(urlHttp(url), key, secret);
}

export async function participantesDe(sala: string) {
  try {
    return await salas().listParticipants(sala);
  } catch {
    // La sala aún no existe (nadie ha entrado): está vacía.
    return [];
  }
}

/** Silencia el micrófono de una persona, o de todos menos los anfitriones. */
export async function silenciar(sala: string, identidad?: string) {
  const lista = await participantesDe(sala);
  for (const p of lista) {
    if (identidad && p.identity !== identidad) continue;
    if (!identidad && p.attributes?.rol === "anfitrion") continue;
    for (const pista of p.tracks) {
      if (pista.source === TrackSource.MICROPHONE && !pista.muted) {
        await salas().mutePublishedTrack(sala, p.identity, pista.sid, true);
      }
    }
  }
}

export async function sacarDeSala(sala: string, identidad: string) {
  await salas().removeParticipant(sala, identidad);
}

export async function bajarMano(sala: string, identidad: string) {
  await salas().updateParticipant(sala, identidad, { attributes: { mano: "" } });
}

/** Cierra la sala para todos: los saca y la borra del servidor. */
export async function cerrarSala(sala: string) {
  try {
    await salas().deleteRoom(sala);
  } catch {
    // Ya no existía: nada que cerrar.
  }
}

// --------------------------------------------------------------------------
// Grabación
// --------------------------------------------------------------------------

function almacenGrabaciones() {
  const bucket = process.env.LIVEKIT_GRABACION_S3_BUCKET?.trim();
  const accessKey = process.env.LIVEKIT_GRABACION_S3_ACCESS_KEY?.trim();
  const secret = process.env.LIVEKIT_GRABACION_S3_SECRET?.trim();
  if (!bucket || !accessKey || !secret) return null;
  return {
    bucket,
    accessKey,
    secret,
    region: process.env.LIVEKIT_GRABACION_S3_REGION?.trim() || "us-east-1",
    endpoint: process.env.LIVEKIT_GRABACION_S3_ENDPOINT?.trim() || "",
    urlPublica: process.env.LIVEKIT_GRABACION_URL_PUBLICA?.trim().replace(/\/$/, "") || "",
  };
}

export function grabacionConfigurada(): boolean {
  return livekitConfigurado() && almacenGrabaciones() !== null;
}

function egresos(): EgressClient {
  const { url, key, secret } = exigir();
  return new EgressClient(urlHttp(url), key, secret);
}

/** Grabación en curso de la sala, si la hay. */
export async function grabacionActiva(sala: string): Promise<string | null> {
  if (!livekitConfigurado()) return null;
  try {
    const lista = await egresos().listEgress({ roomName: sala, active: true });
    return lista[0]?.egressId ?? null;
  } catch {
    return null;
  }
}

/** Graba la sala completa (mosaico + audio mezclado) a un MP4. */
export async function iniciarGrabacion(sala: string, liveClassId: string): Promise<string> {
  const almacen = almacenGrabaciones();
  if (!almacen) throw new Error("GRABACION_NO_CONFIGURADA");

  const marca = new Date().toISOString().replace(/[:.]/g, "-");
  const salida = new EncodedFileOutput({
    fileType: EncodedFileType.MP4,
    filepath: `grabaciones/${liveClassId}/${marca}.mp4`,
    output: {
      case: "s3",
      value: new S3Upload({
        bucket: almacen.bucket,
        region: almacen.region,
        endpoint: almacen.endpoint,
        accessKey: almacen.accessKey,
        secret: almacen.secret,
        forcePathStyle: Boolean(almacen.endpoint),
      }),
    },
  });

  const info = await egresos().startRoomCompositeEgress(sala, salida, { layout: "grid" });
  return info.egressId;
}

export async function detenerGrabacion(egressId: string) {
  await egresos().stopEgress(egressId);
}

/** Dirección pública del archivo grabado, para guardarla en la clase. */
export function urlDeGrabacion(archivo: { filename?: string; location?: string }): string | null {
  const almacen = almacenGrabaciones();
  if (almacen?.urlPublica && archivo.filename) {
    return `${almacen.urlPublica}/${archivo.filename.replace(/^\/+/, "")}`;
  }
  return archivo.location || null;
}

// --------------------------------------------------------------------------
// Avisos del servidor
// --------------------------------------------------------------------------

/** Verifica la firma del aviso: sin ella, cualquiera fabricaría asistencias. */
export async function leerAviso(cuerpo: string, autorizacion: string | null) {
  const { key, secret } = exigir();
  return new WebhookReceiver(key, secret).receive(cuerpo, autorizacion ?? undefined);
}
