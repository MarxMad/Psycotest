# ARQUITECTURA TÉCNICA: PLATAFORMA INTEGRAL

**Proyecto:** PsycoTest + Plataforma de Cursos  
**Fecha:** 31 de Agosto, 2026  
**Versión:** 2.0

---

## 📐 ARQUITECTURA GENERAL

### Sistema dividido en 3 áreas principales:

```
┌─────────────────────────────────────────────────────────┐
│                    PLATAFORMA UNIFICADA                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   ÁREA 1:    │  │   ÁREA 2:    │  │   ÁREA 3:    │ │
│  │   PRUEBAS    │  │   CURSOS     │  │  CLASES EN   │ │
│  │ PSICOMÉTRICAS│  │   (LMS)      │  │    VIVO      │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
├─────────────────────────────────────────────────────────┤
│              PANEL DE ADMINISTRACIÓN ÚNICO               │
│         (Gestiona las 3 áreas desde un solo lugar)      │
└─────────────────────────────────────────────────────────┘
```

---

## 🏗️ ESTRUCTURA DE PANELES

### 1. Panel de Usuario - Pruebas Psicométricas
**URL:** `/pruebas` o `/evaluacion`

**Acceso:** Aplicantes con código de acceso

**Funciones:**
- ✅ Iniciar prueba PAPI/Hartman/MABE
- ✅ Ver progreso de la prueba
- ✅ Descargar resultado (si está autorizado)

---

### 2. Panel de Usuario - Cursos
**URL:** `/estudiante` o `/mis-cursos`

**Acceso:** Estudiantes registrados y con pago confirmado

**Funciones:**
- ✅ Ver catálogo de cursos
- ✅ Mis cursos comprados
- ✅ Progreso de cada curso
- ✅ Certificados obtenidos
- ✅ Acceso a clases en vivo programadas
- ✅ Historial de pagos

---

### 3. Panel de Administración Único
**URL:** `/admin`

**Acceso:** Administradores y psicólogos

**Pestañas/Secciones:**

```
┌─────────────────────────────────────────────┐
│  PANEL ADMIN                         [👤]  │
├─────────────────────────────────────────────┤
│                                              │
│  📊 Dashboard General                       │
│  ├─ Métricas unificadas (ventas, usuarios) │
│  └─ Gráficas de ingresos                   │
│                                              │
│  🧪 SECCIÓN: Pruebas Psicométricas         │
│  ├─ Generar códigos de acceso              │
│  ├─ Ver resultados de aplicantes           │
│  ├─ Generar informes PDF                   │
│  └─ Historial de pruebas                   │
│                                              │
│  🎓 SECCIÓN: Cursos (LMS)                  │
│  ├─ Crear/editar cursos                    │
│  ├─ Gestionar lecciones y videos           │
│  ├─ Ver estudiantes inscritos              │
│  ├─ Sistema de inventarios                 │
│  ├─ Cupones de descuento                   │
│  └─ Reportes de ventas                     │
│                                              │
│  🎥 SECCIÓN: Clases en Vivo                │
│  ├─ Programar clases                       │
│  ├─ Iniciar sesión en vivo                 │
│  ├─ Ver grabaciones                        │
│  └─ Estadísticas de asistencia            │
│                                              │
│  💰 SECCIÓN: Pagos y Ventas                │
│  ├─ Transacciones                          │
│  ├─ Pagos pendientes                       │
│  ├─ Reembolsos                             │
│  └─ Reportes financieros                   │
│                                              │
│  📧 SECCIÓN: Marketing                     │
│  ├─ Email marketing                        │
│  ├─ Campañas activas                       │
│  ├─ Estadísticas de conversión            │
│  └─ Cupones y promociones                  │
│                                              │
│  👥 SECCIÓN: Usuarios                      │
│  ├─ Estudiantes                            │
│  ├─ Aplicantes de pruebas                 │
│  ├─ Administradores                        │
│  └─ Confirmación de emails                 │
│                                              │
└─────────────────────────────────────────────┘
```

---

## 🎥 SISTEMA DE CLASES EN VIVO ("Meet Propio")

### Arquitectura del sistema de video:

