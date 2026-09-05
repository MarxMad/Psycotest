# Sesiones en vivo (Jitsi) — estado actual

## Qué ya funciona (MVP)

- Al **programar** una clase (`/admin/clases-vivo/programar`) se crea una sala Jitsi
  automáticamente (`provider=jitsi` + `room_url`).
- Admin puede **iniciar / finalizar** la sesión y abrir la sala embebida.
- Alumnos inscritos ven sus clases en `/consultorio/clases-vivo` y entran a
  `/consultorio/clases-vivo/[id]/sala`.
- `POST /api/live-classes/[id]/join` y `/leave` registran asistencia.
- Variable `JITSI_BASE_URL` (default `https://meet.jit.si`). Cámbiala a tu
  dominio self-hosted cuando lo tengas.

## Objetivo de producto

- Hasta **~30** participantes con cámara, micrófono y chat.
- Grabación opcional → `recording_url` → lección `live_replay`.
- Provider agnóstico: `jitsi` | `daily` | `none` (y en el futuro otros OSS).

## Alternativas open source (sin depender de Jitsi)

Si quieres salir de Jitsi / 8x8, estas opciones son self-host primero:

| Opción | Licencia | Encaje con ~30 alumnos | Notas |
|--------|----------|------------------------|-------|
| **Galène** | AGPL-3.0 | Excelente | SFU minimalista, un binario, sin “empresa SaaS” detrás. Ideal para clases pequeñas. |
| **BigBlueButton** | LGPL | Muy bueno (educación) | Hecho para docencia: pizarra, breakouts, grabación. Comunidad fuerte; Blindside Networks existe pero el core es OSS. |
| **mediasoup** | ISC | Excelente (DIY) | Librería SFU, no producto cerrado. Tú controlas la UI y el backend. Más trabajo de ingeniería. |
| **Janus Gateway** | GPL | Bueno | Gateway WebRTC maduro (Meetecho). Flexible; hay que armar la sala/UI. |
| **LiveKit** (self-host) | Apache-2.0 | Excelente | Muy buen DX y SDKs. Hay empresa/cloud, pero el server OSS se self-hostea sin su cloud. |
| **Element Call** (Matrix) | AGPL | Bueno | Videollamadas sobre Matrix; encaja si quieres identidad federada. |

**Recomendación práctica para Psycotest:**

1. Corto plazo: dejar Jitsi self-hosted (Docker) si ya funciona el embed.
2. Mejor “sin vendor”: **Galène** (simple) o **BigBlueButton** (si priorizas herramientas de clase).
3. Si quieren producto propio a largo plazo: **mediasoup** o **LiveKit self-host** + nuestro provider agnóstico (`room_url` / `provider`).

## Siguiente (self-hosted)

| Pieza | Rol |
|-------|-----|
| **Jitsi Meet** (Docker) *o alternativa de arriba* | Sala WebRTC propia |
| **Grabación** (Jibri / BBB record / egress LiveKit) | Replay |
| **coturn** | TURN/STUN |
| **Object storage** | Replay |
| **JWT / token de sala** | `/api/live-classes/[id]/token` solo para inscritos |

Pasos: provisionar VM → set `JITSI_BASE_URL` (o URL del provider) → webhook de grabación →
publicar replay como lección.

## Archivos clave

- `app/src/lib/live-classes.ts`
- `app/src/components/live/JitsiMeetEmbed.tsx`
- `app/src/app/api/live-classes/**`
- `app/src/app/admin/clases-vivo/**`
- `app/src/app/consultorio/clases-vivo/**`
