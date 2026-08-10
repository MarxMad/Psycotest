# PsycoTest

Plataforma para aplicación, calificación e interpretación de pruebas psicométricas **PAPI**, **Hartman** y **MABE**.

## Estructura

| Carpeta | Contenido |
|---------|-----------|
| `app/` | Aplicación Next.js 15 (UI + API + SQLite) |
| `docs/` | Documentación técnica y calificación |

## Desarrollo local

```bash
cd app
npm install
cp .env.example .env.local   # editar AUTH_SECRET
npm run db:push
npm run dev
```

- Panel psicólogo: `/login` (usuario seed en `.env.example`)
- Aplicantes: `/acceso` con código generado en `/admin/codigos`

## Despliegue en Vercel

1. Importa el repo [MarxMad/Psycotest](https://github.com/MarxMad/Psycotest)
2. **Root Directory:** `app`
3. **Framework:** Next.js
4. Variables de entorno (Production):

| Variable | Descripción |
|----------|-------------|
| `AUTH_SECRET` | Secreto JWT (≥32 caracteres aleatorios) |
| `CODE_PEPPER` | Pepper para hashes de códigos de acceso |
| `DEFAULT_ADMIN_EMAIL` | Email admin inicial |
| `DEFAULT_ADMIN_PASSWORD` | Contraseña admin (cámbiala) |

5. Build Command (opcional en Vercel): `npm run db:push && npm run build`

> **Nota:** SQLite en disco local no persiste bien en serverless. Para producción estable conviene migrar a [Turso](https://turso.tech) o Postgres. Para demo/pruebas tempranas puede funcionar con limitaciones.