```
┌─────────────────────────────────────────────────┐
│         FRONTEND (Next.js + React)              │
│  ┌──────────────────────────────────────────┐  │
│  │  Sala de Clases                          │  │
│  │  ├─ Video del instructor (grande)        │  │
│  │  ├─ Videos de estudiantes (grid)         │  │
│  │  ├─ Chat lateral                         │  │
│  │  ├─ Pizarra interactiva                  │  │
│  │  └─ Controles (mic, cámara, compartir)  │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                      ↕
┌─────────────────────────────────────────────────┐
│         API DE VIDEO (Daily.co)                 │
│  ┌──────────────────────────────────────────┐  │
│  │  • WebRTC para video/audio               │  │
│  │  • SFU (Selective Forwarding Unit)       │  │
│  │  • Grabación en la nube                  │  │
│  │  • Hasta 50 participantes                │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                      ↕
┌─────────────────────────────────────────────────┐
│         NUESTRA BASE DE DATOS                   │
│  • Sesiones programadas                         │
│  • Historial de asistencia                      │
│  • Links de grabaciones                         │
│  • Estadísticas                                 │
└─────────────────────────────────────────────────┘
```

### Flujo de Clases en Vivo:

**Instructor:**
1. Va a `/admin/clases-vivo`
2. Crea nueva clase (título, fecha, hora, curso asociado)
3. Sistema genera link único
4. Puede compartir link o enviar invitaciones automáticas
5. En la hora programada, hace clic en "Iniciar Clase"
6. Se abre sala de video con controles de instructor

**Estudiante:**
1. Ve en su dashboard las clases programadas
2. Recibe notificación 15 min antes (email + push)
3. Hace clic en "Unirse a Clase"
4. Entra a sala de video (mic/cámara apagados por defecto)
5. Puede activar mic para preguntar (con permiso del instructor)

**Funciones de la Sala:**
- ✅ Video HD adaptativo
- ✅ Chat en tiempo real
- ✅ Compartir pantalla
- ✅ Pizarra colaborativa
- ✅ Levantar mano virtual
- ✅ Reacciones (👍 ❤️ 👏)
- ✅ Grabación automática
- ✅ Transcripción (opcional)

---

## 🎓 SISTEMA DE CURSOS (LMS)

### Modelo de Datos:

```sql
-- Curso
courses {
  id
  title
  slug
  description
  price
  thumbnail
  instructor_id
  category_id
  status (draft/published/archived)
  inventory_limit (null = ilimitado)
  sold_count
  created_at
}

-- Módulos del curso
course_modules {
  id
  course_id
  title
  order
  description
}

-- Lecciones
lessons {
  id
  module_id
  title
  type (video/text/quiz/file)
  content_url
  duration_minutes
  order
  is_free_preview
}

-- Inscripciones
enrollments {
  id
  user_id
  course_id
  payment_id
  status (active/completed/cancelled)
  progress_percentage
  enrolled_at
  completed_at
}

-- Progreso por lección
lesson_progress {
  id
  enrollment_id
  lesson_id
  completed
  watched_seconds (para videos)
  completed_at
}
```

### Sistema de Inventarios:

**Propósito:** Limitar cupos de cursos (ej: "Solo 50 lugares")

```typescript
// Ejemplo de lógica
interface Course {
  inventory_limit: number | null; // null = ilimitado
  sold_count: number;
}

function canEnroll(course: Course): boolean {
  if (course.inventory_limit === null) {
    return true; // Ilimitado
  }
  return course.sold_count < course.inventory_limit;
}

function getRemainingSeats(course: Course): number | null {
  if (course.inventory_limit === null) {
    return null; // Ilimitado
  }
  return Math.max(0, course.inventory_limit - course.sold_count);
}
```

**En el admin:**
- Crear curso → Campo "Límite de cupos" (opcional)
- Dashboard del curso → "Vendidos: 32/50" o "Vendidos: 32 (ilimitado)"
- Al comprar → Verificar disponibilidad antes de procesar pago

---

## 💳 SISTEMA DE PAGOS

### Flujo de Compra de Curso:

```
1. Estudiante selecciona curso
      ↓
2. Clic en "Comprar" → Redirige a /checkout
      ↓
3. Formulario:
   - Email (si no está logueado)
   - Método de pago (Stripe/Mercado Pago)
   - Cupón de descuento (opcional)
      ↓
4. Clic en "Pagar"
      ↓
5. Pasarela de pagos (Stripe Checkout)
      ↓
6. Webhook recibe confirmación
      ↓
7. Sistema:
   - Crea enrollment
   - Incrementa sold_count
   - Envía email de confirmación con acceso
   - Genera factura
      ↓
8. Estudiante redirigido a /mis-cursos
```

### Integración Stripe:

