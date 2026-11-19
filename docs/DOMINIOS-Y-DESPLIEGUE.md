# Dominios, cobros y correos

Tres empresas, tres dominios, **un solo despliegue y un solo panel**.

| Dominio | Marca | Qué vive ahí |
|---|---|---|
| `NEXT_PUBLIC_DOMINIO_PSICOLOGIA` | Psicología Aplicada | Portada, compra de pruebas, `/evaluacion` |
| `NEXT_PUBLIC_DOMINIO_CEDUCT` | CEDUCT A.C. | Portada, `/diplomados`, `/carrito`, `/checkout` |
| `NEXT_PUBLIC_DOMINIO_IGE` | Ingeniería de Grupos Efectivos | Portada y catálogo de cursos |
| `NEXT_PUBLIC_DOMINIO_PANEL` (opcional) | — | `/admin`: las tres empresas en un panel |

## Por qué no son tres proyectos

Las tres marcas comparten base de datos, cuentas, cursos, cobros, correos y
el panel. Partirlas en tres aplicaciones obligaría a duplicar ese código o a
mantener un paquete compartido y cuatro despliegues sincronizados. Un solo
proyecto de Vercel atiende los tres dominios: el `middleware` lee el dominio
de cada visita y sirve la marca que corresponde.

El código de cada marca ya está separado por carpeta:

| Marca | Portada y componentes | Lógica |
|---|---|---|
| Psicología | `src/components/channels/PsicologiaLanding.tsx`, `channels/psico/` | `src/lib/pagos-psicologia.ts`, `src/app/evaluacion/` |
| CEDUCT | `src/components/marketplace/` | `src/lib/ceduct/` |
| IGE | `src/components/channels/IgeLanding.tsx`, `channels/ige/` | `src/lib/academia-ige.ts` |
| Común | `src/components/channels/ChannelShell.tsx` | `src/lib/channels.ts` (registro y dominios) |

## Cómo se reparte el tráfico

1. `/` en el dominio de una marca → su portada (`/sites/<marca>`).
2. Una sección de otra marca (p. ej. `/diplomados` en el dominio de IGE) →
   redirección 308 al dominio de su dueña.
3. Una ficha de curso (`/cursos/<slug>`) se abre en el dominio de la marca
   del curso; desde otro dominio se redirige.
4. `/admin`, `/login`, `/mi-cuenta`, `/api`, `/gracias`, `/verificar` y
   `/baja` responden en cualquier dominio.
5. En el dominio del panel o en la URL `*.vercel.app` no se redirige nada:
   sirve para probar todo junto.

**Sesiones:** la cookie de sesión es de cada dominio. Un alumno inicia sesión
en el dominio de su marca; el equipo entra al panel siempre por el mismo
dominio (el del panel).

## Puesta en marcha en Vercel

1. Proyecto → Settings → Domains: agrega los tres dominios (con y sin `www`)
   y el del panel. En el DNS de cada dominio pon los registros que indique
   Vercel (A para el dominio raíz, CNAME para `www` y subdominios).
2. Settings → Environment Variables (Production):
   `NEXT_PUBLIC_DOMINIO_PSICOLOGIA`, `NEXT_PUBLIC_DOMINIO_CEDUCT`,
   `NEXT_PUBLIC_DOMINIO_IGE`, `NEXT_PUBLIC_DOMINIO_PANEL`. Solo el dominio,
   sin `https://` ni `www`. Al ser `NEXT_PUBLIC_`, **cambiarlas requiere
   volver a desplegar**.
3. Privy (dashboard.privy.io → Configuration → Allowed origins): agrega los
   cuatro dominios con `https://`, o el inicio de sesión falla fuera del
   dominio actual.
4. LiveKit: el webhook se queda en un solo dominio (el del panel):
   `https://<panel>/api/livekit/webhook`.

## Cobros con Stripe

- Página de pago de Stripe (Checkout). Los métodos se activan en Stripe →
  Configuración → Métodos de pago: tarjeta de crédito y débito, **meses sin
  intereses** (ya está habilitado en el código; Stripe los ofrece cuando la
  tarjeta y el importe califican), OXXO (la ficha vence en 3 días), SPEI,
  Apple Pay, Google Pay y Link.
- **Una cuenta o tres.** Con `STRIPE_SECRET_KEY` cobran las tres marcas en
  una sola cuenta. Si cada empresa debe recibir su dinero y facturar por
  separado, añade `STRIPE_SECRET_KEY_<MARCA>` y `STRIPE_WEBHOOK_SECRET_<MARCA>`
  para cada una; la que no tenga clave propia usa la general.
- **Webhook.** En cada cuenta de Stripe: Developers → Webhooks → Add endpoint
  `https://<panel>/api/stripe/webhook` con los eventos:
  `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
  `checkout.session.async_payment_failed`, `checkout.session.expired`,
  `charge.refunded`. Copia el secreto `whsec_…` a la variable correspondiente.
- **Clave restringida** (`rk_…`) con escritura en Checkout Sessions y lectura
  en Checkout Sessions, Payment Intents y Charges.
- **Reembolsos:** un reembolso total hecho en Stripe marca el pedido como
  reembolsado y retira el acceso (inscripciones, o códigos de evaluación aún
  sin usar). Un reembolso parcial no quita nada.
- Pruebas locales: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
  y la tarjeta 4242 4242 4242 4242.

## Correos con Resend

| Correo | Cuándo sale | Marca |
|---|---|---|
| Confirmación de pago | Al confirmarse el cobro (webhook) | La del curso o la de Psicología |
| Códigos de evaluación | Compra de pruebas en línea | Psicología |
| Aviso de venta | Cada cobro, a `CORREO_VENTAS` | La de la venta |
| Invitación a curso | Panel → Cursos → Estudiantes → Invitar alumnos | La del curso |
| Promociones | Panel → Marketing → Campañas por correo | La elegida |

1. resend.com/domains: verifica los **tres** dominios (registros SPF, DKIM
   y, recomendado, DMARC en el DNS de cada uno).
2. Variables: `RESEND_API_KEY`, y un remitente por marca:
   `CORREO_REMITENTE_PSICOLOGIA="Psicología Aplicada <hola@dominio>"`, etc.
3. Las promociones llevan enlace de baja firmado y el encabezado
   `List-Unsubscribe` (baja en un clic en Gmail y Outlook). La baja es por
   marca, o de las tres a la vez; nunca frena los correos de pagos ni de
   cursos. Se envían en lotes de 100 por la API batch de Resend.

## Base de datos

Las campañas y las bajas viven en dos tablas nuevas. Antes de usar
Marketing → Campañas, ejecuta `docs/supabase_migracion_2026_11_correos.sql`
en Supabase → SQL Editor (es idempotente), o `npm run db:push`.

## Local

```bash
cd app && npm run dev
# Portadas por ruta interna:  http://localhost:3000/sites/ige
# O por subdominio:            http://ige.localhost:3000
```

Para simular los dominios, levanta el servidor con las variables
`NEXT_PUBLIC_DOMINIO_*` y manda el encabezado `Host`:
`curl -H "Host: ige.mx" http://localhost:3000/`.
