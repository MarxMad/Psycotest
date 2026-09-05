# Sesiones en vivo (BigBlueButton)

## Qué ya funciona

- Al **programar** una clase (`/admin/clases-vivo/programar`) se crea la reunión
  en tu servidor BBB (`provider=bbb` + `room_url` = `meetingID`).
- Al **entrar** (`POST /api/live-classes/[id]/join`) se firma una URL de join
  (moderador = admin, viewer = alumno) y se embebe el cliente HTML5.
- Admin: iniciar / finalizar, asistencia, sala en `/admin/clases-vivo/[id]/sala`.
- Alumno inscrito: `/consultorio/clases-vivo` → `/consultorio/clases-vivo/[id]/sala`.

Jitsi ya no se usa.

## Variables de entorno

```bash
BBB_URL=https://bbb.tudominio.com/bigbluebutton
BBB_SECRET=tu-shared-secret
# opcional
BBB_CHECKSUM_ALGORITHM=sha1   # o sha256 si tu servidor lo exige
NEXT_PUBLIC_SITE_URL=https://tudominio.com   # logoutURL al salir de la sala
```

Obtén el secret con `bbb-conf --secret` en el servidor BBB.

## Flujo técnico

1. `ensureBbbMeeting` → API `create` (idempotente; `duplicateWarning` = OK).
2. Se guarda solo el `meetingID` (no la join URL).
3. En join se calcula checksum server-side y se devuelve `joinUrl`.
4. El front embebe `joinUrl` en iframe; si el BBB bloquea framing, el usuario
   abre en pestaña nueva (mismo enlace firmado).

## Self-host recomendado

| Pieza | Rol |
|-------|-----|
| BigBlueButton 2.7+ | Aula (audio, video, pizarra, chat, breakouts) |
| Grabaciones BBB | Publicar `recording_url` → lección replay |
| coturn | TURN (suele venir con el install) |

Permisos de iframe: si ves pantalla en blanco al embeber, ajusta cabeceras del
servidor BBB (`X-Frame-Options` / CSP `frame-ancestors`) para tu dominio PsycoTest,
o usa “Abrir en pestaña nueva”.

## Archivos clave

- `app/src/lib/bbb.ts`
- `app/src/lib/live-classes.ts`
- `app/src/components/live/BbbMeetEmbed.tsx`
- `app/src/app/api/live-classes/**`
- `app/src/app/admin/clases-vivo/**`
- `app/src/app/consultorio/clases-vivo/**`