```typescript
// Crear sesión de pago
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function createCheckoutSession(courseId: string, userId: string) {
  const course = await getCourse(courseId);
  
  // Verificar inventario
  if (!canEnroll(course)) {
    throw new Error('Curso lleno');
  }
  
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'mxn',
        product_data: {
          name: course.title,
          images: [course.thumbnail],
        },
        unit_amount: course.price * 100, // Centavos
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_URL}/pago-exitoso?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/cursos/${course.slug}`,
    metadata: {
      course_id: courseId,
      user_id: userId,
    },
  });
  
  return session.url;
}

// Webhook para confirmar pago
async function handleStripeWebhook(event) {
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Crear inscripción
    await createEnrollment({
      user_id: session.metadata.user_id,
      course_id: session.metadata.course_id,
      payment_id: session.payment_intent,
      amount_paid: session.amount_total / 100,
    });
    
    // Enviar email de confirmación
    await sendEnrollmentEmail(session.metadata.user_id, session.metadata.course_id);
  }
}
```

---

## 📧 SISTEMA DE CONFIRMACIÓN DE EMAILS

### Flujo de Registro:

```
1. Usuario se registra
      ↓
2. Se crea cuenta con email_verified = false
      ↓
3. Sistema genera token único
      ↓
4. Envía email con link:
   https://tudominio.com/verificar-email?token=ABC123XYZ
      ↓
5. Usuario hace clic en el link
      ↓
6. Backend verifica token:
   - Si es válido → email_verified = true
   - Si expiró → Opción de reenviar
      ↓
7. Usuario puede acceder a la plataforma
```

### Implementación:

```typescript
// Modelo de usuario
users {
  id
  email
  email_verified (boolean, default: false)
  verification_token
  verification_token_expires_at
}

// Generar token al registrarse
import crypto from 'crypto';

function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

async function sendVerificationEmail(userId: string, email: string) {
  const token = generateVerificationToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
  
  // Guardar token
  await updateUser(userId, {
    verification_token: token,
    verification_token_expires_at: expiresAt,
  });
  
  // Enviar email
  const verificationUrl = `${process.env.NEXT_PUBLIC_URL}/verificar-email?token=${token}`;
  
  await sendEmail({
    to: email,
    subject: 'Verifica tu email',
    html: `
      <h1>¡Bienvenido!</h1>
      <p>Haz clic en el botón para verificar tu email:</p>
      <a href="${verificationUrl}">Verificar Email</a>
      <p>Este link expira en 24 horas.</p>
    `,
  });
}

// Verificar token
async function verifyEmail(token: string) {
  const user = await findUserByVerificationToken(token);
  
  if (!user) {
    throw new Error('Token inválido');
  }
  
  if (new Date() > user.verification_token_expires_at) {
    throw new Error('Token expirado');
  }
  
  await updateUser(user.id, {
    email_verified: true,
    verification_token: null,
    verification_token_expires_at: null,
  });
  
  return { success: true };
}
```

**Protección de rutas:**
```typescript
// Middleware
function requireVerifiedEmail(req, res, next) {
  if (!req.user.email_verified) {
    return res.redirect('/verificar-email-pendiente');
  }
  next();
}

// En rutas protegidas
app.get('/mis-cursos', requireVerifiedEmail, (req, res) => {
  // Solo usuarios verificados
});
```

---

## 📧 SISTEMA DE MARKETING

### Componentes:

```
┌────────────────────────────────────────┐
│     MARKETING AUTOMATIZADO             │
├────────────────────────────────────────┤
│                                         │
│  1. EMAIL MARKETING                    │
│     ├─ Bienvenida (al registrarse)     │
│     ├─ Confirmación de compra          │
│     ├─ Recordatorio de clase           │
│     ├─ Carrito abandonado              │
│     ├─ Curso completado                │
│     └─ Newsletter semanal              │
│                                         │
│  2. CUPONES Y DESCUENTOS               │
│     ├─ Crear cupones                   │
│     ├─ Tipos: % o $ fijo               │
│     ├─ Límite de usos                  │
│     └─ Fecha de expiración             │
│                                         │
│  3. ESTADÍSTICAS                       │
│     ├─ Tasa de apertura emails         │
│     ├─ Conversión de cupones           │
│     ├─ Ventas por canal                │
│     └─ Embudos de conversión           │
│                                         │
└────────────────────────────────────────┘
```

### Modelo de Cupones:

```sql
coupons {
  id
  code (ej: "BIENVENIDA20")
  type (percentage/fixed)
  value (20 para 20% o 500 para $500)
  max_uses (null = ilimitado)
  current_uses
  expires_at
  applies_to (all_courses/specific_courses)
  created_at
}

