# Sistema Psic — plataforma operativa

Consultorio digital: pruebas psicológicas, cursos en vivo/grabados, certificación CONOCER, clases con Jitsi y constancias.

## Arranque

```bash
cd app
npm install
npm run dev   # http://localhost:3000
```

En el primer arranque se crea el esquema SQLite/Turso, el admin y el **catálogo completo** tomado del PPTX de servicios en línea.

## Credenciales demo

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | `admin@sistemapsic.local` | `sistemapsic2026` |
| Alumno | `alumno@sistemapsic.local` | `alumno2026` |

Cupones: `DEMO100` (100% off) · `BIENVENIDA20` (20% off)

## Catálogo sembrado (31 cursos)

- **Pruebas:** Hartman, PAPI, MABE, Cleaver, LIFO
- **Cursos en vivo:** Liderazgo, IE, Comunicación, Trabajo en equipo, Conflictos, Negociación, NOM-035, Legales RH, Mkt Digital, Ciberseguridad, IA, Primeros auxilios, Seguridad e higiene
- **Cursos grabados:** Técnicas de diagnóstico, Clima laboral, Evaluación desempeño/servicio, DNC, Conflictos, Campo de fuerzas, TKJ, Marco lógico
- **CONOCER:** Atención ciudadano / comensales / huésped / adicciones
- **Servicios:** Consultoría, coaching, mediación, terapia

Varios cursos son gratis; el resto se abre con el cupón `DEMO100` o con Stripe (`STRIPE_SECRET_KEY` + `stripe_price_id` por curso).

## Base de datos

- Local: SQLite en `app/data/psycotest.db`
- Producción: `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` (recomendado en Vercel)

El bootstrap (`ensureDbReady`) aplica el esquema y ejecuta `seedPlatformCatalog` una sola vez (idempotente si ya hay cursos).
