# Sesiones en vivo (Jitsi) — roadmap

Estado actual del LMS: **stubs listos** (programación, detalle, placeholder de sala, tablas
`live_classes` + `live_class_attendances`). Aún **no** se monta el stack de video.

## Objetivo de producto

- Hasta **~30** participantes con cámara, micrófono y chat.
- Grabación opcional → guardar URL en `live_classes.recording_url` → publicar como lección
  `type = live_replay` en el curso.
- Provider agnóstico en schema: `provider` (`jitsi` | `daily` | `none`) + `room_url`.

## Stack recomendado (self-hosted)

Alineado al presupuesto LMS:

| Pieza | Rol |
|-------|-----|
| **Jitsi Meet** (Docker) | Sala WebRTC |
| **Jibri** | Grabación de la sesión |
| **coturn** | TURN/STUN para NATs difíciles |
| **Object storage** (R2/S3/MinIO) | Archivos de replay |
| **Next.js** | Emite JWT / deep-link a la sala solo a inscritos |

## Pasos futuros de implementación

1. Provisionar VM (4–8 GB RAM) y desplegar Jitsi + Jibri + coturn.
2. Variables de entorno: `JITSI_BASE_URL`, `JITSI_APP_ID`, `JITSI_APP_SECRET` (o equivalente).
3. Al programar clase: crear room id, persistir `room_url` + `provider='jitsi'`.
4. Endpoint firmado `/api/live-classes/[id]/token` que verifique inscripción/admin.
5. Página `/admin/clases-vivo/[id]/sala` (y vista alumno) embebe Jitsi iframe o SDK.
6. Webhook/worker post-Jibri: subir video, set `recording_url`, opcional crear lección replay.
7. Registrar filas en `live_class_attendances` (joined_at / left_at).

## Lo que ya está en código

- Schema con `provider`, `room_url`, `recording_url`, asistencia.
- CRUD `/api/live-classes` (crea con `provider='none'`).
- Admin: listado, programar, detalle, stub de sala.
- Sin SDKs de video instalados en esta fase (a propósito).