coupon_redemptions {
  id
  coupon_id
  user_id
  order_id
  discount_amount
  redeemed_at
}
```

### Secuencias de Email Automatizadas:

**1. Secuencia de Bienvenida:**
```
Registro → Email 1 (inmediato): Bienvenida + verificar email
        → Email 2 (+2 días): Tour de la plataforma
        → Email 3 (+5 días): Cupón de primer compra (10% OFF)
```

**2. Carrito Abandonado:**
```
Agregó curso al carrito pero no compró
        → Email 1 (+1 hora): "¿Olvidaste algo?"
        → Email 2 (+24 horas): "Última oportunidad" + cupón 15%
        → Email 3 (+72 horas): Testimonios de estudiantes
```

**3. Post-Compra:**
```
Compró curso → Email 1 (inmediato): Confirmación + acceso
            → Email 2 (+7 días): "¿Cómo vas?" + tips
            → Email 3 (al completar): Certificado + siguiente curso recomendado
```

---

## 🗄️ BASE DE DATOS COMPLETA

### Diagrama de Relaciones:

```
users ─┬─── enrollments ──── courses ──── course_modules ──── lessons
       │                                                         │
       ├─── assessments                                lesson_progress
       │    (pruebas psicométricas)
       │
       ├─── live_class_attendances ──── live_classes
       │
       ├─── orders ──── order_items
       │
       └─── email_verifications
```

### Tablas Principales:

**Usuarios:**
```sql
users {
  id uuid
  email unique
  password_hash
  name
  role (admin/instructor/student/applicant)
  email_verified boolean default false
  created_at
}
```

**Cursos:**
```sql
courses {
  id uuid
  title
  slug unique
  description
  price decimal
  inventory_limit integer nullable
  sold_count integer default 0
  status enum (draft/published/archived)
  thumbnail_url
  created_at
}
```

**Clases en Vivo:**
```sql
live_classes {
  id uuid
  course_id uuid
  title
  scheduled_at timestamp
  duration_minutes integer
  daily_room_url text (link de Daily.co)
  recording_url text nullable
  status enum (scheduled/live/completed/cancelled)
  created_at
}

live_class_attendances {
  id uuid
  live_class_id uuid
  user_id uuid
  joined_at timestamp
  left_at timestamp nullable
  duration_seconds integer
}
```

**Cupones:**
```sql
coupons {
  id uuid
  code varchar unique
  type enum (percentage/fixed)
  value decimal
  max_uses integer nullable
  current_uses integer default 0
  expires_at timestamp nullable
  active boolean default true
}
```

---

## 🔐 SEGURIDAD Y AUTENTICACIÓN

### Sistema de Roles:

```typescript
enum UserRole {
  ADMIN = 'admin',           // Acceso total
  INSTRUCTOR = 'instructor', // Crear cursos, ver ventas
  STUDENT = 'student',       // Comprar cursos
  APPLICANT = 'applicant',   // Solo pruebas psicométricas
}

// Permisos por rol
const permissions = {
  admin: ['*'], // Todo
  instructor: [
    'courses:create',
    'courses:update',
    'courses:view_sales',
    'live_classes:create',
    'live_classes:start',
  ],
  student: [
    'courses:purchase',
    'courses:view_owned',
    'live_classes:attend',
  ],
  applicant: [
    'assessments:take',
    'assessments:view_results',
  ],
};
```

### Middleware de Protección:

```typescript
// Proteger rutas del admin
export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado' });
  }
  next();
}

