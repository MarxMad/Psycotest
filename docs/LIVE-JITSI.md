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
- Provider agnóstico: `jitsi` | `daily` | `none`.

## Siguiente (self-hosted)

| Pieza | Rol |
|-------|-----|
| **Jitsi Meet** (Docker) | Sala WebRTC propia |
| **Jibri** | Grabación |
| **coturn** | TURN/STUN |
| **Object storage** | Replay |
| **JWT** | `/api/live-classes/[id]/token` firmado solo para inscritos |

Pasos: provisionar VM → set `JITSI_BASE_URL` (+ secretos JWT) → webhook Jibri →
publicar replay como lección.

## Archivos clave

- `app/src/lib/live-classes.ts`
- `app/src/components/live/JitsiMeetEmbed.tsx`
- `app/src/app/api/live-classes/**`
- `app/src/app/admin/clases-vivo/**`
- `app/src/app/consultorio/clases-vivo/**`
