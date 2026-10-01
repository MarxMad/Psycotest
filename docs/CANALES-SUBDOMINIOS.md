# Canales por subdominio

La plataforma opera **cuatro sitios** con identidad propia y un **solo panel admin**.

| Subdominio | Marca | Rol |
|---|---|---|
| `martin.` | Martín Hernández | Portafolio (consultor / valuador / certificador) |
| `ceduct.` | CEDUCT A.C. | Entidad certificadora ECE 002-10 |
| `psicologia.` | Psicología Aplicada | Pruebas, evaluación, diplomados |
| `ige.` | Ingeniería de Grupos Efectivos | Cursos, capacitación, consultoría |
| `admin.` o apex `/admin` | Sistema Psic | Panel único (Canales, pruebas, LMS, etc.) |

## Variables de entorno

```bash
ROOT_DOMAIN=sistemapsic.com
```

- En local, si `ROOT_DOMAIN` no está definido o es `localhost`, las URLs públicas usan `*.localhost:3000` (p. ej. `http://martin.localhost:3000`).
- En producción, cookies de sesión admin pueden compartirse en `.${ROOT_DOMAIN}` cuando se configure el dominio real.

## Routing

1. El middleware lee el header `Host`.
2. Si el prefijo es un canal conocido, reescribe a `/sites/{channel}` y setea `x-channel`.
3. Rutas de plataforma (`/admin`, `/api`, `/evaluacion`, `/consultorio`, `/verificar`, …) **no** se reescriben.

Código clave:

- Registry: `app/src/lib/channels.ts`
- Contenido seed + store: `app/src/lib/channel-content.ts`, `app/src/lib/channel-store.ts`
- Middleware: `app/src/middleware.ts`
- Sitios: `app/src/app/sites/[channel]/`
- Admin: `/admin/canales` → API `/api/channels`

## Local

Los navegadores resuelven `*.localhost` sin `/etc/hosts`:

```bash
cd app && npm run dev
# Abrir:
# http://martin.localhost:3000
# http://ceduct.localhost:3000
# http://psicologia.localhost:3000
# http://ige.localhost:3000
# http://localhost:3000          → hub
# http://localhost:3000/admin/canales
```

Opcional (si tu entorno no resuelve `*.localhost`):

```
127.0.0.1 martin.localhost ceduct.localhost psicologia.localhost ige.localhost
```

## Vercel / DNS

En el proyecto Vercel:

1. Añade el dominio raíz (`sistemapsic.com`) y `www`.
2. Añade los subdominios como dominios del mismo proyecto:
   - `martin.sistemapsic.com`
   - `ceduct.sistemapsic.com`
   - `psicologia.sistemapsic.com`
   - `ige.sistemapsic.com`
   - `admin.sistemapsic.com` (opcional; el panel también vive en `/admin` del apex)
3. En el DNS del proveedor, crea registros `CNAME` (o los que indique Vercel) apuntando cada subdominio al target de Vercel.
4. Define `ROOT_DOMAIN=sistemapsic.com` en Environment Variables (Production / Preview según corresponda).

No hace falta un deploy por canal: un solo deployment atiende todos los hosts.

## CTAs a motores compartidos

| Canal | Profundiza en |
|---|---|
| Psicología | `/evaluacion`, `/psycotest`, diplomados vía `/consultorio/cursos` |
| CEDUCT | `/consultorio/expediente`, `/consultorio/constancias` |
| IGE | `/consultorio/cursos`, `/consultorio/clases-vivo` |
| Martín | links a los tres subdominios + credenciales |

## Admin → Canales

En el panel: **Canales** lista los 4 sitios. Cada editor permite hero, SEO, secciones y publicar. El store escribe `data/channel-pages.json` (en Vercel usa `/tmp` y se rehidrata desde seed si se pierde; para persistencia durable conviene migrar a Postgres/Supabase en un corte posterior).