// Proteger cursos comprados
export function requireCourseAccess(courseId: string) {
  return async (req, res, next) => {
    const enrollment = await getEnrollment(req.user.id, courseId);
    if (!enrollment || enrollment.status !== 'active') {
      return res.status(403).json({ error: 'No tienes acceso a este curso' });
    }
    next();
  };
}
```

---

## 📁 ESTRUCTURA DE ARCHIVOS DEL PROYECTO

```
/workspace/app/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   ├── registro/
│   │   │   └── verificar-email/
│   │   │
│   │   ├── admin/
│   │   │   ├── layout.tsx (navbar del admin)
│   │   │   ├── dashboard/
│   │   │   ├── pruebas/          # Sección pruebas psicométricas
│   │   │   ├── cursos/            # Sección LMS
│   │   │   ├── clases-vivo/       # Sección meet propio
│   │   │   ├── pagos/
│   │   │   ├── marketing/
│   │   │   └── usuarios/
│   │   │
│   │   ├── estudiante/
│   │   │   ├── mis-cursos/
│   │   │   ├── certificados/
│   │   │   └── clases-programadas/
│   │   │
│   │   ├── cursos/
│   │   │   ├── [slug]/            # Página del curso
│   │   │   └── [slug]/lecciones/[id]/
│   │   │
│   │   ├── sala-clase/
│   │   │   └── [liveClassId]/     # Sala de video
│   │   │
│   │   ├── checkout/
│   │   │   └── [courseId]/
│   │   │
│   │   └── api/
│   │       ├── auth/
│   │       ├── courses/
│   │       ├── enrollments/
│   │       ├── live-classes/
│   │       ├── payments/
│   │       │   └── webhook/       # Stripe webhook
│   │       ├── email/
│   │       └── coupons/
│   │
│   ├── components/
│   │   ├── admin/
│   │   ├── courses/
│   │   ├── live-class/
│   │   │   ├── VideoRoom.tsx
│   │   │   ├── Whiteboard.tsx
│   │   │   └── Chat.tsx
│   │   └── ui/
│   │
│   ├── lib/
│   │   ├── db/                    # Drizzle ORM
│   │   ├── daily.ts               # Daily.co cliente
│   │   ├── stripe.ts
│   │   ├── email.ts               # Resend
│   │   └── auth.ts
│   │
│   └── types/
│
└── package.json
```

---

## 🚀 STACK TECNOLÓGICO

| Componente | Tecnología | Por qué |
|------------|-----------|---------|
| **Frontend** | Next.js 15 + React 19 | Server Components, App Router |
| **Lenguaje** | TypeScript | Type safety |
| **Base de datos** | PostgreSQL (Neon) | Relacional, JSONB, escalable |
| **ORM** | Drizzle | Ligero, type-safe |
| **Autenticación** | NextAuth.js | OAuth + credenciales |
| **Pagos** | Stripe | Fácil integración, confiable |
| **Video en vivo** | Daily.co | WebRTC, SFU, hasta 50 personas |
| **Email** | Resend | API moderna, templates |
| **Storage** | Cloudflare R2 | Videos, archivos, barato |
| **Chat tiempo real** | Pusher o Ably | WebSockets |
| **Pizarra** | Tldraw | Open source, buena UX |
| **Hosting** | Vercel | Serverless, edge functions |

---

## 📊 CRONOGRAMA DE IMPLEMENTACIÓN

| Mes | Funcionalidad |
|-----|---------------|
| **Sep 2026** | • Terminar PsycoTest<br>• Base de datos completa<br>• Sistema de auth + verificación email<br>• Panel admin base |
| **Oct 2026** | • Catálogo de cursos<br>• Reproductor de video<br>• Sistema de pagos Stripe<br>• **Primera venta posible** ✅ |
| **Nov 2026** | • Integración Daily.co<br>• Sala de clases en vivo<br>• Chat en tiempo real<br>• Grabaciones |
| **Dic 2026** | • Pizarra interactiva<br>• Panel admin: clases en vivo<br>• Email marketing básico |
| **Ene 2027** | • Panel admin completo<br>• Sistema de inventarios<br>• Cupones y descuentos<br>• Reportes de ventas |
| **Feb 2027** | • Micrositios<br>• Optimización SEO<br>• Secuencias de email automatizadas |
| **Mar 2027** | • Testing completo<br>• Corrección de bugs<br>• Capacitación<br>• **Lanzamiento oficial** 🚀 |

---

## ✅ RESUMEN EJECUTIVO

**3 Áreas Principales:**
1. 🧪 Pruebas Psicométricas (ya está casi listo)
2. 🎓 Cursos (LMS completo)
3. 🎥 Clases en Vivo (meet propio)

**Panel Único de Admin:**
- Gestiona las 3 áreas desde un solo lugar
- Dashboard unificado con métricas
- Navegación por pestañas/secciones

**Funcionalidades Clave:**
✅ Sistema de inventarios para cursos  
✅ Cobro con Stripe (tarjetas)  
✅ Confirmación de emails obligatoria  
✅ Meet propio con Daily.co (50 personas)  
✅ Marketing automatizado  
✅ Cupones y descuentos  
✅ Reportes y estadísticas  

**Timeline:** 7 meses (sept 2026 - marzo 2027)

**Siguiente paso:** ¿Empezamos con la base de datos y el sistema de auth?

---

**Fecha:** 31 de Agosto, 2026  
**Versión:** 2.0 - Arquitectura Detallada
