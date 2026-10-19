# Auditoría de bases de datos (persistencia)

Fecha de revisión: 2026-09-29 · Rama: Supabase Postgres

## Veredicto

| Capa | Estado |
|------|--------|
| Schema Drizzle (Postgres) | Adecuado para pruebas masivas + LMS + live + ventas |
| SQL init Supabase (35 tablas) | Alineado con schema (incluye Cleaver / `cleaver_puesto`) |
| Runtime app | Solo `DATABASE_URL` (Supabase/Postgres) — sin Turso/SQLite |
| Proyecto Supabase cloud | **Pendiente de conectar** (`DATABASE_URL` en Vercel) |

## Tablas críticas de pruebas masivas

| Tabla | Rol |
|-------|-----|
| `access_codes` | Lotes / cupos / instrumentos permitidos |
| `access_redemptions` | Canjes por participante |
| `assessment_sessions` | Protocolos PAPI/Hartman/MABE/Cleaver |
| `participants` | Ficha de evaluados |
| `job_profiles` | Factor Humano Cleaver (`cleaver_puesto`) |
| `users` / `audit_log` | Staff y trazabilidad |

## Cómo aplicar en Supabase

1. Pegar [`docs/supabase_init.sql`](./supabase_init.sql) en SQL Editor **o**
2. `export DATABASE_URL=... && cd app && npm run db:push`
3. Definir en Vercel: `DATABASE_URL`, `AUTH_SECRET`, admin

Sin paso 3, la app en Vercel **no** tiene persistencia real entre reinicios.
