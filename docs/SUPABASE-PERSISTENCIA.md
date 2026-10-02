# Persistencia con Supabase (Postgres)

Turso (SQLite remoto) quedó reemplazado por **Supabase / Postgres** como base de persistencia de producción.

## Qué tablas quedan armadas

Se crean **35 tablas**, entre ellas:

- Pruebas: `access_codes`, `access_redemptions`, `assessment_sessions`, `participants`, `job_profiles`, `audit_log`
- LMS: `courses`, `course_modules`, `course_lessons`, `course_enrollments`, `lesson_progress`, quizzes…
- Live: `live_classes`, breakouts, whiteboard, icebreakers
- CONOCER: expedientes, certificados, legales
- Ventas: `orders`, `order_items`, `coupons`

SQL listo para pegar en Supabase SQL Editor:

- [`app/drizzle/0000_supabase_init.sql`](../app/drizzle/0000_supabase_init.sql)

## Cómo conectar tu proyecto Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. **Project Settings → Database → Connection string → URI**.
3. En **Vercel** (y en `.env.local`) define:

```bash
DATABASE_URL=postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
AUTH_SECRET=cambia-esto-por-16-chars-minimo
DEFAULT_ADMIN_EMAIL=tu@correo.com
DEFAULT_ADMIN_PASSWORD=tu-password-seguro
```

> En serverless (Vercel) usa el **pooler puerto 6543** (Transaction mode).  
> Para `npm run db:push` desde tu máquina, a veces conviene la URI directa (puerto **5432**).

4. Aplica el schema (elige una):

**Opción A — SQL Editor (recomendada la primera vez)**  
Copia/pega el contenido de `app/drizzle/0000_supabase_init.sql` y ejecuta.

**Opción B — CLI**

```bash
cd app
export DATABASE_URL='postgresql://...'
npm run db:push
```

5. Redeploy en Vercel. El bootstrap creará el admin inicial si `users` está vacío.

## Local sin Supabase

```bash
cd app
docker compose up -d db
# o Postgres instalado en el host
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sistemapsic
npm run db:push
npm run dev
```

## Variables que ya no se usan

- ~~Turso~~ eliminado del runtime
- ~~SQLite / better-sqlite3~~ eliminado del runtime
- Persistencia única: **Supabase Postgres vía `DATABASE_URL`**

## Carpeta Supabase CLI

- `app/supabase/config.toml`
- `app/supabase/migrations/20260927220000_init.sql` (misma init que `docs/supabase_init.sql`)

Con token:

```bash
export SUPABASE_ACCESS_TOKEN=...
npx supabase link --project-ref <REF>
npx supabase db push
```

## Verificación rápida

Tras conectar Supabase:

1. Login admin en `/login`
2. Crear un código en `/admin/pruebas/codigos`
3. Aplicar una prueba con ese código
4. Confirmar que la sesión aparece en `/admin/pruebas` **después de reiniciar** el deploy (prueba de persistencia real)
