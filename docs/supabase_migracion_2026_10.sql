-- ================================================================== --
-- Migración — octubre 2026
--
-- Dos cambios sobre el esquema de docs/supabase_init.sql:
--   1. channel_pages  — contenido editable de las páginas públicas.
--      Antes se guardaba en /tmp, que en Vercel es efímero: todo lo que
--      se editaba desde /admin/canales se perdía en el siguiente deploy.
--   2. users.privy_id — vincula una cuenta con su identidad en Privy.
--
-- Es idempotente: se puede ejecutar varias veces sin romper nada.
-- Pégalo en Supabase → SQL Editor → Run.
-- ================================================================== --

-- 1) Contenido editable de los canales públicos ---------------------- --
CREATE TABLE IF NOT EXISTS channel_pages (
  channel_id      text PRIMARY KEY,
  seo_title       text    NOT NULL,
  seo_description text    NOT NULL,
  published       boolean NOT NULL DEFAULT true,
  hero            jsonb   NOT NULL,
  sections        jsonb   NOT NULL,
  updated_at      text    NOT NULL
);

COMMENT ON TABLE channel_pages IS
  'Contenido editable de cada canal público, administrado desde /admin/canales.';

-- 2) Identidad de Privy en la tabla de usuarios ---------------------- --
ALTER TABLE users ADD COLUMN IF NOT EXISTS privy_id text;

-- Único, pero permitiendo varios NULL (cuentas que entran con contraseña)
CREATE UNIQUE INDEX IF NOT EXISTS users_privy_id_key
  ON users (privy_id)
  WHERE privy_id IS NOT NULL;

COMMENT ON COLUMN users.privy_id IS
  'Identificador de Privy (did:privy:...). NULL si la cuenta solo usa contraseña.';

-- Comprobación ------------------------------------------------------- --
DO $$
BEGIN
  RAISE NOTICE 'channel_pages existe: %',
    (SELECT count(*) > 0 FROM information_schema.tables
      WHERE table_name = 'channel_pages');
  RAISE NOTICE 'users.privy_id existe: %',
    (SELECT count(*) > 0 FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'privy_id');
END $$;
