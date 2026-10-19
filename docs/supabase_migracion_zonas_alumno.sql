-- ================================================================== --
-- Migración — zonas de alumno por canal
-- Idempotente. Supabase → SQL Editor → Run.
-- ================================================================== --

-- Cada escuela pertenece a un canal: determina en qué zona privada
-- aparecen sus cursos, para que quien compró en un canal no vea otro.
ALTER TABLE course_categories
  ADD COLUMN IF NOT EXISTS channel_id text NOT NULL DEFAULT 'ige';

COMMENT ON COLUMN course_categories.channel_id IS
  'Canal dueño de la escuela: ceduct | psicologia | ige.';

-- La empresa que contrató una evaluación puede ver los resultados de
-- sus propios candidatos, sin entrar al panel de administración.
ALTER TABLE access_codes
  ADD COLUMN IF NOT EXISTS cliente_user_id text REFERENCES users(id);

COMMENT ON COLUMN access_codes.cliente_user_id IS
  'Cuenta de la empresa que contrató; le da acceso a sus resultados.';
