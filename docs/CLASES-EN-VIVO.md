# Clases en vivo (LiveKit)

La sala de clase es propia de la plataforma: video, audio, pantalla, chat,
pizarra, salas de división y dinámicas en una sola pantalla con la marca de
cada canal. El video lo mueve LiveKit; nada se abre en un iframe de terceros.

## Quién hace qué

| Rol | En la sala |
|---|---|
| **Admin** | Dirige cualquier clase: modera, reparte en salas, graba, termina. |
| **Profesor** | Dirige solo las clases de los cursos donde es instructor (Cursos → Editar → «Profesor de las clases en vivo»). |
| **Alumno inscrito** | Entra desde Mi cuenta → En vivo, 15 min antes. Cámara, micrófono, mano, chat, dinámicas. Pantalla solo en salas de división. |

## Piezas

- `src/lib/livekit.ts` — pases firmados, moderación, grabación, webhooks.
- `POST /api/live-classes/[id]/join` — pase para la sala principal o una de división (`{ breakoutRoomId }`).
- `POST /api/live-classes/[id]/moderar` — silenciar, silenciar a todos, sacar, bajar mano.
- `GET|POST /api/live-classes/[id]/grabacion` — iniciar / detener grabación.
- `POST /api/livekit/webhook` — entradas y salidas firmadas por el servidor de video → asistencia CONOCER; fin de grabación → `recording_url`.
- `src/components/live/sala/` — la interfaz: antesala, escenario, paneles, controles.

## Asistencia CONOCER

Una fila por persona y clase (`live_class_attendances`). La abren la entrada a la
sala y el aviso `participant_joined`; la cierran la salida y `participant_left`,
aunque el navegador se cierre de golpe. `connected_seconds` solo crece mientras
la persona está conectada (latido cada 30 s), y `presence_percent` es ese tiempo
frente a la duración programada.

## Desarrollo local

```bash
npm run livekit:dev   # servidor LiveKit en Docker (ws://localhost:7880)
npm run dev           # la app en :3000 (el webhook local apunta ahí)
node --env-file=.env.local scripts/prueba-sala.mjs /tmp <id-de-clase>   # prueba de punta a punta
```

`.env.local` lleva las claves de desarrollo (`devkey` / el secreto de `livekit/livekit.dev.yaml`).

## Producción

1. **Servidor**: LiveKit Cloud (cloud.livekit.io) o servidor propio. En Cloud,
   *Settings → Keys* da `LIVEKIT_URL` (wss://…), `LIVEKIT_API_KEY` y `LIVEKIT_API_SECRET`.
   Cargarlas en Vercel como variables sensibles.
2. **Webhook**: *Settings → Webhooks* → `https://TU-DOMINIO/api/livekit/webhook`
   con la misma API key. Sin él la asistencia se sigue registrando por la sala,
   pero no se cierra sola si alguien pierde la conexión de golpe.
3. **Grabación** (opcional): bucket compatible con S3. Con Supabase Storage:
   crear bucket `grabaciones`, *Storage → S3 Connection* → llaves de acceso, y
   llenar `LIVEKIT_GRABACION_S3_*` y `LIVEKIT_GRABACION_URL_PUBLICA`
   (ver `.env.example`). En servidor propio hace falta además el servicio
   *egress* de LiveKit; en Cloud ya viene.

## Pendientes conocidos

- La pizarra (tldraw) pide licencia para producción: sin ella muestra la marca de agua «Get a license for production».
- No hay correos de invitación ni recordatorio de clase.
