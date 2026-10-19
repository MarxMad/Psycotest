-- PsycoTest / Martín Hernández — esquema SQLite (Turso o local)
-- Preferido: desde app/ ejecutar `npm run db:push` con TURSO_DATABASE_URL + TURSO_AUTH_TOKEN
-- Este archivo es referencia manual si no usas Drizzle push.

PRAGMA foreign_keys = ON;

-- ─── Core clínico ───
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'psicologo',
  stripe_customer_id TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS participants (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  edad TEXT,
  sexo TEXT,
  estado_civil TEXT,
  estudios TEXT,
  ocupacion TEXT,
  empresa TEXT,
  notas TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS job_profiles (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  empresa TEXT,
  mabe_puesto TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS access_codes (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  empresa TEXT,
  lookup_hash TEXT NOT NULL UNIQUE,
  code_suffix TEXT NOT NULL,
  allowed_instruments TEXT NOT NULL,
  max_uses INTEGER NOT NULL,
  used_count INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  expires_at TEXT,
  created_by_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS access_redemptions (
  id TEXT PRIMARY KEY,
  access_code_id TEXT NOT NULL REFERENCES access_codes(id),
  participant_nombre TEXT NOT NULL,
  empresa TEXT,
  puesto TEXT,
  completed_instruments TEXT NOT NULL DEFAULT '[]',
  ip_hash TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS assessment_sessions (
  id TEXT PRIMARY KEY,
  instrumento TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'calificada',
  participant_id TEXT REFERENCES participants(id),
  participant_nombre TEXT NOT NULL,
  job_profile_id TEXT REFERENCES job_profiles(id),
  puesto TEXT,
  empresa TEXT,
  respuestas TEXT NOT NULL,
  calificacion TEXT,
  interpretacion TEXT,
  notas_psicologo TEXT,
  aprobada INTEGER NOT NULL DEFAULT 0,
  validity_flags TEXT,
  created_by_id TEXT REFERENCES users(id),
  approved_by_id TEXT REFERENCES users(id),
  access_code_id TEXT REFERENCES access_codes(id),
  access_redemption_id TEXT REFERENCES access_redemptions(id),
  iniciada TEXT NOT NULL,
  actualizada TEXT NOT NULL,
  terminada INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  detail TEXT,
  created_at TEXT NOT NULL
);

-- ─── Cursos ───
CREATE TABLE IF NOT EXISTS course_categories (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  category_id TEXT NOT NULL REFERENCES course_categories(id),
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT NOT NULL,
  thumbnail_url TEXT,
  instructor_name TEXT NOT NULL,
  instructor_bio TEXT,
  price_mxn INTEGER NOT NULL DEFAULT 0,
  stripe_price_id TEXT,
  level TEXT NOT NULL DEFAULT 'basico',
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS course_modules (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS course_lessons (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  free_preview INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS course_enrollments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  course_id TEXT NOT NULL REFERENCES courses(id),
  status TEXT NOT NULL DEFAULT 'pending',
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  progress_percent INTEGER NOT NULL DEFAULT 0,
  enrolled_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS lesson_progress (
  id TEXT PRIMARY KEY,
  enrollment_id TEXT NOT NULL REFERENCES course_enrollments(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
  completed INTEGER NOT NULL DEFAULT 0,
  last_position_seconds INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  created_at TEXT NOT NULL
);
