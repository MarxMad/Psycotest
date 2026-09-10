# CONOCER — expediente formal (Fases B → A → C)

Implementación en plataforma de la ruta de certificación alineada a expediente tipo EC.

## Fase B — sesión en vivo enriquecida

| Capacidad | Dónde |
|-----------|--------|
| Heartbeats / % presencia | `POST /api/live-classes/[id]/heartbeat` · columnas en `live_class_attendances` |
| Breakouts | `GET/POST /api/live-classes/[id]/breakouts` · salas Jitsi derivadas |
| Pizarra tldraw + capturas | `GET/POST /api/live-classes/[id]/whiteboard` |
| Dinámicas (pregunta, 2 verdades, asociación) | `GET/POST /api/live-classes/[id]/icebreakers` |
| UI sala | Admin y alumno `…/sala` + `LiveSessionTools` |

Presencia: cada ~30s se acumula `connected_seconds` y se calcula `%` vs `duration_minutes` de la clase.

## Fase A — expediente y constancia

| Capacidad | Dónde |
|-----------|--------|
| Programa + expediente | `certification_programs`, `student_expedientes` · `/api/expedientes` |
| Eval diagnóstico/inicial/final/satisfacción/clínica | `expediente_evaluations` |
| Portafolio | `portfolio_evidences` |
| Constancia PDF + QR | `course_certificates` · `/api/certificates/[code]/pdf` · `/verificar/[code]` |
| Permanencia VOD | `vod_events` + `lesson_progress.watched_seconds` · `/api/courses/progress` |
| Admin | `/admin/expedientes` |
| Alumno | `/consultorio/expediente` |

Emisión: admin aprueba o usa «Emitir constancia». El dictamen guarda aprovechamiento, presencia y URL de verificación.

## Fase C — legal y promo

| Capacidad | Dónde |
|-----------|--------|
| Finiquito / liquidación / aviso / términos | `legal_documents` · `/consultorio/legal` · `/api/legal` |
| Landing constancias | `/consultorio/constancias` |
| Cupón 100% al completar curso | `grantCompletionCoupon` al llegar a 100% progreso · `/admin/pagos/cupones` |

## Variables

- `JITSI_BASE_URL` — salas principal y breakouts (default `https://meet.jit.si`)
- `NEXT_PUBLIC_APP_URL` — base para enlaces de verificación en dictamen (opcional)

## Bootstrap

`ensureConocerTables` en `app/src/db/bootstrap.ts` crea tablas y columnas en runtime (Turso/SQLite) sin `db:push` en el build de Vercel.
